<template>
  <div class="layout">
    <nav class="sidebar">
      <div class="sidebar-header">
        <h2>Cloud Agent</h2>
      </div>

      <div class="sidebar-nav">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">📊</span>
          <span class="nav-text">Dashboard</span>
        </router-link>

        <router-link to="/agents" class="nav-item">
          <span class="nav-icon">🤖</span>
          <span class="nav-text">Agents</span>
        </router-link>

        <router-link to="/chat" class="nav-item">
          <span class="nav-icon">💬</span>
          <span class="nav-text">Chat</span>
        </router-link>

        <router-link to="/browser" class="nav-item">
          <span class="nav-icon">🌐</span>
          <span class="nav-text">Browser</span>
        </router-link>

        <router-link to="/skills" class="nav-item">
          <span class="nav-icon">⚡</span>
          <span class="nav-text">Skills</span>
        </router-link>

        <router-link to="/knowledge" class="nav-item">
          <span class="nav-icon">📚</span>
          <span class="nav-text">Knowledge</span>
        </router-link>

        <router-link to="/tasks" class="nav-item">
          <span class="nav-icon">⏰</span>
          <span class="nav-text">Tasks</span>
        </router-link>
      </div>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-details">
            <div class="user-name">{{ userName }}</div>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const userName = computed(() => {
  return authStore.user?.email || 'User';
});

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase();
});

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.sidebar-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-900);
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 0.75rem var(--spacing-md);
  color: var(--gray-700);
  text-decoration: none;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xs);
  transition: all var(--transition);
  font-size: 0.875rem;
  font-weight: 500;
}

.nav-item:hover {
  background: var(--gray-50);
  color: var(--gray-900);
}

.nav-item.router-link-active {
  background: var(--primary-50);
  color: var(--primary-700);
}

.nav-icon {
  font-size: 1.25rem;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--gray-200);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
  margin-bottom: 0.125rem;
}

.logout-btn {
  background: none;
  border: none;
  color: var(--gray-600);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  transition: color var(--transition);
}

.logout-btn:hover {
  color: var(--gray-900);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--gray-50);
}
</style>
