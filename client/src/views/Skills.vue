<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Skills</h1>
        <p>Extend your agents with custom skills</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary">Create Skill</button>
    </div>

    <div class="skills-grid">
      <div v-for="skill in skills" :key="skill.id" class="skill-card">
        <div class="skill-header">
          <h3>{{ skill.name }}</h3>
          <span v-if="skill.is_public" class="badge badge-primary">Public</span>
        </div>
        <p class="skill-description">{{ skill.description }}</p>
        <div class="skill-meta">
          <span>{{ skill.category }}</span>
          <span>v{{ skill.version }}</span>
          <span>{{ skill.usage_count }} uses</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../lib/api';

const skills = ref([]);
const showCreateModal = ref(false);

onMounted(async () => {
  await loadSkills();
});

async function loadSkills() {
  try {
    skills.value = await api.get('/skills');
  } catch (error) {
    console.error('Failed to load skills:', error);
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

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.skill-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--gray-200);
}

.skill-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.skill-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.skill-description {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: var(--spacing-md);
}

.skill-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--gray-500);
}
</style>
