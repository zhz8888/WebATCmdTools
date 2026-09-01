<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <input
        v-model="customCommand"
        type="text"
        :placeholder="inputPlaceholder"
        class="input min-w-0 flex-1 font-mono"
        @keyup.enter="sendCustomCommand"
      />
      <button :disabled="!isConnected" class="btn btn-primary" @click="sendCustomCommand">
        发送
      </button>
      <button class="btn" @click="clearOutput">清理</button>
    </div>

    <textarea
      ref="outputTextarea"
      :value="outputData"
      readonly
      :rows="rows"
      class="w-full resize-y rounded-lg border border-cream bg-ink p-3 font-mono text-xs leading-5 text-claude/90 outline-none"
    />
  </div>
</template>

<script>
export default {
  name: 'SerialConsole',
  props: {
    // 父组件传入的串口原始日志，只读渲染
    outputData: {
      type: String,
      default: ''
    },
    // 串口是否已连接，未连接时发送按钮禁用
    isConnected: {
      type: Boolean,
      default: false
    },
    // 命令输入框占位文案
    inputPlaceholder: {
      type: String,
      default: '发送自定义AT指令'
    },
    // 日志区行数
    rows: {
      type: Number,
      default: 10
    }
  },
  emits: ['send-command', 'clear-output'],
  data() {
    return {
      customCommand: ''
    }
  },
  watch: {
    // 日志更新后滚动到底部，保持最新输出可见
    outputData() {
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    }
  },
  methods: {
    // 发送输入框中的自定义 AT 命令并清空输入
    sendCustomCommand() {
      if (!this.customCommand.trim()) {
        return
      }

      this.$emit('send-command', this.customCommand.trim())
      this.customCommand = ''
    },
    // 请求父组件清空日志
    clearOutput() {
      this.$emit('clear-output')
    },
    // 将日志区滚动到底部
    scrollToBottom() {
      const textarea = this.$refs.outputTextarea
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight
      }
    }
  }
}
</script>
