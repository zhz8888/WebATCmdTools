<template>
  <!-- 首页：衬线标题简介 + 芯片平台入口列表 -->
  <div class="panel">
    <div class="text-center">
      <p class="eyebrow">Web Serial · AT Command</p>
      <h1 class="mt-2 font-serif text-3xl font-semibold text-ink">AT 命令工具</h1>
      <p class="mt-2 text-sm text-ink-soft/80">基于 Web Serial API 的浏览器串口调试工具</p>
    </div>

    <hr class="my-6 border-cream" />

    <p class="mb-3 text-center text-xs font-medium tracking-wide text-ink-faint">选择芯片平台</p>
    <div class="grid gap-3">
      <button
        v-for="platform in platforms"
        :key="platform.path"
        class="group flex cursor-pointer items-center gap-4 rounded-xl border border-line bg-ivory px-4 py-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-claude-accent hover:bg-card hover:shadow-md"
        @click="$router.push('/' + platform.path)"
      >
        <span class="tag w-14 justify-center">{{ platform.code }}</span>
        <span class="min-w-0 flex-1">
          <span class="block font-serif text-base font-semibold text-ink">
            {{ platform.name }}
          </span>
          <span class="mt-0.5 block text-xs text-ink-faint">{{ platform.desc }}</span>
        </span>
        <svg
          viewBox="0 0 16 16"
          class="size-4 shrink-0 text-ink-faint transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-claude-accent"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
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
        {
          path: 'zxic',
          code: 'ZXIC',
          name: '中兴微',
          desc: 'IMEI / MAC 读写 · 频段与小区锁定 · ADB'
        },
        {
          path: 'asr',
          code: 'ASR',
          name: '翱捷',
          desc: 'IMEI / SN / MAC 写号 · 双卡切换 · 频段锁定'
        },
        { path: 'sprd', code: 'SPRD', name: '展锐', desc: '双 IMEI 写号 · 频段锁定' }
      ]
    }
  }
}
</script>
