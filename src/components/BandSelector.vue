<template>
  <div>
    <div class="mb-3 flex flex-wrap gap-2">
      <slot name="controls">
        <button :disabled="!isConnected" class="btn" @click="readBands">读取频段</button>
        <button
          :disabled="!isConnected || !selectedBands.length"
          class="btn btn-primary"
          @click="submitBands"
        >
          锁定频段
        </button>
      </slot>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <label
        v-for="band in availableBands"
        :key="band"
        class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-cream bg-ivory px-2.5 py-1.5 text-sm text-ink transition-colors duration-150 has-checked:border-claude-accent has-checked:bg-claude/10 hover:border-claude-accent"
      >
        <input v-model="selectedBands" type="checkbox" :value="band" class="accent-claude" />
        <span>LTE B{{ band }}</span>
      </label>
    </div>

    <div v-if="showTips" class="mt-2">
      <slot name="tips">
        <p class="hint">显示的频段不一定支持，能成功锁定的频段才算是支持</p>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BandSelector',
  props: {
    availableBands: {
      type: Array,
      default: () => [1, 3, 5, 8, 38, 39, 40, 41]
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    showTips: {
      type: Boolean,
      default: true
    },
    initialSelectedBands: {
      type: Array,
      default: () => []
    }
  },
  emits: ['read-bands', 'submit-bands', 'update:selected-bands'],
  data() {
    return {
      selectedBands: []
    }
  },
  watch: {
    initialSelectedBands: {
      handler(newVal) {
        this.selectedBands = [...newVal]
      },
      immediate: true
    },
    selectedBands: {
      handler(newVal) {
        this.$emit('update:selected-bands', newVal)
      },
      deep: true
    }
  },
  methods: {
    readBands() {
      this.$emit('read-bands')
    },
    submitBands() {
      this.$emit('submit-bands', this.selectedBands)
    }
  }
}
</script>
