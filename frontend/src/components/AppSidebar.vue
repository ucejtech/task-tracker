<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { useLabelStore } from '../stores/labelStore';

const labelStore = useLabelStore();
const router = useRouter();
const route = useRoute();

onMounted(async () => {
  await labelStore.fetchLabels();
});

const activeLink = computed(() => {
  return route.path;
});

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <h3 class="sidebar-title">Dashboard</h3>
      <nav class="sidebar-nav">
        <a 
          @click.prevent="navigateTo('/')" 
          :class="['nav-link', { active: activeLink === '/' }]"
        >
          <span class="nav-icon">📊</span>
          <span>Overview</span>
        </a>
        <a 
          @click.prevent="navigateTo('/tasks')" 
          :class="['nav-link', { active: activeLink.startsWith('/tasks') }]"
        >
          <span class="nav-icon">✓</span>
          <span>All Tasks</span>
        </a>
      </nav>
    </div>
    
    <div class="sidebar-section">
      <h3 class="sidebar-title">
        <span>Labels</span>
        <button 
          @click="navigateTo('/labels')" 
          class="sidebar-action"
          title="Manage Labels"
        >
          <span>+</span>
        </button>
      </h3>
      <nav class="sidebar-nav">
        <a 
          v-for="label in labelStore.labels" 
          :key="label.id"
          @click.prevent="navigateTo(`/tasks?label=${label.id}`)"
          class="nav-link"
        >
          <span 
            class="color-dot" 
            :style="{ backgroundColor: label.color }"
          ></span>
          <span>{{ label.name }}</span>
        </a>
      </nav>
    </div>
    
    <div class="sidebar-section">
      <h3 class="sidebar-title">Status</h3>
      <nav class="sidebar-nav">
        <a 
          @click.prevent="navigateTo('/tasks?status=pending')" 
          class="nav-link"
        >
          <span class="color-dot" style="background-color: var(--color-warning)"></span>
          <span>Pending</span>
        </a>
        <a 
          @click.prevent="navigateTo('/tasks?status=in-progress')" 
          class="nav-link"
        >
          <span class="color-dot" style="background-color: var(--color-primary)"></span>
          <span>In Progress</span>
        </a>
        <a 
          @click.prevent="navigateTo('/tasks?status=completed')" 
          class="nav-link"
        >
          <span class="color-dot" style="background-color: var(--color-success)"></span>
          <span>Completed</span>
        </a>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background-color: var(--color-background);
  border-right: 1px solid var(--color-gray-200);
  padding: var(--space-3);
  overflow-y: auto;
  height: calc(100vh - 64px);
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.sidebar-section {
  margin-bottom: var(--space-4);
}

.sidebar-title {
  font-size: 0.875rem;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-action {
  width: 24px;
  height: 24px;
  background-color: var(--color-gray-200);
  color: var(--color-text);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-weight: bold;
  transition: background-color var(--transition-fast);
}

.sidebar-action:hover {
  background-color: var(--color-gray-300);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.nav-link:hover {
  background-color: var(--color-gray-100);
}

.nav-link.active {
  background-color: var(--color-gray-100);
  font-weight: 500;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 16px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: var(--space-1);
}

@media (max-width: 767px) {
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 300px;
    border-right: none;
    border-bottom: 1px solid var(--color-gray-200);
  }
}
</style>