/**
 * 串口通信工具类
 * 提供统一的串口操作接口
 */
export class SerialPortManager {
  constructor() {
    this.port = null
    this.reader = null
    this.writer = null
    this.isOpen = false
    this.dataHandler = null
    this.errorHandler = null
    this.readLoopAbort = null
  }

  /**
   * 检查浏览器是否支持Web Serial API
   */
  static isSupported() {
    return 'serial' in navigator
  }

  /**
   * 请求用户选择串口设备
   */
  async requestPort() {
    try {
      this.port = await navigator.serial.requestPort()
      return true
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler(error)
      }
      return false
    }
  }

  /**
   * 打开串口连接
   */
  async openPort(options = {}) {
    if (!this.port) {
      throw new Error('No port selected')
    }

    const defaultOptions = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    }

    try {
      await this.port.open({ ...defaultOptions, ...options })
      this.reader = this.port.readable.getReader()
      this.writer = this.port.writable.getWriter()
      this.isOpen = true
      this.startReadLoop()
      return true
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler(error)
      }
      return false
    }
  }

  /**
   * 关闭串口连接
   * 先中止后台读取循环，再释放读写锁并关闭端口；
   * 取消读取与释放锁的失败都不阻断关闭流程，避免端口被遗留在打开状态
   */
  async closePort() {
    if (!this.isOpen) {
      return
    }

    try {
      if (this.readLoopAbort) {
        this.readLoopAbort.aborted = true
        this.readLoopAbort = null
        // 中断挂起的 read()，使读取循环尽快退出
        await this.cancelReader()
      }
      this.releaseReader()
      this.releaseWriter()
      if (this.port) {
        await this.port.close()
      }
    } catch (error) {
      console.error('Error closing port:', error)
    } finally {
      this.port = null
      this.reader = null
      this.writer = null
      this.isOpen = false
    }
  }

  /**
   * 取消挂起的读取请求（失败仅记录，不阻断关闭流程）
   */
  async cancelReader() {
    if (!this.reader) {
      return
    }

    try {
      await this.reader.cancel()
    } catch (error) {
      console.error('Error cancelling reader:', error)
    }
  }

  /**
   * 释放读取锁（读取请求尚未结算时可能抛错，不影响端口关闭）
   */
  releaseReader() {
    if (!this.reader) {
      return
    }

    try {
      this.reader.releaseLock()
    } catch (error) {
      console.error('Error releasing reader:', error)
    }
  }

  /**
   * 释放写入锁（写入尚未结算时可能抛错，不影响端口关闭）
   */
  releaseWriter() {
    if (!this.writer) {
      return
    }

    try {
      this.writer.releaseLock()
    } catch (error) {
      console.error('Error releasing writer:', error)
    }
  }

  /**
   * 发送AT命令
   */
  async sendCommand(command) {
    if (!this.isOpen || !this.writer) {
      throw new Error('Port is not open')
    }

    try {
      const data = this.stringToUint8Array(command + '\r\n')
      await this.writer.write(data)
      return true
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler(error)
      }
      return false
    }
  }

  /**
   * 启动后台持续读取循环
   * 连接期间循环消费串口数据并回调 dataHandler，多帧响应不会被滞留
   */
  startReadLoop() {
    this.readLoopAbort = { aborted: false }

    // 读取循环闭包：abort 标记置位或调用 cancel() 后退出
    const loop = async () => {
      const abort = this.readLoopAbort
      // 标记循环是否因设备掉线或读取错误被动结束（区别于用户主动断开）
      let interrupted = false
      while (abort && !abort.aborted && this.isOpen && this.reader) {
        try {
          const { value, done } = await this.reader.read()
          if (done) {
            interrupted = true
            break
          }
          const data = this.uint8ArrayToString(value)
          if (this.dataHandler) {
            this.dataHandler(data)
          }
        } catch (error) {
          if (abort.aborted) {
            break
          }
          if (this.errorHandler) {
            this.errorHandler(error)
          }
          interrupted = true
          break
        }
      }
      if (this.readLoopAbort === abort) {
        this.readLoopAbort = null
      }
      // 被动结束说明链路已不可用：关闭端口复位状态，避免界面一直停留在“已连接”
      if (interrupted) {
        this.closePort()
      }
    }

    loop()
  }

  /**
   * 设置数据处理器
   */
  setDataHandler(handler) {
    this.dataHandler = handler
  }

  /**
   * 设置错误处理器
   */
  setErrorHandler(handler) {
    this.errorHandler = handler
  }

  /**
   * 字符串转Uint8Array
   */
  stringToUint8Array(str) {
    const arr = []
    for (let i = 0; i < str.length; i++) {
      arr.push(str.charCodeAt(i))
    }
    return new Uint8Array(arr)
  }

  /**
   * Uint8Array转字符串
   */
  uint8ArrayToString(uint8Array) {
    let dataString = ''
    for (let i = 0; i < uint8Array.length; i++) {
      dataString += String.fromCharCode(uint8Array[i])
    }
    return dataString
  }
}
