import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Notification } from '../types';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const timeout = notification.timeout || 5000;
    
    const newNotification: Notification = {
      id,
      ...notification
    };
    
    notifications.value.push(newNotification);
    
    // Auto-remove after timeout
    setTimeout(() => {
      removeNotification(id);
    }, timeout);
    
    return id;
  };
  
  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id);
  };
  
  const clearAllNotifications = () => {
    notifications.value = [];
  };
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
});