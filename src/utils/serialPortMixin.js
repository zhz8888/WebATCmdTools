import { SerialPortManager } from './serial.js'

/**
 * 串口连接生命周期混入工厂
 *
 * 为 AT 命令页面提供统一的连接管理：状态轮询、端口开关、
 * 数据回调转发（onSerialData）与错误提示（onSerialError）。
 * 使用方需实现 initializeData()（连接成功后的初始化命令），
 * 并可通过 dataR 数据属性接收原始串口日志。
 */
export function createSerialPortMixin() {
  return {
    data() {
      return {
        serialManager: null,
        isOpen: false,
        timer: null,
        dataR: ''
      }
    },
    created() {
      this.serialManager = new SerialPortManager()
      this.serialManager.setDataHandler(this.onSerialData)
      this.serialManager.setErrorHandler(this.onSerialError)

      // 定时检查连接状态
      this.timer = setInterval(() => {
        this.isOpen = this.serialManager.isOpen
      }, 100)
    },
    beforeUnmount() {
      if (this.timer) {
        clearInterval(this.timer)
      }
      if (this.serialManager) {
        this.serialManager.closePort()
      }
    },
    methods: {
      // 切换串口连接：未连接时请求端口并打开，已连接时断开
      async togglePort() {
        if (!SerialPortManager.isSupported()) {
          alert('该浏览器不支持，仅支持基于chromium内核的pc浏览器')
          return
        }

        try {
          if (this.isOpen) {
            // 断开连接
            await this.serialManager.closePort()
          } else {
            // 请求端口并连接，连接成功后由页面初始化查询
            const portSelected = await this.serialManager.requestPort()
            if (portSelected) {
              const opened = await this.serialManager.openPort()
              if (opened) {
                this.initializeData()
              }
            }
          }
        } catch (error) {
          console.error('Connection error:', error)
          this.onSerialError(error)
        }
      },

      // 向串口发送 AT 命令，发送失败时经 onSerialError 提示
      async sendCommand(command) {
        if (!this.isOpen) {
          return
        }

        try {
          await this.serialManager.sendCommand(command)
        } catch (error) {
          console.error('Send command error:', error)
          this.onSerialError(error)
        }
      },

      // 串口数据回调：追加原始日志并交给页面解析响应
      onSerialData(data) {
        this.dataR += data
        if (this.parseResponse) {
          this.parseResponse(data)
        }
      },

      // 串口错误处理：控制台记录并弹窗提示（忽略用户取消选择端口的情况）
      onSerialError(error) {
        console.error('Serial error:', error)
        if (error.message && !error.message.includes('No port selected by the user')) {
          alert(`串口错误: ${error.message}`)
        }
      }
    }
  }
}
