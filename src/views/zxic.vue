<template>
  <!-- 中兴微（ZXIC）平台页：设备状态栏 + 工作区（ADB/工厂模式/写号/频段/小区/控制台） -->
  <div class="flex flex-col gap-3">
    <DeviceBar title="中兴微" tag="ZXIC" :connected="isOpen" @toggle="togglePort" />

    <div v-if="isOpen" class="panel workspace space-y-6">
      <SectionPanel tag="ADB" title="ADB 与设备管理">
        <div class="flex flex-wrap items-center gap-2">
          <label class="field-label" for="zxic-ip">IP</label>
          <input id="zxic-ip" v-model="ip" type="text" class="input w-36 font-mono" />
          <button class="btn" @click="openADB">开启 adb</button>
          <button class="btn" @click="closeADB">关闭 adb</button>
          <button class="btn" @click="openADB2">开启 adb2</button>
          <button class="btn" @click="closeADB2">关闭 adb2</button>
          <button class="btn" @click="reboot">重启</button>
          <button class="btn" @click="reboot1869">重启2</button>
        </div>
      </SectionPanel>

      <SectionPanel tag="FACTORY" title="工厂模式" cmd="AT+ZMODE">
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="sendCommand('AT+ZMODE=1')">进入工厂模式</button>
          <button class="btn" @click="sendCommand('AT+ZMODE=0')">退出工厂模式</button>
        </div>
      </SectionPanel>

      <SectionPanel tag="NVRAM" title="写号" cmd="AT+MODIMEI">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20" for="zxic-imei">IMEI</label>
            <input
              id="zxic-imei"
              v-model="imei"
              type="text"
              class="input min-w-0 flex-1 font-mono"
            />
            <button class="btn" @click="sendCommand('AT+CGSN')">读取</button>
            <button class="btn btn-primary" @click="writeImei()">写入</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20" for="zxic-mac">无线 MAC</label>
            <input id="zxic-mac" v-model="mac" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="sendCommand('AT+MAC?')">读取</button>
            <button class="btn btn-primary" @click="writeMac()">写入</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20" for="zxic-mac2">有线 MAC</label>
            <input
              id="zxic-mac2"
              v-model="mac2"
              type="text"
              class="input min-w-0 flex-1 font-mono"
            />
            <button class="btn" @click="sendCommand('AT+MAC2?')">读取</button>
            <button class="btn btn-primary" @click="writeMac2()">写入</button>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel tag="RF" title="频段锁定" cmd="AT+ZLTEBAND">
        <BandSelector
          v-model:selected-bands="checked"
          :available-bands="list"
          :is-connected="isOpen"
          @read-bands="getBand"
          @submit-bands="submit"
        >
          <template #controls>
            <div class="mb-3 flex flex-wrap gap-2">
              <button class="btn" :disabled="!isOpen" @click="getBand">读取频段</button>
              <button
                class="btn btn-primary"
                :disabled="!isOpen || !checked.length"
                @click="submit()"
              >
                锁定频段
              </button>
              <button class="btn" :disabled="!isOpen" @click="resetNetWork">重启网络</button>
            </div>
          </template>
        </BandSelector>
      </SectionPanel>

      <SectionPanel tag="CELL" title="小区锁定" cmd="AT+ZLC">
        <div class="flex flex-wrap items-center gap-2">
          <label class="field-label" for="zxic-arfcn">频点</label>
          <input id="zxic-arfcn" v-model="lteCell.arfcn" type="text" class="input w-24 font-mono" />
          <label class="field-label" for="zxic-pci">小区</label>
          <input id="zxic-pci" v-model="lteCell.pci" type="text" class="input w-24 font-mono" />
          <label class="flex cursor-pointer items-center gap-1.5 text-sm text-ink-soft">
            <input v-model="lteCell.isLock" type="checkbox" class="accent-claude" />
            <span>是否锁定</span>
          </label>
          <button class="btn" @click="sendCommand('AT+ZLC?')">读取</button>
          <button
            class="btn btn-primary"
            @click="sendCommand(`AT+ZLC=${lteCell.isLock ? 1 : 0},${lteCell.arfcn},${lteCell.pci}`)"
          >
            写入
          </button>
        </div>
        <p class="hint mt-2">显示的仅为之前保存锁定小区的数据，并非是当前实际接入的小区</p>
      </SectionPanel>

      <SectionPanel tag="CONSOLE" title="串口控制台">
        <SerialConsole
          :output-data="dataR"
          :is-connected="isOpen"
          @send-command="sendCommand"
          @clear-output="dataR = ''"
        >
          <template #controls>
            <div class="mb-3 flex flex-wrap gap-2">
              <button class="btn" @click="sendCommand('AT+CGEQOSRDP=1')">限速检测</button>
            </div>
          </template>
        </SerialConsole>
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
  name: 'ZxicView',
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
      list: [],
      checked: [],
      imei: '',
      mac: '',
      mac2: '',
      ip: '192.168.0.1',
      lteCell: {
        isLock: false,
        arfcn: '',
        pci: ''
      }
    }
  },
  methods: {
    // 连接成功后依次发送初始化查询命令，间隔发送避免响应拥塞
    initializeData() {
      // 延迟发送初始化命令，响应由后台读取循环统一回调解析
      this.later(() => this.sendCommand('AT+CGSN'), 500)
      this.later(() => this.sendCommand('AT+MAC?'), 1000)
      this.later(() => this.sendCommand('AT+MAC2?'), 1500)
      this.later(() => this.getBand(), 2000)
      this.later(() => this.sendCommand('AT+ZLC?'), 2500)
    },

    // 解析串口响应：按响应前缀提取 IMEI、MAC、频段与小区锁定状态
    parseResponse(str) {
      // 解析IMEI
      if (str.includes('+CGSN: ')) {
        this.imei = str.split('+CGSN: ')[1].split('\r\n')[0]
      }

      // 解析MAC地址
      if (str.includes('+MAC:')) {
        this.mac = str.split('+MAC:')[1].split('\r\n')[0]
      }

      if (str.includes('+MAC2:')) {
        this.mac2 = str.split('+MAC2:')[1].split('\r\n')[0]
      }

      // 解析频段信息
      if (str.includes('ZLTEAMTBAND: ')) {
        this.list = this.getSupportedBand(str.split('ZLTEAMTBAND: ')[1].split('\r\n')[0])
      }

      // 解析已锁定频段
      if (str.includes('+ZLTEBAND: ')) {
        let checked = this.getLockedBand(str.split('+ZLTEBAND: ')[1].split('\r\n')[0])
        this.checked = checked
      }

      // 解析小区锁定信息
      if (str.includes('+ZLC: ')) {
        let arr = str.split('+ZLC: ')[1].split('\r\n')[0].split(',')
        this.lteCell.isLock = arr[0] === '1'
        this.lteCell.arfcn = arr[1]
        this.lteCell.pci = arr[2]
      }
    },

    // 把逗号分隔的位图字节串展开为频段号列表（每字节 8 个频段）
    getSupportedBand(str) {
      return str
        .split(',')
        .reduce(
          (bands, byte, index) =>
            bands.concat(decodeBandBitmap(parseInt(byte).toString(2), { baseBand: index * 8 + 1 })),
          []
        )
    },

    // 从支持的频段中过滤出当前已锁定的频段
    getLockedBand(str) {
      return this.getSupportedBand(str).filter(item => this.list.includes(item))
    },

    // 校验并二次确认后写入 IMEI
    writeImei() {
      const imei = confirmWriteValue('imei', this.imei)
      if (imei) {
        this.sendCommand('AT+MODIMEI=' + imei)
      }
    },

    // 校验并二次确认后写入无线 MAC
    writeMac() {
      const mac = confirmWriteValue('mac', this.mac)
      if (mac) {
        this.sendCommand('AT+MAC=' + mac)
      }
    },

    // 校验并二次确认后写入有线 MAC
    writeMac2() {
      const mac = confirmWriteValue('mac', this.mac2)
      if (mac) {
        this.sendCommand('AT+MAC2=' + mac)
      }
    },

    // 查询支持的频段与当前锁定状态（两次查询间隔 200ms）
    getBand() {
      this.sendCommand('AT+ZLTEAMTBAND?')
      this.later(() => {
        this.sendCommand('AT+ZLTEBAND?')
      }, 200)
    },

    // 将勾选的频段按每字节 8 个频段编码为位图并发送锁定命令
    submit(bands = this.checked) {
      const bitmap = []
      for (let i = 0; i < 8; i++) {
        bitmap.push(encodeBandBitmap(bands, { baseBand: i * 8 + 1, maxOffset: 7 }))
      }
      this.sendCommand('AT+ZLTEBAND=' + bitmap.join(','))
    },

    // 重启网络：先离线（CFUN=4）再恢复（CFUN=1）
    resetNetWork() {
      this.sendCommand('AT+CFUN=4')
      this.later(() => {
        this.sendCommand('AT+CFUN=1')
      }, 5000)
    },

    // ADB相关方法：以下通过设备 Web 管理页面开关调试模式或重启设备
    openADB() {
      window.open(
        `http://${this.ip}/goform/goform_set_cmd_process?goformId=SET_DEVICE_MODE&debug_enable=1`
      )
    },

    closeADB() {
      window.open(
        `http://${this.ip}/goform/goform_set_cmd_process?goformId=SET_DEVICE_MODE&debug_enable=0`
      )
    },

    openADB2() {
      window.open(`http://${this.ip}/reqproc/proc_post?goformId=SET_DEVICE_MODE&debug_enable=1`)
    },

    closeADB2() {
      window.open(`http://${this.ip}/reqproc/proc_post?goformId=SET_DEVICE_MODE&debug_enable=0`)
    },

    reboot() {
      window.open(`http://${this.ip}/goform/goform_set_cmd_process?goformId=REBOOT_DEVICE`)
    },

    reboot1869() {
      window.open(`http://${this.ip}/reqproc/proc_post?isTest=false&goformId=REBOOT_DEVICE`)
    }
  }
}
</script>
