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
      <label v-for="band in availableBands" :key="band" class="chip">
        <input v-model="selection" type="checkbox" :value="band" class="size-3.5 accent-claude" />
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
// 频段选择器：受控组件，选中项由父组件通过 v-model:selected-bands 持有，
// 组件内不保留副本，避免父子双向同步互相触发
export default {
  name: 'BandSelector',
  props: {
    // 可供勾选的频段号列表
    availableBands: {
      type: Array,
      default: () => [1, 3, 5, 8, 38, 39, 40, 41]
    },
    // 串口是否已连接，未连接时读取/锁定按钮禁用
    isConnected: {
      type: Boolean,
      default: false
    },
    // 是否显示频段支持范围提示文案
    showTips: {
      type: Boolean,
      default: true
    },
    // 当前已选中的频段，由父组件通过 v-model:selected-bands 传入
    selectedBands: {
      type: Array,
      default: () => []
    }
  },
  emits: ['read-bands', 'submit-bands', 'update:selected-bands'],
  computed: {
    // 勾选框的写入入口：仅向外抛出变更，不修改 prop
    selection: {
      get() {
        return this.selectedBands
      },
      set(value) {
        this.$emit('update:selected-bands', value)
      }
    }
  },
  methods: {
    // 请求父组件读取设备的频段信息
    readBands() {
      this.$emit('read-bands')
    },
    // 将当前勾选的频段交给父组件执行锁定
    submitBands() {
      this.$emit('submit-bands', this.selectedBands)
    }
  }
}
</script>
