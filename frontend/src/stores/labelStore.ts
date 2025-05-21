import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { Label } from '../types';
import { API_URL } from '../config';

export const useLabelStore = defineStore('label', () => {
  const labels = ref<Label[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchLabels = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/labels`);
      labels.value = response.data;
      return response.data;
    } catch (err) {
      console.error('Error fetching labels:', err);
      error.value = 'Failed to fetch labels';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createLabel = async (labelData: Omit<Label, 'id'>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post(`${API_URL}/labels`, labelData);
      labels.value = [...labels.value, response.data];
      return response.data;
    } catch (err) {
      console.error('Error creating label:', err);
      error.value = 'Failed to create label';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateLabel = async (labelData: Partial<Label> & { id: number }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.put(
        `${API_URL}/labels/${labelData.id}`,
        labelData
      );

      const index = labels.value.findIndex((l) => l.id === labelData.id);
      if (index !== -1) {
        labels.value[index] = response.data;
      }

      return response.data;
    } catch (err) {
      console.error(`Error updating label ${labelData.id}:`, err);
      error.value = 'Failed to update label';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteLabel = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      await axios.delete(`${API_URL}/labels/${id}`);
      labels.value = labels.value.filter((l) => l.id !== id);
    } catch (err) {
      console.error(`Error deleting label ${id}:`, err);
      error.value = 'Failed to delete label';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    labels,
    loading,
    error,
    fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel
  };
});
