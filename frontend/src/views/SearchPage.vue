<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SearchResults from '../components/SearchResults.vue'

const route = useRoute()
const query = computed(() => (route.query.q as string) || '')
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <SearchResults :query="query" />
  </div>
</template>
