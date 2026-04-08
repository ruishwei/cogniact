<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Knowledge Base</h1>
        <p>Manage agent knowledge and documentation</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary">Add Knowledge</button>
    </div>

    <div class="knowledge-list">
      <div v-for="item in knowledgeItems" :key="item.id" class="knowledge-item">
        <h3>{{ item.title }}</h3>
        <p>{{ item.content.substring(0, 200) }}...</p>
        <div class="knowledge-meta">
          <span class="badge">{{ item.source_type }}</span>
          <span>{{ formatDate(item.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api';

const knowledgeItems = ref([]);
const showCreateModal = ref(false);

onMounted(async () => {
  await loadKnowledge();
});

async function loadKnowledge() {
  try {
    knowledgeItems.value = await api.get('/knowledge');
  } catch (error) {
    console.error('Failed to load knowledge:', error);
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}
</script>

<style scoped>
.page {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.page-header p {
  font-size: 1rem;
  color: var(--gray-600);
}

.knowledge-list {
  display: grid;
  gap: var(--spacing-lg);
}

.knowledge-item {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--gray-200);
}

.knowledge-item h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-md);
}

.knowledge-item p {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-md);
}

.knowledge-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--gray-500);
}
</style>
