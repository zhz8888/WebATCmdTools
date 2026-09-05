<template>
  <!-- 未连接空态：引导按顺序完成连接 -->
  <div class="flex flex-col items-center px-4 py-12 text-center">
    <span class="led size-3.5" aria-hidden="true" />
    <h2 class="mt-4 font-serif text-lg font-semibold text-ink">设备未连接</h2>
    <p class="hint mt-1">连接成功后将自动读取设备信息</p>

    <ol class="mt-6 space-y-1.5 text-left font-mono text-xs text-ink-soft">
      <li v-for="(step, i) in steps" :key="i" class="flex gap-2">
        <span class="text-claude-accent">{{ String(i + 1).padStart(2, '0') }}</span>
        <span>{{ step }}</span>
      </li>
    </ol>

    <button class="btn btn-primary mt-6" @click="$emit('connect')">选择端口</button>
    <p class="hint mt-3">仅支持基于 Chromium 内核的桌面浏览器</p>
  </div>
</template>

<script>
// 连接引导：设备未连接时的空态，提供连接入口与操作步骤
export default {
  name: 'ConnectPrompt',
  emits: ['connect'],
  data() {
    return {
      steps: [
        '点击下方按钮，选择设备的 AT 串口端口',
        '保持设备上电并通过 USB 与电脑连接',
        '连接成功后自动读取 IMEI / MAC / 频段'
      ]
    }
  }
}
</script>
