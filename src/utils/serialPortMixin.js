import { SerialPortManager } from './serial.js'

// 串口原始日志保留上限（字符数），超出后仅保留最近的内容
const MAX_LOG_LENGTH = 131072
// 解析行缓冲上限（字符数），避免设备持续输出无换行内容时缓冲无界增长
const MAX_PARSE_BUFFER = 4096
// 日志被截断后置于日志开头的提示
const TRUNCATE_NOTICE = '…（较早日志已省略）…\r\n'

/**
 * 串口连接生命周期混入工厂
 *
 * 为 AT 命令页面提供统一的连接管理：状态轮询、端口开关、
 * 数据回调转发（onSerialData 按完整行调用 parseResponse）与错误提示（onSerialError）。
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
        dataR: '',
        // 尚未组成完整行的响应片段，等后续分块补齐后再解析
        parseBuffer: '',
        // 页面排期的延迟动作，随组件卸载统一清理
        pendingTimers: []
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
      this.clearPendingTimers()
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
              // 读取循环启动前清空缓冲，不继承上次会话残留的半行响应
              this.parseBuffer = ''
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
        // 以串口管理器的真实状态为准，避免卸载或断开后残留的延迟命令弹出错误提示
        if (!this.serialManager?.isOpen) {
          return
        }

        try {
          await this.serialManager.sendCommand(command)
        } catch (error) {
          console.error('Send command error:', error)
          this.onSerialError(error)
        }
      },

      // 延迟执行串口相关动作，句柄登记后随组件卸载统一清理
      later(callback, delay) {
        const id = setTimeout(callback, delay)
        this.pendingTimers.push(id)
        return id
      },

      // 清理尚未触发的延迟动作
      clearPendingTimers() {
        this.pendingTimers.forEach(id => clearTimeout(id))
        this.pendingTimers = []
      },

      // 串口数据回调：追加原始日志并按完整行交给页面解析响应
      onSerialData(data) {
        this.appendLog(data)
        this.parseCompleteLines(data)
      },

      // 追加串口原始日志，超出上限时只保留最近的内容
      appendLog(data) {
        const next = this.dataR + data
        this.dataR =
          next.length > MAX_LOG_LENGTH ? TRUNCATE_NOTICE + next.slice(-MAX_LOG_LENGTH) : next
      },

      // 按完整行解析响应：跨分块的半行留在缓冲中，等后续数据补齐后再解析
      parseCompleteLines(data) {
        if (!this.parseResponse) {
          return
        }

        const buffer = (this.parseBuffer + data).slice(-MAX_PARSE_BUFFER)
        const lastBreak = buffer.lastIndexOf('\n')
        if (lastBreak < 0) {
          this.parseBuffer = buffer
          return
        }

        this.parseBuffer = buffer.slice(lastBreak + 1)
        // 前置一个空行，保证依赖空行相邻判断的解析（如展锐 IMEI）在分包时依然成立
        this.parseResponse(`\r\n${buffer.slice(0, lastBreak + 1)}`)
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
