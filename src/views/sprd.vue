<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-lg font-bold text-ink">展锐</h1>
      <button class="btn" :class="isOpen ? 'btn-danger' : 'btn-primary'" @click="click">
        {{ isOpen ? '断开连接' : '选择端口' }}
        <span v-if="isOpen" class="ml-1 inline-block size-2 rounded-full bg-green-500" />
      </button>
    </div>

    <template v-if="isOpen">
      <section class="card">
        <h2 class="card-title">IMEI 写号</h2>
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20">IMEI1:</label>
            <input v-model="imei1" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="readIMEI1()">读取</button>
            <button
              class="btn btn-primary"
              @click="sendCommand(`AT+SPIMEI =0,&quot;${imei1}&quot;`)"
            >
              写入
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20">IMEI2:</label>
            <input v-model="imei2" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="readIMEI2()">读取</button>
            <button
              class="btn btn-primary"
              @click="sendCommand(`AT+SPIMEI =1,&quot;${imei2}&quot;`)"
            >
              写入
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">设备</h2>
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="sendCommand('AT+RESET=1')">重启</button>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">频段锁定</h2>
        <BandSelector
          :available-bands="list"
          :is-connected="isOpen"
          :initial-selected-bands="checked"
          @read-bands="getBand"
          @submit-bands="submit"
        />
      </section>

      <section class="card">
        <h2 class="card-title">串口控制台</h2>
        <SerialConsole
          :output-data="dataR"
          :is-connected="isOpen"
          @send-command="sendCommand"
          @clear-output="dataR = ''"
        />
      </section>
    </template>

    <p v-else class="text-center text-sm text-ink-soft/70">请连接设备以使用 AT 命令功能</p>
  </div>
</template>

<script>
import { SerialPortManager } from '../utils/serial.js'
import BandSelector from '../components/BandSelector.vue'
import SerialConsole from '../components/SerialConsole.vue'

export default {
  name: 'SprdView',
  components: {
    BandSelector,
    SerialConsole
  },
  data() {
    return {
      serialManager: null,
      isOpen: false,
      dataR: '',
      timer: null,
      list: [1, 3, 5, 8, 38, 39, 40, 41],
      checked: [],
      // 当前读取的是卡1还是卡2的IMEI（1 表示卡1，2 表示卡2）
      activeSim: 0,
      imei1: '',
      imei2: '',
      bandStr: ''
    }
  },
  created() {
    this.serialManager = new SerialPortManager()
    this.serialManager.setDataHandler(this.handleSerialData)
    this.serialManager.setErrorHandler(this.handleSerialError)

    // 定时检查连接状态
    this.timer = setInterval(() => {
      this.isOpen = this.serialManager.isOpen
    }, 100)
  },
  beforeUnmount() {
    this.cleanup()
  },
  methods: {
    async click() {
      if (!SerialPortManager.isSupported()) {
        alert('该浏览器不支持，仅支持基于chromium内核的pc浏览器')
        return
      }

      try {
        if (this.isOpen) {
          // 断开连接
          await this.serialManager.closePort()
        } else {
          // 请求端口并连接
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
        if (error.message && !error.message.includes('No port selected by the user')) {
          alert(error.message)
        }
      }
    },

    initializeData() {
      // 延迟发送初始化命令
      setTimeout(() => this.readIMEI1(), 500)
      setTimeout(() => this.readIMEI2(), 1300)
      setTimeout(() => this.getBand(), 2100)
    },

    readIMEI1() {
      this.activeSim = 1
      this.sendCommand('AT+SPACTCARD=0')
      this.sendCommand('AT+SPIMEI?')
    },

    readIMEI2() {
      this.activeSim = 2
      this.sendCommand('AT+SPACTCARD=1')
      this.sendCommand('AT+SPIMEI?')
    },

    getBand() {
      this.sendCommand('AT+SPLBAND=0')
    },

    async sendCommand(command) {
      if (!this.isOpen) {
        return
      }

      try {
        await this.serialManager.sendCommand(command)
        // 延迟读取响应
        setTimeout(() => this.readResponse(), 300)
      } catch (error) {
        console.error('Send command error:', error)
        this.handleSerialError(error)
      }
    },

    async readResponse() {
      try {
        // readData 会触发 dataHandler，日志追加与解析都在其中完成
        await this.serialManager.readData()
      } catch (error) {
        console.error('Read response error:', error)
      }
    },

    handleSerialData(data) {
      this.dataR += data
      this.parseResponse(data)
    },

    handleSerialError(error) {
      console.error('Serial error:', error)
      if (error.message && !error.message.includes('No port selected by the user')) {
        alert(`串口错误: ${error.message}`)
      }
    },

    parseResponse(str) {
      // 解析双卡IMEI：15位数字行，前后都是空行时认为是IMEI
      let arr = str.split('\r\n')
      if (arr.length >= 3) {
        arr.forEach((item, i) => {
          if (item.length === 15 && arr[i - 1] === '' && arr[i + 1] === '') {
            if (this.activeSim === 1) {
              this.imei1 = item
            }
            if (this.activeSim === 2) {
              this.imei2 = item
            }
          }
        })
      }

      // 解析频段信息
      if (str.includes('+SPLBAND: ')) {
        let arr = str.split('+SPLBAND: ')[1].split('\r\n')[0].split(',')
        if (arr.length >= 4) {
          this.bandStr = arr.join(',')
          let bandH = parseInt(arr[1]) || 0
          let bandL = parseInt(arr[3]) || 0
          this.checked = this.parseLockedBand(bandH, bandL)
        }
      }
    },

    // 与旧逻辑一致：bandH/bandL 两个位图字段合成已选频段
    parseLockedBand(bandH, bandL) {
      let checked = []
      // 高位图：bit5-bit8 对应 B38-B41
      bandH
        .toString(2)
        .split('')
        .reverse()
        .forEach((item, index) => {
          if (item === '1') {
            if (index === 5) {
              checked.push(38)
            }
            if (index === 6) {
              checked.push(39)
            }
            if (index === 7) {
              checked.push(40)
            }
            if (index === 8) {
              checked.push(41)
            }
          }
        })
      // 低位图：所有置位的频段
      checked.push(...this.getSupportedBand(bandL.toString(2)))
      return checked
    },

    getSupportedBand(binStr) {
      // 与旧逻辑一致：二进制位倒序后按位置推算频段号
      return binStr.split('').reduce((p, c, i) => {
        if (c === '1') {
          p.push(i + 1)
        }
        return p
      }, [])
    },

    submit(selectedBands) {
      let bandH = 0
      let bandL = 0
      selectedBands.forEach(item => {
        if (item <= 20) {
          bandL += Math.pow(2, item - 1)
        }
        if (item >= 38 && item <= 41) {
          bandH += Math.pow(2, item - 33)
        }
      })
      this.sendCommand(`AT+SPLBAND=1,0,${bandH},0,${bandL},0`)
    },

    cleanup() {
      if (this.timer) {
        clearInterval(this.timer)
      }
      if (this.serialManager) {
        this.serialManager.closePort()
      }
    }
  }
}
</script>
