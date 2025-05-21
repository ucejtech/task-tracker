import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../views/TasksView.vue')
  },
  {
    path: '/tasks/new',
    name: 'NewTask',
    component: () => import('../views/TaskFormView.vue')
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('../views/TaskDetailView.vue')
  },
  {
    path: '/tasks/:id/edit',
    name: 'EditTask',
    component: () => import('../views/TaskFormView.vue'),
    props: route => ({ 
      isEdit: true, 
      taskId: parseInt(route.params.id) 
    })
  },
  {
    path: '/labels',
    name: 'Labels',
    component: () => import('../views/LabelsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active-link'
})

export default router