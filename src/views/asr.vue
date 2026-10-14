<template>
  <!-- ASR 平台页：设备状态栏 + 工作区（工厂模式/写号/SIM/频段/控制台） -->
  <div class="flex flex-col gap-3">
    <DeviceBar title="翱捷" tag="ASR" :connected="isOpen" @toggle="togglePort" />

    <div v-if="isOpen" class="panel workspace space-y-6">
      <SectionPanel tag="FACTORY" title="工厂模式" cmd="AT*PROD">
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="sendCommand('AT*PROD=1')">进入工厂模式</button>
          <button class="btn" @click="sendCommand('AT*PROD=0')">退出工厂模式</button>
        </div>
        <p class="hint mt-2">需开启工厂模式才能写号，写入之前先删除</p>
      </SectionPanel>

      <SectionPanel tag="NVRAM" title="写号" cmd="AT*MRD_IMEI">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20" for="asr-imei">IMEI</label>
            <input
              id="asr-imei"
              v-model="imei"
              type="text"
              class="input min-w-0 flex-1 font-mono"
            />
            <button class="btn" @click="sendCommand('AT+CGSN')">读取</button>
            <button class="btn" @click="sendCommand('AT*MRD_IMEI=D')">删除</button>
            <button class="btn btn-primary" @click="writeImei()">写入</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20" for="asr-sn">SN</label>
            <input
              id="asr-sn"
              v-model="sn"
              type="text"
              placeholder="仅支持有SN号的设备"
              class="input min-w-0 flex-1 font-mono"
            />
            <button class="btn" @click="sendCommand('AT*MRD_SN?')">读取</button>
            <button class="btn" @click="sendCommand('AT*MRD_SN=D')">删除</button>
            <button class="btn btn-primary" @click="writeSn()">写入</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20" for="asr-mac">MAC</label>
            <input id="asr-mac" v-model="mac" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="sendCommand('AT*MRD_WIFIID?')">读取</button>
            <button class="btn" @click="sendCommand('AT*MRD_WIFIID=D')">删除</button>
            <button class="btn btn-primary" @click="writeMac()">写入</button>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel tag="SIM" title="SIM 与设备" cmd="AT+SWSIM">
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="sendCommand('AT+SWSIM=0')">切到卡1</button>
          <button class="btn" @click="sendCommand('AT+SWSIM=1')">切到卡2</button>
          <button class="btn" @click="sendCommand('AT+RESET')">重启</button>
        </div>
      </SectionPanel>

      <SectionPanel tag="RF" title="频段锁定" cmd="AT*BAND">
        <BandSelector
          v-model:selected-bands="checked"
          :available-bands="list"
          :is-connected="isOpen"
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
import { decodeBandBitmap, encodeBandBitmap } from '../utils/band.js'
import { createSerialPortMixin } from '../utils/serialPortMixin.js'
import { confirmWriteValue } from '../utils/writeGuard.js'

export default {
  name: 'ASRView',
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
      imei: '',
      sn: '',
      mac: '',
      bandStr: ''
    }
  },
  methods: {
    // 连接成功后依次发送初始化查询命令，间隔发送避免响应拥塞
    initializeData() {
      // 延迟发送初始化命令，响应由后台读取循环统一回调解析
      this.later(() => this.sendCommand('AT+CGSN'), 500)
      this.later(() => this.sendCommand('AT*MRD_SN?'), 1000)
      this.later(() => this.sendCommand('AT*MRD_WIFIID?'), 1500)
      this.later(() => this.getBand(), 2000)
    },

    // 解析串口响应：按响应前缀提取 IMEI、SN、MAC 与频段位图
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

    // bandH/bandL 两个位图字段合成已选频段：
    // bandH 的 bit5-bit8 对应 B38-B41，bandL 的 bit0 起对应 B1 起，均只保留可勾选的频段
    parseLockedBand(bandStr) {
      const arr = bandStr.split(',')
      if (arr.length < 5) {
        return []
      }
      const bandH = parseInt(arr[3]) || 0
      const bandL = parseInt(arr[4]) || 0
      return [
        ...decodeBandBitmap(bandH.toString(2), { baseBand: 33, allowed: this.list }),
        ...decodeBandBitmap(bandL.toString(2), { baseBand: 1, allowed: this.list })
      ]
    },

    // 校验并二次确认后写入 IMEI
    writeImei() {
      const imei = confirmWriteValue('imei', this.imei)
      if (imei) {
        this.sendCommand('AT*MRD_IMEI=W,0,01JAN1970,' + imei)
      }
    },

    // 校验并二次确认后写入 SN
    writeSn() {
      const sn = confirmWriteValue('sn', this.sn)
      if (sn) {
        this.sendCommand('AT*MRD_SN=W,0,01JAN1970,' + sn)
      }
    },

    // 校验并二次确认后写入 WiFi MAC
    writeMac() {
      const mac = confirmWriteValue('mac', this.mac)
      if (mac) {
        this.sendCommand('AT*MRD_WIFIID=W,0,01JAN1970,' + mac)
      }
    },

    // 查询设备支持的频段位图
    getBand() {
      this.sendCommand('AT*BAND?')
    },

    // 将勾选的频段合成进当前位图并发送锁定命令（未查询到位图时使用全零基底）
    submit(selectedBands) {
      const bandH = encodeBandBitmap(selectedBands, {
        baseBand: 33,
        maxOffset: 8,
        allowed: this.list
      })
      const bandL = encodeBandBitmap(selectedBands, {
        baseBand: 1,
        maxOffset: 19,
        allowed: this.list
      })
      let bandArr = this.bandStr.split(',')
      if (bandArr.length < 5) {
        bandArr = ['0', '0', '0', '0', '0']
      }
      bandArr[3] = bandH
      bandArr[4] = bandL
      this.sendCommand(`AT*BAND=${bandArr.join(',')}`)
    }
  }
}
</script>
