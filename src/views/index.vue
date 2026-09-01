<template>
  <!-- 单卡片布局：上方工具简介，浅色横线分隔后为平台入口区 -->
  <div class="card text-center">
    <h1 class="text-2xl font-bold text-ink">AT命令工具</h1>
    <p class="mt-2 text-sm text-ink-soft/70">基于 Web Serial API 的浏览器串口调试工具</p>

    <hr class="my-6 border-cream" />

    <h2 class="mb-4 text-sm font-semibold tracking-wide text-ink-soft">选择芯片平台</h2>
    <div class="grid gap-4 sm:grid-cols-3">
      <button
        v-for="platform in platforms"
        :key="platform.path"
        class="cursor-pointer rounded-lg border border-cream bg-ivory p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-claude-accent hover:shadow-md"
        @click="$router.push({ path: '/' + platform.path })"
      >
        <div class="text-base font-semibold text-ink">{{ platform.name }}</div>
        <div class="mt-1 text-xs text-ink-soft/70">{{ platform.desc }}</div>
      </button>
    </div>
  </div>
</template>

<script>
// 首页：展示工具简介与三个芯片平台的入口卡片
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
