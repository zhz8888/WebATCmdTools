<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center bg-ivory px-4 py-8 text-ink">
    <main class="m-auto w-full max-w-3xl">
      <RouterView />
    </main>
  </div>
</template>
