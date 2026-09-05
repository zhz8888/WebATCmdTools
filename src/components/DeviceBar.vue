<template>
  <!-- 吸顶设备状态栏：返回入口 + 平台标识 + 链路指示灯 + 连接开关 -->
  <div class="sticky top-0 z-20 bg-ivory/85 py-3 backdrop-blur-md">
    <div
      class="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-line bg-card px-4 py-3 shadow-sm sm:px-5"
    >
      <button class="btn px-3" title="返回首页" aria-label="返回首页" @click="$router.push('/')">
        <svg
          viewBox="0 0 16 16"
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M9.5 3.5 5 8l4.5 4.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="font-serif text-lg font-semibold text-ink">{{ title }}</h1>
          <span class="tag">{{ tag }}</span>
        </div>
        <p class="mt-0.5 font-mono text-[11px] tracking-wide text-ink-faint">
          SERIAL 9600 8N1 · WEB SERIAL API
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <span class="led" :class="{ 'led-on': connected }" aria-hidden="true" />
        <span
          class="font-mono text-xs"
          :class="connected ? 'font-medium text-ok' : 'text-ink-faint'"
        >
          {{ connected ? '已连接' : '未连接' }}
        </span>
        <!-- 未连接时的连接入口由底部 ConnectPrompt 承担，顶部仅保留断开操作 -->
        <button v-if="connected" class="btn btn-danger" @click="$emit('toggle')">断开连接</button>
      </div>
    </div>
  </div>
</template>

<script>
// 设备状态栏：平台页共用的页头，承载返回入口、平台标识与串口连接开关
export default {
  name: 'DeviceBar',
  props: {
    // 页面标题（平台中文名）
    title: {
      type: String,
      required: true
    },
    // 平台代号徽标（ZXIC / ASR / SPRD）
    tag: {
      type: String,
      required: true
    },
    // 串口是否已连接，控制指示灯与按钮形态
    connected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle']
}
</script>
