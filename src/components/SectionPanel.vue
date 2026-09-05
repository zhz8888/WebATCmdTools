<template>
  <!-- 功能分区：等宽眉标 + 中文标题 + 核心 AT 命令标注 -->
  <section>
    <header
      class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-cream pb-2"
    >
      <div class="flex items-baseline gap-2">
        <span v-if="tag" class="eyebrow">{{ tag }}</span>
        <h2 class="text-sm font-semibold text-ink">{{ title }}</h2>
      </div>
      <code v-if="cmd" class="font-mono text-[11px] text-ink-faint">{{ cmd }}</code>
    </header>
    <slot />
  </section>
</template>

<script>
// 分区面板：统一各功能区的标题结构（眉标 / 标题 / AT 命令标注）
export default {
  name: 'SectionPanel',
  props: {
    // 等宽眉标，如 NVRAM / RF / CONSOLE
    tag: {
      type: String,
      default: ''
    },
    // 分区中文标题
    title: {
      type: String,
      required: true
    },
    // 该分区核心 AT 命令标注（仅作展示提示，不参与发送）
    cmd: {
      type: String,
      default: ''
    }
  }
}
</script>
