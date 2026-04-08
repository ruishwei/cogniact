<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Agents</h1>
        <p>Manage your intelligent agents</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary">Create Agent</button>
    </div>

    <div class="agents-grid">
      <div v-for="agent in agents" :key="agent.id" class="agent-card">
        <div class="agent-header">
          <h3>{{ agent.name }}</h3>
          <span :class="['badge', `badge-${agent.status === 'active' ? 'success' : 'error'}`]">
            {{ agent.status }}
          </span>
        </div>
        <p class="agent-description">{{ agent.description || 'No description' }}</p>
        <div class="agent-meta">
          <span>{{ agent.model_provider }}</span>
          <span>{{ agent.model_name }}</span>
        </div>
        <div class="agent-actions">
          <router-link :to="`/agents/${agent.id}`" class="btn btn-outline btn-sm">View</router-link>
          <button @click="deleteAgent(agent.id)" class="btn btn-outline btn-sm">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Create Agent</h3>
          <button @click="showCreateModal = false" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="createAgent" class="modal-body">
          <div class="form-group">
            <label>Name</label>
            <input v-model="newAgent.name" class="input" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newAgent.description" class="textarea" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Model Provider</label>
            <select v-model="newAgent.model_provider" class="input">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Create</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api';

const agents = ref([]);
const showCreateModal = ref(false);
const newAgent = ref({
  name: '',
  description: '',
  model_provider: 'openai',
});

onMounted(async () => {
  await loadAgents();
});

async function loadAgents() {
  try {
    agents.value = await api.get('/agents');
  } catch (error) {
    console.error('Failed to load agents:', error);
  }
}

async function createAgent() {
  try {
    await api.post('/agents', newAgent.value);
    showCreateModal.value = false;
    newAgent.value = { name: '', description: '', model_provider: 'openai' };
    await loadAgents();
  } catch (error) {
    console.error('Failed to create agent:', error);
  }
}

async function deleteAgent(id) {
  if (!confirm('Are you sure you want to delete this agent?')) return;

  try {
    await api.delete(`/agents/${id}`);
    await loadAgents();
  } catch (error) {
    console.error('Failed to delete agent:', error);
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
  margin-bottom: var(--spacing-sm);
}

.page-header p {
  font-size: 1rem;
  color: var(--gray-600);
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.agent-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--gray-200);
}

.agent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.agent-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.agent-description {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-md);
  line-height: 1.5;
}

.agent-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-bottom: var(--spacing-lg);
}

.agent-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 500px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray-500);
  cursor: pointer;
  padding: 0;
}

.modal-body {
  padding: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
  margin-bottom: var(--spacing-sm);
}
</style>
