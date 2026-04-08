<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Virtual Browser</h1>
        <p>Manage browser sessions</p>
      </div>
      <button @click="createSession" class="btn btn-primary">New Session</button>
    </div>

    <div v-if="currentSession" class="browser-viewer">
      <div class="browser-toolbar">
        <input
          v-model="navigationUrl"
          @keydown.enter="navigate"
          placeholder="Enter URL..."
          class="input"
        />
        <button @click="navigate" class="btn btn-primary">Go</button>
        <button @click="refreshScreenshot" class="btn btn-outline">Refresh</button>
      </div>

      <div class="browser-screen">
        <img v-if="screenshot" :src="screenshot" alt="Browser screenshot" />
        <div v-else class="empty-screen">
          <p>No screenshot available</p>
        </div>
      </div>
    </div>

    <div v-else class="browser-empty">
      <div class="empty-icon">🌐</div>
      <h2>No Active Session</h2>
      <p>Create a new browser session to start automating</p>
      <button @click="createSession" class="btn btn-primary">Create Session</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api';

const currentSession = ref(null);
const screenshot = ref(null);
const navigationUrl = ref('');

onMounted(async () => {
  await loadSessions();
});

async function loadSessions() {
  try {
    const sessions = await api.get('/browser/sessions');
    if (sessions.length > 0) {
      currentSession.value = sessions[0];
      screenshot.value = currentSession.value.screenshot_url;
    }
  } catch (error) {
    console.error('Failed to load sessions:', error);
  }
}

async function createSession() {
  try {
    const agents = await api.get('/agents');
    if (agents.length === 0) {
      alert('Please create an agent first');
      return;
    }

    currentSession.value = await api.post('/browser/sessions', {
      agent_id: agents[0].id,
    });
  } catch (error) {
    console.error('Failed to create session:', error);
  }
}

async function navigate() {
  if (!navigationUrl.value || !currentSession.value) return;

  try {
    await api.post(`/browser/sessions/${currentSession.value.id}/navigate`, {
      url: navigationUrl.value,
    });

    await refreshScreenshot();
  } catch (error) {
    console.error('Failed to navigate:', error);
  }
}

async function refreshScreenshot() {
  if (!currentSession.value) return;

  try {
    const result = await api.get(`/browser/sessions/${currentSession.value.id}/screenshot`);
    screenshot.value = result.screenshot;
  } catch (error) {
    console.error('Failed to refresh screenshot:', error);
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

.browser-viewer {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  overflow: hidden;
}

.browser-toolbar {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.browser-toolbar .input {
  flex: 1;
}

.browser-screen {
  padding: var(--spacing-lg);
  background: var(--gray-50);
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.browser-screen img {
  max-width: 100%;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
}

.empty-screen {
  text-align: center;
  color: var(--gray-500);
}

.browser-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
  min-height: 500px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.browser-empty h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-sm);
}

.browser-empty p {
  font-size: 1rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xl);
}
</style>
