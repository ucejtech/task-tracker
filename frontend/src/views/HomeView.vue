<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTaskStore } from '../stores/taskStore';
import TaskCard from '../components/TaskCard.vue';

const router = useRouter();
const taskStore = useTaskStore();

const loading = ref(true);
const tasks = ref([]);

const pendingTasks = computed(() => {
  return tasks.value.filter(task => task.status === 'pending');
});

const inProgressTasks = computed(() => {
  return tasks.value.filter(task => task.status === 'in-progress');
});

const completedTasks = computed(() => {
  return tasks.value.filter(task => task.status === 'completed');
});

const totalTasks = computed(() => {
  return tasks.value.length;
});

const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0;
  return Math.round((completedTasks.value.length / totalTasks.value) * 100);
});

const createTask = () => {
  router.push('/tasks/new');
};

const viewAllTasks = () => {
  router.push('/tasks');
};

onMounted(async () => {
  try {
    tasks.value = await taskStore.fetchTasks();
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="home-page">
    <header class="page-header">
      <h1>Dashboard</h1>
      <button @click="createTask">New Task</button>
    </header>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Tasks</h3>
        <div class="stat-value">{{ totalTasks }}</div>
      </div>
      <div class="stat-card">
        <h3>Pending</h3>
        <div class="stat-value">{{ pendingTasks.length }}</div>
      </div>
      <div class="stat-card">
        <h3>In Progress</h3>
        <div class="stat-value">{{ inProgressTasks.length }}</div>
      </div>
      <div class="stat-card">
        <h3>Completed</h3>
        <div class="stat-value">{{ completedTasks.length }}</div>
      </div>
    </div>
    
    <div class="completion-section">
      <div class="completion-header">
        <h2>Completion Rate</h2>
        <span class="completion-percentage">{{ completionRate }}%</span>
      </div>
      <div class="progress-container">
        <div 
          class="progress-bar" 
          :style="{ width: `${completionRate}%` }"
        ></div>
      </div>
    </div>
    
    <div class="task-section">
      <div class="section-header">
        <h2>Recent Tasks</h2>
        <button class="secondary" @click="viewAllTasks">View All</button>
      </div>
      
      <div v-if="loading" class="loading-message">
        Loading tasks...
      </div>
      
      <div v-else-if="tasks.length === 0" class="empty-state">
        <p>No tasks found. Let's create some!</p>
        <button @click="createTask">Create First Task</button>
      </div>
      
      <div v-else class="task-grid">
        <TaskCard 
          v-for="task in tasks.slice(0, 6)" 
          :key="task.id" 
          :task="task" 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.stat-card {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  margin-top: var(--space-1);
}

.completion-section {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.completion-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.completion-percentage {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
}

.progress-container {
  width: 100%;
  height: 8px;
  background-color: var(--color-gray-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 4px;
  transition: width var(--transition-normal);
}

.task-section {
  margin-bottom: var(--space-4);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.section-header h2 {
  margin: 0;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-3);
}

.loading-message {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-text-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--space-4);
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-state p {
  margin-bottom: var(--space-3);
  color: var(--color-text-secondary);
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .task-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .task-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (prefers-color-scheme: dark) {
  .stat-card, .completion-section, .empty-state {
    background-color: var(--color-background-secondary);
  }
  
  .progress-container {
    background-color: var(--color-gray-700);
  }
}
</style>

#tes