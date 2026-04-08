<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Scheduled Tasks</h1>
        <p>Automate recurring operations</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary">Create Task</button>
    </div>

    <div class="tasks-list">
      <div v-for="task in tasks" :key="task.id" class="task-item">
        <div class="task-header">
          <h3>{{ task.name }}</h3>
          <span :class="['badge', task.enabled ? 'badge-success' : 'badge-error']">
            {{ task.enabled ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
        <p>{{ task.description }}</p>
        <div class="task-meta">
          <span>{{ task.task_type }}</span>
          <span>{{ task.schedule }}</span>
          <span v-if="task.last_run_at">Last run: {{ formatDate(task.last_run_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api';

const tasks = ref([]);
const showCreateModal = ref(false);

onMounted(async () => {
  await loadTasks();
});

async function loadTasks() {
  try {
    tasks.value = await api.get('/tasks');
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
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

.tasks-list {
  display: grid;
  gap: var(--spacing-lg);
}

.task-item {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--gray-200);
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.task-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.task-item p {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-md);
}

.task-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--gray-500);
}
</style>
