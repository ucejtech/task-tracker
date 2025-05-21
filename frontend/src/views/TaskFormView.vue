<script setup lang="ts">
import TaskForm from '../components/TaskForm.vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isEdit = !!route.params.id;
const taskId = isEdit ? parseInt(route.params.id as string) : 0;
</script>

<template>
  <TaskForm :is-edit="isEdit" :task-id="taskId" />
</template>