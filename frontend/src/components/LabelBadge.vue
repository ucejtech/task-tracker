<script setup lang="ts">
import { Label } from '../types';

defineProps<{
  label: Label;
  removable?: boolean;
}>();

const emit = defineEmits(['remove']);

const removeLabel = (event: Event) => {
  event.stopPropagation();
  emit('remove');
};
</script>

<template>
  <div 
    class="label-badge"
    :style="{ 
      backgroundColor: label.color + '40', 
      color: label.color 
    }"
  >
    <span>{{ label.name }}</span>
    <button 
      v-if="removable"
      @click="removeLabel"
      class="remove-button"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.label-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.remove-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  line-height: 1;
  font-size: 14px;
  color: inherit;
}
</style>