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
    outputData: {
      type: String,
      default: ''
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    inputPlaceholder: {
      type: String,
      default: '发送自定义AT指令'
    },
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
    outputData() {
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    }
  },
  methods: {
    sendCustomCommand() {
      if (!this.customCommand.trim()) {
        return
      }

      this.$emit('send-command', this.customCommand.trim())
      this.customCommand = ''
    },
    clearOutput() {
      this.$emit('clear-output')
    },
    scrollToBottom() {
      const textarea = this.$refs.outputTextarea
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight
      }
    }
  }
}
</script>
