<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-lg font-bold text-ink">ASR</h1>
      <button class="btn" :class="isOpen ? 'btn-danger' : 'btn-primary'" @click="click">
        {{ isOpen ? '断开连接' : '选择端口' }}
        <span v-if="isOpen" class="ml-1 inline-block size-2 rounded-full bg-green-500" />
      </button>
    </div>

    <template v-if="isOpen">
      <section class="card">
        <h2 class="card-title">工厂模式</h2>
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="sendCommand('AT*PROD=1')">进入工厂模式</button>
          <button class="btn" @click="sendCommand('AT*PROD=0')">退出工厂模式</button>
        </div>
        <p class="hint mt-2">需开启工厂模式才能写号，写入之前先删除</p>
      </section>

      <section class="card">
        <h2 class="card-title">写号</h2>
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20">IMEI:</label>
            <input v-model="imei" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="sendCommand('AT+CGSN')">读取</button>
            <button class="btn" @click="sendCommand('AT*MRD_IMEI=D')">删除</button>
            <button
              class="btn btn-primary"
              @click="sendCommand('AT*MRD_IMEI=W,0,01JAN1970,' + imei)"
            >
              写入
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20">SN:</label>
            <input
              v-model="sn"
              type="text"
              placeholder="仅支持有SN号的设备"
              class="input min-w-0 flex-1 font-mono"
            />
            <button class="btn" @click="sendCommand('AT*MRD_SN?')">读取</button>
            <button class="btn" @click="sendCommand('AT*MRD_SN=D')">删除</button>
            <button class="btn btn-primary" @click="sendCommand('AT*MRD_SN=W,0,01JAN1970,' + sn)">
              写入
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20">MAC:</label>
            <input v-model="mac" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="sendCommand('AT*MRD_WIFIID?')">读取</button>
            <button class="btn" @click="sendCommand('AT*MRD_WIFIID=D')">删除</button>
            <button
              class="btn btn-primary"
              @click="sendCommand('AT*MRD_WIFIID=W,0,01JAN1970,' + mac)"
            >
              写入
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">SIM 与设备</h2>
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="sendCommand('AT+SWSIM=0')">切到卡1</button>
          <button class="btn" @click="sendCommand('AT+SWSIM=1')">切到卡2</button>
          <button class="btn" @click="sendCommand('AT+RESET')">重启</button>
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
  name: 'ASRView',
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
      imei: '',
      sn: '',
      mac: '',
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
      setTimeout(() => this.sendCommand('AT+CGSN'), 500)
      setTimeout(() => this.sendCommand('AT*MRD_SN?'), 1000)
      setTimeout(() => this.sendCommand('AT*MRD_WIFIID?'), 1500)
      setTimeout(() => this.getBand(), 2000)
    },

    async sendCommand(command) {
      if (!this.isOpen) {
        return
      }

      try {
        await this.serialManager.sendCommand(command)
        // 延迟读取响应
        setTimeout(() => this.readResponse(), 500)
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
      // 解析IMEI
      if (str.includes('+CGSN: ')) {
        this.imei = str.split('+CGSN: ')[1].split('\r\n')[0]
      } else if (str.includes('AT+CGSN\r\r\n')) {
        this.imei = str.split('AT+CGSN\r\r\n')[1].split('\r\n')[0]
      }

      // 解析SN
      if (str.includes('*MRD_SN:')) {
        this.sn = str.split('*MRD_SN:')[1].split('\r\n')[0]
      }

      // 解析MAC地址
      if (str.includes('*MRD_WIFIID: ')) {
        this.mac = str.split('*MRD_WIFIID: ')[1].split('\r\n')[0].replaceAll(':', '')
      }

      // 解析频段信息
      if (str.includes('*BAND:') && str.length > 20) {
        this.bandStr = str.split('*BAND:')[1].split('\r\n')[0]
        this.checked = this.parseLockedBand(this.bandStr)
      }
    },

    // 与旧逻辑一致：bandH/bandL 两个位图字段合成已选频段
    parseLockedBand(bandStr) {
      let arr = bandStr.split(',')
      if (arr.length < 5) {
        return []
      }
      let bandH = parseInt(arr[3]) || 0
      let bandL = parseInt(arr[4]) || 0
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
      // 低位图：bit0-bit4 对应 B1-B5，仅保留列表内的频段
      bandL
        .toString(2)
        .split('')
        .reverse()
        .forEach((item, index) => {
          if (item === '1' && [1, 3, 5, 8].includes(index + 1)) {
            checked.push(index + 1)
          }
        })
      return checked
    },

    getBand() {
      this.sendCommand('AT*BAND?')
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
      let bandArr = this.bandStr.split(',')
      if (bandArr.length < 5) {
        bandArr = ['0', '0', '0', '0', '0']
      }
      bandArr[3] = bandH
      bandArr[4] = bandL
      this.sendCommand(`AT*BAND=${bandArr.join(',')}`)
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
