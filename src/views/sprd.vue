<template>
  <!-- 展锐平台页：设备状态栏 + 工作区（双 IMEI/设备/频段/控制台） -->
  <div class="flex flex-col gap-3">
    <DeviceBar title="展锐" tag="SPRD" :connected="isOpen" @toggle="togglePort" />

    <div v-if="isOpen" class="panel workspace space-y-6">
      <SectionPanel tag="NVRAM" title="IMEI 写号" cmd="AT+SPIMEI">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20" for="sprd-imei1">IMEI1</label>
            <input
              id="sprd-imei1"
              v-model="imei1"
              type="text"
              class="input min-w-0 flex-1 font-mono"
            />
            <button class="btn" @click="readIMEI1()">读取</button>
            <button
              class="btn btn-primary"
              @click="sendCommand(`AT+SPIMEI =0,&quot;${imei1}&quot;`)"
            >
              写入
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20" for="sprd-imei2">IMEI2</label>
            <input
              id="sprd-imei2"
              v-model="imei2"
              type="text"
              class="input min-w-0 flex-1 font-mono"
            />
            <button class="btn" @click="readIMEI2()">读取</button>
            <button
              class="btn btn-primary"
              @click="sendCommand(`AT+SPIMEI =1,&quot;${imei2}&quot;`)"
            >
              写入
            </button>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel tag="DEVICE" title="设备" cmd="AT+RESET">
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="sendCommand('AT+RESET=1')">重启</button>
        </div>
      </SectionPanel>

      <SectionPanel tag="RF" title="频段锁定" cmd="AT+SPLBAND">
        <BandSelector
          :available-bands="list"
          :is-connected="isOpen"
          :initial-selected-bands="checked"
          @read-bands="getBand"
          @submit-bands="submit"
        />
      </SectionPanel>

      <SectionPanel tag="CONSOLE" title="串口控制台">
        <SerialConsole
          :output-data="dataR"
          :is-connected="isOpen"
          @send-command="sendCommand"
          @clear-output="dataR = ''"
        />
      </SectionPanel>
    </div>

    <div v-else class="panel">
      <ConnectPrompt @connect="togglePort" />
    </div>
  </div>
</template>

<script>
import BandSelector from '../components/BandSelector.vue'
import ConnectPrompt from '../components/ConnectPrompt.vue'
import DeviceBar from '../components/DeviceBar.vue'
import SectionPanel from '../components/SectionPanel.vue'
import SerialConsole from '../components/SerialConsole.vue'
import { createSerialPortMixin } from '../utils/serialPortMixin.js'

export default {
  name: 'SprdView',
  components: {
    BandSelector,
    ConnectPrompt,
    DeviceBar,
    SectionPanel,
    SerialConsole
  },
  mixins: [createSerialPortMixin()],
  data() {
    return {
      list: [1, 3, 5, 8, 38, 39, 40, 41],
      checked: [],
      // 下一条 15 位数字行归属的卡号（由 AT+SPACTCARD 回显设置，1 卡1 / 2 卡2）
      pendingSim: 0,
      imei1: '',
      imei2: ''
    }
  },
  methods: {
    initializeData() {
      // 延迟发送初始化命令，响应由后台读取循环统一回调解析
      setTimeout(() => this.readIMEI1(), 500)
      setTimeout(() => this.readIMEI2(), 1300)
      setTimeout(() => this.getBand(), 2100)
    },

    // 双卡 IMEI 用 AT+SPACTCARD 切卡后查询，卡号由回显内容在 parseResponse 中归属
    readIMEI1() {
      this.sendCommand('AT+SPACTCARD=0')
      this.sendCommand('AT+SPIMEI?')
    },

    readIMEI2() {
      this.sendCommand('AT+SPACTCARD=1')
      this.sendCommand('AT+SPIMEI?')
    },

    getBand() {
      this.sendCommand('AT+SPLBAND=0')
    },

    // 解析串口响应：切卡回显归属 IMEI 卡号，再提取频段位图
    parseResponse(str) {
      // 解析双卡IMEI：AT+SPACTCARD 的回显指明本批 IMEI 属于哪张卡，避免依赖响应到达时序
      if (str.includes('AT+SPACTCARD=0')) {
        this.pendingSim = 1
      }
      if (str.includes('AT+SPACTCARD=1')) {
        this.pendingSim = 2
      }

      // IMEI：15位数字行，前后都是空行时认为是IMEI
      let arr = str.split('\r\n')
      if (arr.length >= 3) {
        arr.forEach((item, i) => {
          if (item.length === 15 && arr[i - 1] === '' && arr[i + 1] === '') {
            if (this.pendingSim === 1) {
              this.imei1 = item
            }
            if (this.pendingSim === 2) {
              this.imei2 = item
            }
          }
        })
      }

      // 解析频段信息
      if (str.includes('+SPLBAND: ')) {
        let arr = str.split('+SPLBAND: ')[1].split('\r\n')[0].split(',')
        if (arr.length >= 4) {
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

    // 将勾选的频段编码为高低位图并发送锁定命令
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
    }
  }
}
</script>
