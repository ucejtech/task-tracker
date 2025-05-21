<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '../stores/taskStore';
import { useLabelStore } from '../stores/labelStore';
import TaskCard from '../components/TaskCard.vue';

const taskStore = useTaskStore();
const labelStore = useLabelStore();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const view = ref('grid');
const searchQuery = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');
const labelFilter = ref('');
const sortBy = ref('created_at');
const sortOrder = ref('desc');

const tasks = computed(() => taskStore.tasks);
const selectedLabel = computed(() => {
  if (!labelFilter.value) return null;
  return labelStore.labels.find(l => l.id.toString() === labelFilter.value);
});

const applyFilters = async () => {
  loading.value = true;
  
  const params: Record<string, string> = {};
  
  if (searchQuery.value) params.search = searchQuery.value;
  if (statusFilter.value) params.status = statusFilter.value;
  if (priorityFilter.value) params.priority = priorityFilter.value;
  if (labelFilter.value) params.label = labelFilter.value;
  if (sortBy.value) params.sort = sortBy.value;
  if (sortOrder.value) params.order = sortOrder.value;
  
  try {
    await taskStore.fetchTasks(params);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  priorityFilter.value = '';
  labelFilter.value = '';
  sortBy.value = 'created_at';
  sortOrder.value = 'desc';
  
  // Clear URL parameters
  router.replace({ query: {} });
  
  applyFilters();
};

const createTask = () => {
  router.push('/tasks/new');
};

watch([searchQuery, statusFilter, priorityFilter, labelFilter, sortBy, sortOrder], () => {
  // Update URL parameters
  router.replace({
    query: {
      ...(searchQuery.value ? { search: searchQuery.value } : {}),
      ...(statusFilter.value ? { status: statusFilter.value } : {}),
      ...(priorityFilter.value ? { priority: priorityFilter.value } : {}),
      ...(labelFilter.value ? { label: labelFilter.value } : {}),
      ...(sortBy.value !== 'created_at' ? { sort: sortBy.value } : {}),
      ...(sortOrder.value !== 'desc' ? { order: sortOrder.value } : {})
    }
  });
  
  applyFilters();
});

onMounted(async () => {
  // Fetch labels
  await labelStore.fetchLabels();
  
  // Set filters from URL parameters
  const query = route.query;
  
  if (query.search) searchQuery.value = query.search as string;
  if (query.status) statusFilter.value = query.status as string;
  if (query.priority) priorityFilter.value = query.priority as string;
  if (query.label) labelFilter.value = query.label as string;
  if (query.sort) sortBy.value = query.sort as string;
  if (query.order) sortOrder.value = query.order as string;
  
  // Fetch tasks with filters
  await applyFilters();
});
</script>

<template>
  <div class="tasks-page">
    <header class="page-header">
      <div>
        <h1>Tasks</h1>
        <p v-if="selectedLabel" class="filtered-by">
          Filtered by label: <span :style="{ color: selectedLabel.color }">{{ selectedLabel.name }}</span>
        </p>
      </div>
      <button @click="createTask">New Task</button>
    </header>
    
    <div class="filters-section">
      <div class="search-box">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search tasks..."
        />
      </div>
      
      <div class="filters-row">
        <div class="filter-group">
          <select v-model="statusFilter">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div class="filter-group">
          <select v-model="priorityFilter">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div class="filter-group">
          <select v-model="labelFilter">
            <option value="">All Labels</option>
            <option 
              v-for="label in labelStore.labels"
              :key="label.id"
              :value="label.id.toString()"
            >
              {{ label.name }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <select v-model="sortBy">
            <option value="created_at">Date Created</option>
            <option value="updated_at">Date Updated</option>
            <option value="due_date">Due Date</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
          </select>
        </div>
        
        <div class="filter-group">
          <select v-model="sortOrder">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        
        <button 
          class="secondary"
          @click="resetFilters"
        >
          Reset
        </button>
      </div>
      
      <div class="view-toggle">
        <button 
          :class="['view-button', { active: view === 'grid' }]"
          @click="view = 'grid'"
        >
          Grid
        </button>
        <button 
          :class="['view-button', { active: view === 'list' }]"
          @click="view = 'list'"
        >
          List
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-message">
      Loading tasks...
    </div>
    
    <div v-else-if="tasks.length === 0" class="empty-state">
      <p>No tasks found with the current filters.</p>
      <div class="empty-actions">
        <button class="secondary" @click="resetFilters">Reset Filters</button>
        <button @click="createTask">Create New Task</button>
      </div>
    </div>
    
    <div v-else :class="['task-container', { 'task-grid': view === 'grid', 'task-list': view === 'list' }]">
      <TaskCard 
        v-for="task in tasks" 
        :key="task.id" 
        :task="task" 
      />
    </div>
  </div>
</template>

<style scoped>
.tasks-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.page-header h1 {
  margin-bottom: 0;
}

.filtered-by {
  margin-top: var(--space-1);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.filters-section {
  margin-bottom: var(--space-4);
}

.search-box {
  margin-bottom: var(--space-3);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.filter-group {
  flex: 1;
  min-width: 150px;
}

.view-toggle {
  display: flex;
  gap: var(--space-2);
}

.view-button {
  background-color: var(--color-gray-200);
  color: var(--color-text);
  padding: var(--space-1) var(--space-2);
}

.view-button.active {
  background-color: var(--color-primary);
  color: white;
}

.task-container {
  transition: all var(--transition-normal);
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-3);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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

.empty-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}

@media (min-width: 640px) {
  .task-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .task-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .filter-group {
    width: 100%;
  }
}

@media (prefers-color-scheme: dark) {
  .empty-state {
    background-color: var(--color-background-secondary);
  }
  
  .view-button {
    background-color: var(--color-gray-700);
  }
}
</style>