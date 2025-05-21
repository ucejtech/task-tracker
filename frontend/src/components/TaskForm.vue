<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Task, Label } from '../types';
import { useTaskStore } from '../stores/taskStore';
import { useLabelStore } from '../stores/labelStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import LabelBadge from './LabelBadge.vue';

const props = withDefaults(defineProps<{
  isEdit?: boolean;
  taskId?: number;
}>(), {
  isEdit: false,
  taskId: 0
});

const router = useRouter();
const taskStore = useTaskStore();
const labelStore = useLabelStore();
const notificationsStore = useNotificationsStore();

const title = ref('');
const description = ref('');
const dueDate = ref('');
const priority = ref('medium');
const status = ref('pending');
const selectedLabels = ref<Label[]>([]);
const loading = ref(false);
const labelSearch = ref('');

const filteredLabels = computed(() => {
  return labelStore.labels
    .filter(label => !selectedLabels.value.some(l => l.id === label.id))
    .filter(label => label.name.toLowerCase().includes(labelSearch.value.toLowerCase()));
});

onMounted(async () => {
  await labelStore.fetchLabels();
  
  if (props.isEdit && props.taskId) {
    loading.value = true;
    try {
      const task = await taskStore.fetchTask(props.taskId);
      if (task) {
        title.value = task.title;
        description.value = task.description || '';
        status.value = task.status;
        priority.value = task.priority;
        
        if (task.due_date) {
          // Format date for input
          const date = new Date(task.due_date);
          dueDate.value = date.toISOString().split('T')[0];
        }
        
        selectedLabels.value = task.labels || [];
      }
    } catch (error) {
      notificationsStore.addNotification({
        type: 'error',
        message: 'Failed to load task details'
      });
    } finally {
      loading.value = false;
    }
  }
});

const onSubmit = async () => {
  if (!title.value.trim()) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Title is required'
    });
    return;
  }
  
  loading.value = true;
  try {
    const taskData = {
      title: title.value,
      description: description.value,
      status: status.value,
      priority: priority.value,
      due_date: dueDate.value || undefined,
      labels: selectedLabels.value.map(label => label.id)
    };
    
    if (props.isEdit && props.taskId) {
      await taskStore.updateTask({
        id: props.taskId,
        ...taskData
      });
      notificationsStore.addNotification({
        type: 'success',
        message: 'Task updated successfully'
      });
    } else {
      await taskStore.createTask(taskData);
      notificationsStore.addNotification({
        type: 'success',
        message: 'Task created successfully'
      });
    }
    
    router.push('/tasks');
  } catch (error) {
    notificationsStore.addNotification({
      type: 'error',
      message: props.isEdit ? 'Failed to update task' : 'Failed to create task'
    });
  } finally {
    loading.value = false;
  }
};

const selectLabel = (label: Label) => {
  selectedLabels.value.push(label);
  labelSearch.value = '';
};

const removeLabel = (labelId: number) => {
  selectedLabels.value = selectedLabels.value.filter(l => l.id !== labelId);
};

const cancel = () => {
  router.push('/tasks');
};
</script>

<template>
  <div class="task-form">
    <h1>{{ isEdit ? 'Edit Task' : 'Create New Task' }}</h1>
    
    <form @submit.prevent="onSubmit">
      <div class="form-group">
        <label for="title">Title</label>
        <input 
          id="title" 
          v-model="title" 
          type="text" 
          placeholder="Task title"
          required
          :disabled="loading"
        />
      </div>
      
      <div class="form-group">
        <label for="description">Description</label>
        <textarea 
          id="description" 
          v-model="description" 
          rows="4" 
          placeholder="Task description"
          :disabled="loading"
        ></textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" v-model="status" :disabled="loading">
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="priority">Priority</label>
          <select id="priority" v-model="priority" :disabled="loading">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label for="dueDate">Due Date</label>
        <input 
          id="dueDate" 
          v-model="dueDate" 
          type="date" 
          :disabled="loading"
        />
      </div>
      
      <div class="form-group">
        <label>Labels</label>
        <div class="selected-labels" v-if="selectedLabels.length > 0">
          <LabelBadge 
            v-for="label in selectedLabels"
            :key="label.id"
            :label="label"
            removable
            @remove="removeLabel(label.id)"
          />
        </div>
        
        <div class="label-search">
          <input 
            v-model="labelSearch"
            type="text"
            placeholder="Search labels"
            :disabled="loading"
          />
          
          <div class="label-dropdown" v-if="labelSearch && filteredLabels.length > 0">
            <div 
              v-for="label in filteredLabels"
              :key="label.id"
              class="label-option"
              @click="selectLabel(label)"
            >
              <div 
                class="label-color"
                :style="{ backgroundColor: label.color }"
              ></div>
              <span>{{ label.name }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button 
          type="button" 
          class="secondary"
          @click="cancel"
          :disabled="loading"
        >
          Cancel
        </button>
        <button 
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.task-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: var(--space-3);
}

.form-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: var(--space-1);
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.selected-labels {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}

.label-search {
  position: relative;
}

.label-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.label-option {
  display: flex;
  align-items: center;
  padding: var(--space-2);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.label-option:hover {
  background-color: var(--color-gray-100);
}

.label-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: var(--space-2);
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
    gap: var(--space-2);
  }
}

@media (prefers-color-scheme: dark) {
  .label-dropdown {
    background-color: var(--color-background-secondary);
    border-color: var(--color-gray-700);
  }
  
  .label-option:hover {
    background-color: var(--color-gray-800);
  }
}
</style>