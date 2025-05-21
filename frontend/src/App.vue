<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import AppHeader from './components/AppHeader.vue';
import AppSidebar from './components/AppSidebar.vue';
import { useNotificationsStore } from './stores/notificationsStore';

const sidebarOpen = ref(window.innerWidth >= 768);
const notificationsStore = useNotificationsStore();

provide('toggleSidebar', () => {
  sidebarOpen.value = !sidebarOpen.value;
});

onMounted(() => {
  const handleResize = () => {
    sidebarOpen.value = window.innerWidth >= 768;
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
});
</script>

<template>
  <div class="app-container">
    <AppHeader />
    
    <div class="main-container">
      <AppSidebar v-show="sidebarOpen" />
      
      <main class="content">
        <div v-if="notificationsStore.notifications.length > 0" class="notifications">
          <div 
            v-for="notification in notificationsStore.notifications" 
            :key="notification.id"
            :class="['notification', notification.type]"
          >
            <span>{{ notification.message }}</span>
            <button 
              class="close-btn"
              @click="notificationsStore.removeNotification(notification.id)"
            >
              &times;
            </button>
          </div>
        </div>
        
        <div class="page-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-container {
  display: flex;
  flex: 1;
}

.content {
  flex: 1;
  padding: var(--space-3);
  overflow-y: auto;
  position: relative;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

.notifications {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.notification {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: white;
  box-shadow: var(--shadow-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slide-in 0.3s ease;
}

.notification.success {
  background-color: var(--color-success);
  color: white;
}

.notification.error {
  background-color: var(--color-error);
  color: white;
}

.notification.warning {
  background-color: var(--color-warning);
  color: white;
}

.notification.info {
  background-color: var(--color-primary);
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
  margin-left: 0.5rem;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 767px) {
  .main-container {
    flex-direction: column;
  }
  
  .content {
    padding: var(--space-2);
  }
}
</style>