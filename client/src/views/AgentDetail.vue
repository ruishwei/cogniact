<template>
  <div class="page">
    <div class="page-header">
      <h1>{{ agent?.name }}</h1>
      <div class="actions">
        <router-link to="/agents" class="btn btn-outline">Back</router-link>
      </div>
    </div>

    <div v-if="agent" class="details-grid">
      <div class="detail-section">
        <h3>Configuration</h3>
        <div class="detail-item">
          <span class="label">Status:</span>
          <span :class="['badge', `badge-${agent.status === 'active' ? 'success' : 'error'}`]">
            {{ agent.status }}
          </span>
        </div>
        <div class="detail-item">
          <span class="label">Model:</span>
          <span>{{ agent.model_provider }} / {{ agent.model_name }}</span>
        </div>
      </div>

      <div class="detail-section">
        <h3>System Prompt</h3>
        <textarea v-model="agent.system_prompt" class="textarea" rows="10"></textarea>
        <button @click="updateAgent" class="btn btn-primary">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../lib/api';

const route = useRoute();
const agent = ref(null);

onMounted(async () => {
  await loadAgent();
});

async function loadAgent() {
  try {
    agent.value = await api.get(`/agents/${route.params.id}`);
  } catch (error) {
    console.error('Failed to load agent:', error);
  }
}

async function updateAgent() {
  try {
    await api.put(`/agents/${route.params.id}`, {
      system_prompt: agent.value.system_prompt,
    });
    alert('Agent updated successfully');
  } catch (error) {
    console.error('Failed to update agent:', error);
  }
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
}

.actions {
  display: flex;
  gap: var(--spacing-sm);
}

.details-grid {
  display: grid;
  gap: var(--spacing-lg);
}

.detail-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--gray-200);
}

.detail-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-lg);
}

.detail-item {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  font-size: 0.875rem;
}

.label {
  font-weight: 500;
  color: var(--gray-700);
}
</style>
