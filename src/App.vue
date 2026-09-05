<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center bg-ivory px-4 py-8 text-ink antialiased">
    <main class="m-auto w-full max-w-3xl">
      <RouterView />
    </main>

    <footer class="mt-8 space-y-1 text-center">
      <p class="hint">请使用电脑版 Chrome、Edge 等浏览器打开，其他浏览器无法连接设备</p>
      <p class="hint">使用前先在电脑上安装设备的串口驱动，连接时在弹出的列表中选择设备的 AT 端口</p>
      <p class="hint">如果某个数据不对，点一下它旁边的「读取」按钮重新读取，可多点几次</p>
    </footer>
  </div>
</template>
