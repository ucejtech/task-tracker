import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { Task } from '../types';
import { API_URL } from '../config';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([]);
  const currentTask = ref<Task | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchTasks = async (params: Record<string, string> = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/tasks`, { params });
      tasks.value = response.data;
      return response.data;
    } catch (err) {
      console.error('Error fetching tasks:', err);
      error.value = 'Failed to fetch tasks';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTask = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/tasks/${id}`);
      currentTask.value = response.data;
      return response.data;
    } catch (err) {
      console.error(`Error fetching task ${id}:`, err);
      error.value = 'Failed to fetch task';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post(`${API_URL}/tasks`, taskData);
      tasks.value = [response.data, ...tasks.value];
      return response.data;
    } catch (err) {
      console.error('Error creating task:', err);
      error.value = 'Failed to create task';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateTask = async (taskData: Partial<Task> & { id: number }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.put(
        `${API_URL}/tasks/${taskData.id}`,
        taskData
      );

      // Update in tasks list if present
      const index = tasks.value.findIndex((t) => t.id === taskData.id);
      if (index !== -1) {
        tasks.value[index] = response.data;
      }

      // Update current task if it's the same
      if (currentTask.value && currentTask.value.id === taskData.id) {
        currentTask.value = response.data;
      }

      return response.data;
    } catch (err) {
      console.error(`Error updating task ${taskData.id}:`, err);
      error.value = 'Failed to update task';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteTask = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      tasks.value = tasks.value.filter((t) => t.id !== id);

      if (currentTask.value && currentTask.value.id === id) {
        currentTask.value = null;
      }
    } catch (err) {
      console.error(`Error deleting task ${id}:`, err);
      error.value = 'Failed to delete task';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    tasks,
    currentTask,
    loading,
    error,
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask
  };
});
