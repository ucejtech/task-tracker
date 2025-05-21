<script setup lang="ts">
import { inject } from 'vue';
import { useRouter } from 'vue-router';

type ToggleSidebar = () => void;
const toggleSidebar = inject<ToggleSidebar>('toggleSidebar');
const router = useRouter();

const newTask = () => {
  router.push('/tasks/new');
};
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button class="menu-button" @click="toggleSidebar">
        <span class="menu-icon"></span>
      </button>
      <div class="logo" @click="router.push('/')">
        <span class="logo-icon">✓</span>
        <h1 class="logo-text">TaskSync</h1>
      </div>
    </div>
    
    <div class="header-actions">
      <button class="create-button" @click="newTask">
        <span class="icon">+</span>
        New Task
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 64px;
  padding: 0 var(--space-3);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: background-color var(--transition-fast);
}

.header-left {
  display: flex;
  align-items: center;
}

.menu-button {
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: var(--space-2);
  padding: 0;
  border-radius: var(--radius-md);
}

.menu-button:hover {
  background-color: var(--color-gray-100);
}

.menu-icon {
  display: block;
  position: relative;
  width: 24px;
  height: 2px;
  background-color: var(--color-text);
}

.menu-icon::before,
.menu-icon::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  background-color: var(--color-text);
  transition: transform var(--transition-fast);
}

.menu-icon::before {
  top: -6px;
}

.menu-icon::after {
  bottom: -6px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  margin-right: var(--space-2);
  font-weight: bold;
  font-size: 18px;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  font-size: 1.25rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .create-button span:not(.icon) {
    display: none;
  }
  
  .create-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    padding: 0;
    justify-content: center;
  }
  
  .create-button .icon {
    margin: 0;
  }
  
  .logo-text {
    display: none;
  }
}
</style>