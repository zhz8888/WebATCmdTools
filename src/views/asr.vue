<template>
  <div class="atMaster" style="padding: 10px">
    <button @click="click">选择端口 {{ isOpen ? '（已开启）' : '（未开启）' }}</button>
    <div v-show="isOpen" class="content">
      <div>
        <button @click="sendCommand('AT*PROD=1')">工厂模式</button>
        <button @click="sendCommand('AT*PROD=0')">退出工厂模式</button>
      </div>
      <label style="opacity: 0.5">需开启工厂模式才能写号，写入之前先删除</label>
      <div style="padding: 10px 0">
        <label>IMEI: </label>
        <input v-model="imei" type="text" />
        <button @click="sendCommand('AT+CGSN')">读取</button>
        <button @click="sendCommand('AT*MRD_IMEI=D')">删除</button>
        <button @click="sendCommand('AT*MRD_IMEI=W,0,01JAN1970,' + imei)">写入</button>
      </div>
      <div style="padding: 10px 0">
        <label>SN: </label>
        <input v-model="sn" type="text" placeholder="仅支持有SN号的设备" />
        <button @click="sendCommand('AT*MRD_SN?')">读取</button>
        <button @click="sendCommand('AT*MRD_SN=D')">删除</button>
        <button @click="sendCommand('AT*MRD_SN=W,0,01JAN1970,' + sn)">写入</button>
      </div>
      <div style="padding: 10px 0">
        <label>MAC: </label>
        <input v-model="mac" type="text" />
        <button @click="sendCommand('AT*MRD_WIFIID?')">读取</button>
        <button @click="sendCommand('AT*MRD_WIFIID=D')">删除</button>
        <button @click="sendCommand('AT*MRD_WIFIID=W,0,01JAN1970,' + mac)">写入</button>
      </div>
      <div>
        <button @click="sendCommand('AT+SWSIM=0')">切到卡1</button>
        <button @click="sendCommand('AT+SWSIM=1')">切到卡2</button>
        <button @click="sendCommand('AT+RESET')">重启</button>
      </div>
      <BandSelector
        :available-bands="list"
        :is-connected="isOpen"
        :initial-selected-bands="checked"
        @read-bands="getBand"
        @submit-bands="submit"
      />
      <SerialConsole
        :output-data="dataR"
        :is-connected="isOpen"
        @send-command="sendCommand"
        @clear-output="dataR = ''"
      />
    </div>
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
  watch: {
    dataR() {
      this.$nextTick(() => {
        const textarea = document.getElementById('scroll_text')
        if (textarea) {
          textarea.scrollTop = textarea.scrollHeight
        }
      })
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

<style scoped>
.atMaster {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

button {
  margin: 5px 10px;
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #999;
}

input {
  margin: 0 5px;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

input:focus {
  outline: none;
  border-color: #1890ff;
}

.content {
  margin-top: 20px;
}

label {
  font-weight: bold;
  margin-right: 5px;
}
</style>
