<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Welcome to Cloud Agent Browser</p>
    </div>

    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-icon">🤖</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.agents }}</div>
          <div class="stat-label">Active Agents</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.conversations }}</div>
          <div class="stat-label">Conversations</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.skills }}</div>
          <div class="stat-label">Skills Available</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.tasks }}</div>
          <div class="stat-label">Scheduled Tasks</div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="actions-grid">
        <router-link to="/agents" class="action-card">
          <div class="action-icon">➕</div>
          <div class="action-title">Create Agent</div>
          <div class="action-description">Set up a new intelligent agent</div>
        </router-link>

        <router-link to="/chat" class="action-card">
          <div class="action-icon">💬</div>
          <div class="action-title">Start Chat</div>
          <div class="action-description">Begin a conversation with an agent</div>
        </router-link>

        <router-link to="/browser" class="action-card">
          <div class="action-icon">🌐</div>
          <div class="action-title">Launch Browser</div>
          <div class="action-description">Open a virtual browser session</div>
        </router-link>

        <router-link to="/skills" class="action-card">
          <div class="action-icon">⚡</div>
          <div class="action-title">Add Skill</div>
          <div class="action-description">Create or import a new skill</div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api';

const stats = ref({
  agents: 0,
  conversations: 0,
  skills: 0,
  tasks: 0,
});

onMounted(async () => {
  try {
    const [agents, conversations, skills, tasks] = await Promise.all([
      api.get('/agents'),
      api.get('/conversations'),
      api.get('/skills'),
      api.get('/tasks'),
    ]);

    stats.value = {
      agents: agents.length,
      conversations: conversations.length,
      skills: skills.length,
      tasks: tasks.length,
    };
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
});
</script>

<style scoped>
.dashboard {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: var(--spacing-2xl);
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.dashboard-header p {
  font-size: 1rem;
  color: var(--gray-600);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  transition: all var(--transition);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1;
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.quick-actions h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-lg);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--gray-200);
  text-decoration: none;
  transition: all var(--transition);
  display: block;
}

.action-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-300);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-md);
}

.action-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.action-description {
  font-size: 0.875rem;
  color: var(--gray-600);
  line-height: 1.5;
}
</style>
