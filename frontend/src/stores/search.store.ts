import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import type { SearchResult } from '../types/product';

export const useSearchStore = defineStore('search', () => {
  const results = ref<SearchResult[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const query = ref('');

  const search = async (q: string) => {
    if (!q || q.trim().length < 2) {
      results.value = [];
      query.value = '';
      return;
    }

    loading.value = true;
    error.value = null;
    query.value = q.trim();

    try {
      const response = await axios.get(
        `/api/search?q=${encodeURIComponent(q.trim())}`,
      );

      if (response.data.success) {
        results.value = response.data.data;
      } else {
        error.value = 'Search failed';
        results.value = [];
      }
    } catch (err: any) {
      if (err.response?.data?.error?.message) {
        error.value = err.response.data.error.message;
      } else if (err.message) {
        error.value = err.message;
      } else {
        error.value = 'Search failed. Please try again.';
      }

      results.value = [];
    } finally {
      loading.value = false;
    }
  };

  const clearSearch = () => {
    results.value = [];
    loading.value = false;
    error.value = null;
    query.value = '';
  };

  return {
    results,
    loading,
    error,
    query,
    search,
    clearSearch,
  };
});
