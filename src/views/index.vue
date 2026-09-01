<template>
  <div class="text-center">
    <h1 class="text-2xl font-bold text-ink">AT命令工具</h1>
    <p class="mt-2 text-sm text-ink-soft/70">基于 Web Serial API 的浏览器串口调试工具</p>

    <div class="mt-8 grid gap-4 sm:grid-cols-3">
      <button
        v-for="platform in platforms"
        :key="platform.path"
        class="card cursor-pointer text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-claude-accent hover:shadow-md"
        @click="$router.push({ path: '/' + platform.path })"
      >
        <div class="text-base font-semibold text-ink">{{ platform.name }}</div>
        <div class="mt-1 text-xs text-ink-soft/70">{{ platform.desc }}</div>
      </button>
    </div>

    <div class="mt-8 space-y-1">
      <p class="hint">
        需要先安装对应驱动到电脑，支持基于 chromium 内核的浏览器，串行端口需要选择 AT 端口
      </p>
      <p class="hint">若发现数据不对，请多点几次任意读取相关的按钮刷新数据</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IndexView',
  data() {
    return {
      platforms: [
        { path: 'zc', name: '中兴微', desc: 'IMEI / MAC / 频段锁定 / ADB' },
        { path: 'asr', name: 'ASR', desc: '写号 / 双卡切换 / 频段' },
        { path: 'sprd', name: '展锐', desc: '双 IMEI / 频段锁定' }
      ]
    }
  }
}
</script>
