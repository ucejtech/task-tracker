<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { formatDistanceToNow } from 'date-fns';
import { Task } from '../types';
import { useTaskStore } from '../stores/taskStore';

const props = defineProps<{
  task: Task
}>();

const router = useRouter();
const taskStore = useTaskStore();

const statusColor = computed(() => {
  switch (props.task.status) {
    case 'completed':
      return 'var(--color-success)';
    case 'in-progress':
      return 'var(--color-primary)';
    default:
      return 'var(--color-warning)';
  }
});

const priorityLabel = computed(() => {
  switch (props.task.priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
});

const priorityColor = computed(() => {
  switch (props.task.priority) {
    case 'high':
      return 'var(--color-error)';
    case 'medium':
      return 'var(--color-accent)';
    case 'low':
      return 'var(--color-success)';
    default:
      return 'var(--color-accent)';
  }
});

const formattedDate = computed(() => {
  if (!props.task.due_date) return 'No due date';
  return formatDistanceToNow(new Date(props.task.due_date), { addSuffix: true });
});

const toggleStatus = async () => {
  const newStatus = props.task.status === 'completed' ? 'pending' : 'completed';
  await taskStore.updateTask({
    ...props.task,
    status: newStatus
  });
};

const viewTask = () => {
  router.push(`/tasks/${props.task.id}`);
};
</script>

<template>
  <div class="task-card" @click="viewTask">
    <div class="task-header">
      <div class="task-checkbox-container" @click.stop="toggleStatus">
        <div 
          class="task-checkbox" 
          :class="{ completed: task.status === 'completed' }"
          :style="{ borderColor: statusColor }"
        >
          <span v-if="task.status === 'completed'" class="check-mark">✓</span>
        </div>
        <h3 
          class="task-title" 
          :class="{ completed: task.status === 'completed' }"
        >
          {{ task.title }}
        </h3>
      </div>
      <div 
        class="priority-badge"
        :style="{ backgroundColor: priorityColor }"
      >
        {{ priorityLabel }}
      </div>
    </div>
    
    <p v-if="task.description" class="task-description">
      {{ task.description.length > 100 
        ? `${task.description.substring(0, 100)}...` 
        : task.description }}
    </p>
    
    <div class="task-footer">
      <div class="task-labels" v-if="task.labels && task.labels.length > 0">
        <span 
          v-for="label in task.labels.slice(0, 3)" 
          :key="label.id"
          class="task-label"
          :style="{ backgroundColor: label.color + '40', color: label.color }"
        >
          {{ label.name }}
        </span>
        <span v-if="task.labels.length > 3" class="more-label">
          +{{ task.labels.length - 3 }}
        </span>
      </div>
      
      <div class="task-due-date" v-if="task.due_date">
        <span class="due-icon">🕒</span>
        <span>{{ formattedDate }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-3);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  border: 1px solid var(--color-gray-200);
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-2);
}

.task-checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  flex: 1;
}

.task-checkbox {
  min-width: 20px;
  min-height: 20px;
  border: 2px solid var(--color-gray-300);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.task-checkbox.completed {
  background-color: var(--color-success);
  border-color: var(--color-success);
}

.check-mark {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.task-title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
  transition: text-decoration var(--transition-fast), opacity var(--transition-fast);
  flex: 1;
  margin-top: 0;
}

.task-title.completed {
  text-decoration: line-through;
  opacity: 0.7;
}

.priority-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
  font-weight: 500;
  margin-left: var(--space-2);
}

.task-description {
  margin: var(--space-2) 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-2);
  font-size: 0.75rem;
}

.task-labels {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.task-label {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.more-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}

.task-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.due-icon {
  font-size: 12px;
}

@media (prefers-color-scheme: dark) {
  .task-card {
    background-color: var(--color-background-secondary);
    border-color: var(--color-gray-700);
  }
}
</style>