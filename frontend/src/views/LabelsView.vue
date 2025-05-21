<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLabelStore } from '../stores/labelStore';
import { useNotificationsStore } from '../stores/notificationsStore';

const labelStore = useLabelStore();
const notificationsStore = useNotificationsStore();

const loading = ref(true);
const labelName = ref('');
const labelColor = ref('#0A84FF');
const editingLabelId = ref<number | null>(null);
const confirmDeleteId = ref<number | null>(null);

const colorOptions = [
  '#0A84FF', // Blue
  '#30D158', // Green
  '#FF9F0A', // Orange
  '#FF453A', // Red
  '#BF5AF2', // Purple
  '#64D2FF', // Light Blue
  '#FFD60A', // Yellow
  '#FF375F', // Pink
  '#5E5CE6'  // Indigo
];

onMounted(async () => {
  loading.value = true;
  try {
    await labelStore.fetchLabels();
  } catch (error) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Failed to load labels'
    });
  } finally {
    loading.value = false;
  }
});

const createLabel = async () => {
  if (!labelName.value.trim()) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Label name is required'
    });
    return;
  }
  
  try {
    await labelStore.createLabel({
      name: labelName.value.trim(),
      color: labelColor.value
    });
    
    notificationsStore.addNotification({
      type: 'success',
      message: 'Label created successfully'
    });
    
    labelName.value = '';
    labelColor.value = '#0A84FF';
  } catch (error) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Failed to create label'
    });
  }
};

const startEditLabel = (label) => {
  editingLabelId.value = label.id;
  labelName.value = label.name;
  labelColor.value = label.color;
};

const updateLabel = async () => {
  if (!editingLabelId.value || !labelName.value.trim()) {
    return;
  }
  
  try {
    await labelStore.updateLabel({
      id: editingLabelId.value,
      name: labelName.value.trim(),
      color: labelColor.value
    });
    
    notificationsStore.addNotification({
      type: 'success',
      message: 'Label updated successfully'
    });
    
    cancelEdit();
  } catch (error) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Failed to update label'
    });
  }
};

const confirmDelete = (labelId) => {
  confirmDeleteId.value = labelId;
};

const deleteLabel = async (labelId) => {
  try {
    await labelStore.deleteLabel(labelId);
    
    notificationsStore.addNotification({
      type: 'success',
      message: 'Label deleted successfully'
    });
    
    confirmDeleteId.value = null;
  } catch (error) {
    notificationsStore.addNotification({
      type: 'error',
      message: 'Failed to delete label'
    });
  }
};

const cancelDelete = () => {
  confirmDeleteId.value = null;
};

const cancelEdit = () => {
  editingLabelId.value = null;
  labelName.value = '';
  labelColor.value = '#0A84FF';
};
</script>

<template>
  <div class="labels-page">
    <h1>Manage Labels</h1>
    
    <div class="create-label-form">
      <h2>{{ editingLabelId ? 'Edit Label' : 'Create New Label' }}</h2>
      
      <div class="form-group">
        <label for="labelName">Name</label>
        <input 
          id="labelName" 
          v-model="labelName" 
          type="text" 
          placeholder="Label name" 
          :disabled="loading"
        />
      </div>
      
      <div class="form-group">
        <label>Color</label>
        <div class="color-options">
          <div 
            v-for="color in colorOptions"
            :key="color"
            class="color-option"
            :class="{ active: labelColor === color }"
            :style="{ backgroundColor: color }"
            @click="labelColor = color"
          ></div>
        </div>
      </div>
      
      <div class="label-preview">
        <span>Preview:</span>
        <div 
          class="preview-badge"
          :style="{ 
            backgroundColor: labelColor + '40',
            color: labelColor
          }"
        >
          {{ labelName || 'Label Name' }}
        </div>
      </div>
      
      <div class="form-actions">
        <button 
          v-if="editingLabelId"
          type="button" 
          class="secondary"
          @click="cancelEdit"
        >
          Cancel
        </button>
        
        <button 
          v-if="editingLabelId"
          @click="updateLabel"
          :disabled="!labelName.trim()"
        >
          Update Label
        </button>
        
        <button 
          v-else
          @click="createLabel"
          :disabled="!labelName.trim()"
        >
          Create Label
        </button>
      </div>
    </div>
    
    <div class="labels-list-section">
      <h2>Your Labels</h2>
      
      <div v-if="loading" class="loading-message">
        Loading labels...
      </div>
      
      <div v-else-if="labelStore.labels.length === 0" class="empty-state">
        <p>No labels found. Create your first label above.</p>
      </div>
      
      <div v-else class="labels-list">
        <div 
          v-for="label in labelStore.labels"
          :key="label.id"
          class="label-item"
        >
          <div class="label-info">
            <div 
              class="label-color"
              :style="{ backgroundColor: label.color }"
            ></div>
            <span class="label-name">{{ label.name }}</span>
          </div>
          
          <div class="label-actions">
            <button 
              v-if="confirmDeleteId === label.id"
              class="danger sm"
              @click="deleteLabel(label.id)"
            >
              Confirm
            </button>
            
            <button 
              v-if="confirmDeleteId === label.id"
              class="secondary sm"
              @click="cancelDelete"
            >
              Cancel
            </button>
            
            <button 
              v-if="confirmDeleteId !== label.id"
              class="secondary sm"
              @click="startEditLabel(label)"
              :disabled="editingLabelId === label.id"
            >
              Edit
            </button>
            
            <button 
              v-if="confirmDeleteId !== label.id"
              class="danger sm"
              @click="confirmDelete(label.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.labels-page {
  max-width: 800px;
  margin: 0 auto;
}

.create-label-form {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.form-group {
  margin-bottom: var(--space-3);
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  transform: scale(1.1);
  box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color-gray-400);
}

.label-preview {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.preview-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.labels-list-section {
  background-color: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.labels-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.label-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--color-gray-100);
}

.label-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.label-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.label-name {
  font-weight: 500;
}

.label-actions {
  display: flex;
  gap: var(--space-1);
}

button.sm {
  font-size: 0.75rem;
  padding: 4px 8px;
}

.loading-message, .empty-state {
  text-align: center;
  padding: var(--space-3);
  color: var(--color-text-secondary);
}

@media (prefers-color-scheme: dark) {
  .create-label-form, .labels-list-section {
    background-color: var(--color-background-secondary);
  }
  
  .label-item {
    background-color: var(--color-gray-800);
  }
  
  .color-option.active {
    box-shadow: 0 0 0 2px var(--color-background-secondary), 0 0 0 4px var(--color-gray-500);
  }
}
</style>