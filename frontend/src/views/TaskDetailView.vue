<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatDistanceToNow, format } from 'date-fns';
import { useTaskStore } from '../stores/taskStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import LabelBadge from '../components/LabelBadge.vue';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const notificationsStore = useNotificationsStore();

const loading = ref(true);
const confirmDelete = ref(false);

const taskId = parseInt(route.params.id as string);

onMounted(async () => {
  loading.value = true;

  try {
    await taskStore.fetchTask(taskId);
  } catch (error) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Failed to load task details'
    });
    router.push('/tasks');
  } finally {
    loading.value = false;
  }
});

const statusColor = computed(() => {
  if (!taskStore.currentTask) return '';

  switch (taskStore.currentTask.status) {
    case 'completed':
      return 'var(--color-success)';
    case 'in-progress':
      return 'var(--color-primary)';
    default:
      return 'var(--color-warning)';
  }
});

const priorityColor = computed(() => {
  if (!taskStore.currentTask) return '';

  switch (taskStore.currentTask.priority) {
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

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not set';
  return format(new Date(dateString), 'PPP');
};

const formatRelativeDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

const editTask = () => {
  router.push(`/tasks/${taskId}/edit`);
};

const toggleTaskStatus = async () => {
  if (!taskStore.currentTask) return;

  const newStatus =
    taskStore.currentTask.status === 'completed' ? 'pending' : 'completed';

  try {
    await taskStore.updateTask({
      id: taskId,
      status: newStatus
    });

    notificationsStore.addNotification({
      type: 'success',
      message: `Task marked as ${
        newStatus === 'completed' ? 'completed' : 'pending'
      }`
    });
  } catch (error) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Failed to update task status'
    });
  }
};

const deleteTask = async () => {
  if (!confirmDelete.value) {
    confirmDelete.value = true;
    return;
  }

  try {
    await taskStore.deleteTask(taskId);

    notificationsStore.addNotification({
      type: 'success',
      message: 'Task deleted successfully'
    });

    router.push('/tasks');
  } catch (error) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Failed to delete task'
    });
  }
};

const cancelDelete = () => {
  confirmDelete.value = false;
};

const backToTasks = () => {
  router.push('/tasks');
};
</script>

<template>
  <div class="task-detail-page">
    <div class="back-link" @click="backToTasks">← Back to Tasks</div>

    <div v-if="loading" class="loading-message">Loading task details...</div>

    <div v-else-if="!taskStore.currentTask" class="error-state">
      <p>Task not found or could not be loaded.</p>
      <button @click="backToTasks">Return to Tasks</button>
    </div>

    <div v-else class="task-detail-container">
      <div class="task-header">
        <div class="task-title-section">
          <div
            class="status-indicator"
            :style="{ backgroundColor: statusColor }"
          ></div>
          <h1>{{ taskStore.currentTask.title }}</h1>
        </div>

        <div class="task-actions">
          <button
            :class="[
              'status-button',
              taskStore.currentTask.status === 'completed' ? 'completed' : ''
            ]"
            @click="toggleTaskStatus"
          >
            {{
              taskStore.currentTask.status === 'completed'
                ? 'Mark as Pending'
                : 'Mark as Completed'
            }}
          </button>
          <button @click="editTask">Edit</button>
          <button v-if="!confirmDelete" class="danger" @click="deleteTask">
            Delete
          </button>
          <div v-else class="delete-confirmation">
            <span>Are you sure?</span>
            <button class="danger" @click="deleteTask">Yes, Delete</button>
            <button class="secondary" @click="cancelDelete">Cancel</button>
          </div>
        </div>
      </div>

      <div class="task-meta">
        <div class="meta-item">
          <span class="meta-label">Status</span>
          <span
            class="meta-value status-badge"
            :style="{ backgroundColor: statusColor }"
          >
            {{ taskStore.currentTask.status.replace('-', ' ') }}
          </span>
        </div>

        <div class="meta-item">
          <span class="meta-label">Priority</span>
          <span
            class="meta-value priority-badge"
            :style="{ backgroundColor: priorityColor }"
          >
            {{ taskStore.currentTask.priority }}
          </span>
        </div>

        <div class="meta-item">
          <span class="meta-label">Created</span>
          <span class="meta-value">
            {{ formatDate(taskStore.currentTask.created_at) }}
            <span class="meta-relative">{{
              formatRelativeDate(taskStore.currentTask.created_at)
            }}</span>
          </span>
        </div>

        <div class="meta-item">
          <span class="meta-label">Due Date</span>
          <span class="meta-value">
            {{ formatDate(taskStore.currentTask.due_date) }}
            <span v-if="taskStore.currentTask.due_date" class="meta-relative">
              {{ formatRelativeDate(taskStore.currentTask.due_date) }}
            </span>
          </span>
        </div>
      </div>

      <div
        class="task-labels"
        v-if="
          taskStore.currentTask.labels &&
          taskStore.currentTask.labels.length > 0
        "
      >
        <h3>Labels</h3>
        <div class="labels-container">
          <LabelBadge
            v-for="label in taskStore.currentTask.labels"
            :key="label.id"
            :label="label"
          />
        </div>
      </div>

      <div class="task-description" v-if="taskStore.currentTask.description">
        <h3>Description</h3>
        <div class="description-content">
          {{ taskStore.currentTask.description }}
        </div>
      </div>

      <div v-else class="no-description">
        <p>No description provided.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-detail-page {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  margin-bottom: var(--space-3);
  color: var(--color-primary);
  cursor: pointer;
  display: inline-block;
}

.back-link:hover {
  text-decoration: underline;
}

.task-detail-container {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-4);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.task-title-section {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  flex: 1;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 12px;
}

.task-title-section h1 {
  margin: 0;
  line-height: 1.3;
}

.task-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.status-button {
  background-color: var(--color-primary);
}

.status-button.completed {
  background-color: var(--color-text-secondary);
}

.delete-confirmation {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background-color: var(--color-gray-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
}

.delete-confirmation span {
  font-size: 0.875rem;
}

.task-meta {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  background-color: var(--color-gray-100);
  padding: var(--space-3);
  border-radius: var(--radius-md);
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.meta-value {
  font-weight: 500;
}

.meta-relative {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-left: var(--space-1);
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  color: white;
  text-transform: capitalize;
}

.task-labels {
  margin-bottom: var(--space-4);
}

.task-labels h3,
.task-description h3 {
  margin-bottom: var(--space-2);
  font-size: 1.125rem;
}

.labels-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.task-description {
  margin-bottom: var(--space-3);
}

.description-content {
  line-height: 1.6;
  white-space: pre-line;
}

.no-description {
  color: var(--color-text-secondary);
  font-style: italic;
}

.loading-message,
.error-state {
  text-align: center;
  padding: var(--space-4);
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.error-state p {
  margin-bottom: var(--space-3);
  color: var(--color-error);
}

@media (min-width: 768px) {
  .task-meta {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-color-scheme: dark) {
  .task-detail-container,
  .loading-message,
  .error-state {
    background-color: var(--color-background-secondary);
  }

  .task-meta {
    background-color: var(--color-gray-800);
  }

  .delete-confirmation {
    background-color: var(--color-gray-700);
  }
}
</style>
