<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center bg-ivory px-4 py-8 text-ink">
    <main class="m-auto w-full max-w-3xl">
      <RouterView />
    </main>

    <footer class="mt-8 space-y-1 text-center">
      <p class="hint">
        需要先安装对应驱动到电脑，支持基于 chromium 内核的浏览器，串行端口需要选择 AT 端口
      </p>
      <p class="hint">若发现数据不对，请多点几次任意读取相关的按钮刷新数据</p>
    </footer>
  </div>
</template>
