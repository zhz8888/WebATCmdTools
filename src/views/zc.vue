<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-lg font-bold text-ink">中兴微</h1>
      <button class="btn" :class="isOpen ? 'btn-danger' : 'btn-primary'" @click="click">
        {{ isOpen ? '断开连接' : '选择端口' }}
        <span v-if="isOpen" class="ml-1 inline-block size-2 rounded-full bg-green-500" />
      </button>
    </div>

    <template v-if="isOpen">
      <section class="card">
        <h2 class="card-title">ADB 与设备管理</h2>
        <div class="flex flex-wrap items-center gap-2">
          <label class="field-label">ip:</label>
          <input v-model="ip" type="text" class="input w-36 font-mono" />
          <button class="btn" @click="openADB">开启adb</button>
          <button class="btn" @click="closeADB">关闭adb</button>
          <button class="btn" @click="openADB2">开启adb2</button>
          <button class="btn" @click="closeADB2">关闭adb2</button>
          <button class="btn" @click="reboot">重启</button>
          <button class="btn" @click="reboot1869">重启2</button>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">工厂模式</h2>
        <div class="flex flex-wrap gap-2">
          <button class="btn" @click="write('AT+ZMODE=1')">进入工厂模式</button>
          <button class="btn" @click="write('AT+ZMODE=0')">退出工厂模式</button>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">写号</h2>
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20">IMEI:</label>
            <input v-model="imei" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="write('AT+CGSN')">读取</button>
            <button class="btn btn-primary" @click="write('AT+MODIMEI=' + imei)">写入</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20">无线MAC:</label>
            <input v-model="mac" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="write('AT+MAC?')">读取</button>
            <button class="btn btn-primary" @click="write('AT+MAC=' + mac)">写入</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="field-label w-20">有线MAC:</label>
            <input v-model="mac2" type="text" class="input min-w-0 flex-1 font-mono" />
            <button class="btn" @click="write('AT+MAC2?')">读取</button>
            <button class="btn btn-primary" @click="write('AT+MAC2=' + mac2)">写入</button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">频段锁定</h2>
        <div class="flex flex-wrap gap-1.5">
          <label
            v-for="item in list"
            :key="item"
            class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-cream bg-ivory px-2.5 py-1.5 text-sm text-ink transition-colors duration-150 has-checked:border-claude-accent has-checked:bg-claude/10 hover:border-claude-accent"
          >
            <input v-model.number="checked" type="checkbox" :value="item" class="accent-claude" />
            <span>LTE B{{ item }}</span>
          </label>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button class="btn" @click="getBand">读取频段</button>
          <button class="btn btn-primary" @click="submit">锁定频段</button>
          <button class="btn" @click="resetNetWork">重启网络</button>
        </div>
      </section>

      <section class="card">
        <h2 class="card-title">小区锁定</h2>
        <div class="flex flex-wrap items-center gap-2">
          <label class="field-label">频点:</label>
          <input v-model="lteCell.arfcn" type="text" class="input w-24 font-mono" />
          <label class="field-label">小区:</label>
          <input v-model="lteCell.pci" type="text" class="input w-24 font-mono" />
          <label class="flex cursor-pointer items-center gap-1.5 text-sm text-ink-soft">
            <input
              v-model.number="lteCell.isLock"
              type="checkbox"
              :value="true"
              class="accent-claude"
            />
            <span>是否锁定</span>
          </label>
          <button class="btn" @click="write('AT+ZLC?')">读取</button>
          <button
            class="btn btn-primary"
            @click="write(`AT+ZLC=${lteCell.isLock ? 1 : 0},${lteCell.arfcn},${lteCell.pci}`)"
          >
            写入
          </button>
        </div>
        <p class="hint mt-2">显示的仅为之前保存锁定小区的数据，并非是当前实际接入的小区</p>
      </section>

      <section class="card">
        <h2 class="card-title">串口控制台</h2>
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <input
            v-model="dataW"
            type="text"
            placeholder="发送自定义AT指令"
            class="input min-w-0 flex-1 font-mono"
            @keyup.enter="write()"
          />
          <button class="btn btn-primary" @click="write()">发送</button>
          <button class="btn" @click="write('AT+CGEQOSRDP=1')">限速检测</button>
        </div>
        <textarea
          id="scroll_text"
          v-model="dataR"
          cols="30"
          rows="10"
          readonly
          class="w-full resize-y rounded-lg border border-cream bg-ink p-3 font-mono text-xs leading-5 text-claude/90 outline-none"
        />
      </section>
    </template>

    <p v-else class="text-center text-sm text-ink-soft/70">请连接设备以使用 AT 命令功能</p>
  </div>
</template>

<script>
import { SerialPortManager } from '../utils/serial.js'

export default {
  name: 'ZTEView',
  data() {
    return {
      serialManager: null,
      isOpen: false,
      dataR: '',
      dataW: '',
      timer: null,
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
              // 连接成功后初始化数据
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
      setTimeout(() => this.sendCommand('AT+MAC?'), 1000)
      setTimeout(() => this.sendCommand('AT+MAC2?'), 1500)
      setTimeout(() => this.getBand(), 2000)
      setTimeout(() => this.sendCommand('AT+ZLC?'), 2500)
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
        // readData 会触发 dataHandler，日志追加与解析都在其中完成，这里不要重复追加
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

    getSupportedBand(str) {
      return str.split(',').reduce((p, c, i) => {
        let arrStr = parseInt(c).toString(2)
        for (var j = 0; j < arrStr.length; j++) {
          if (parseInt(arrStr[arrStr.length - j - 1])) {
            p.push(i * 8 + j + 1)
          }
        }
        return p
      }, [])
    },

    getLockedBand(str) {
      return this.getSupportedBand(str).filter(item => this.list.includes(item))
    },

    getBand() {
      this.sendCommand('AT+ZLTEAMTBAND?')
      setTimeout(() => {
        this.sendCommand('AT+ZLTEBAND?')
      }, 200)
    },

    submit() {
      let arr = []
      for (var i = 0; i < 8; i++) {
        let str = ''
        for (var j = 0; j < 8; j++) {
          let isLock = this.checked.includes(i * 8 + j + 1)
          if (isLock) {
            str = '1' + str
          } else {
            str = '0' + str
          }
        }
        arr.push(parseInt(str, 2))
      }
      this.sendCommand('AT+ZLTEBAND=' + arr.join(','))
    },

    resetNetWork() {
      this.sendCommand('AT+CFUN=4')
      setTimeout(() => {
        this.sendCommand('AT+CFUN=1')
      }, 5000)
    },

    // ADB相关方法
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
