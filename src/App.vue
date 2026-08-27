<script setup lang="ts">
// Shell applicatif : la navigation est déléguée aux 3 routes
// (/setup, /result, /report), chacune gérant son propre layout.
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content">
    <router-view />
  </div>
</template>
