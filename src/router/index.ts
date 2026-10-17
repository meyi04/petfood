// src/router/index.ts
import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types';
import TabsPage from '@/views/TabsPage.vue';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: UserRole[];
  }
}

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/tabs',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/home' },
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue'),
        meta: { roles: ['BUYER'] },
      },
      {
        path: 'stores',
        component: () => import('@/views/DiscoverStoresPage.vue'),
        meta: { roles: ['BUYER'] },
      },
      {
        path: 'orders',
        component: () => import('@/views/BuyerOrdersPage.vue'),
        meta: { roles: ['BUYER'] },
      },
      {
        path: 'account',
        component: () => import('@/views/BuyerAccountPage.vue'),
        meta: { roles: ['BUYER'] },
      },
      {
        path: 'owner',
        component: () => import('@/views/OwnerDashboard.vue'),
        meta: { roles: ['OWNER'] },
      },
      {
        path: 'manage-store',
        component: () => import('@/views/ManageStorePage.vue'),
        meta: { roles: ['OWNER'] },
      },
      {
        path: 'products',
        component: () => import('@/views/ManageProductsPage.vue'),
        meta: { roles: ['OWNER'] },
      },
      {
        path: 'reports',
        component: () => import('@/views/OwnerReportsPage.vue'),
        meta: { roles: ['OWNER'] },
      },
      {
        path: 'products/new',
        component: () => import('@/views/AddProductPage.vue'),
        meta: { roles: ['OWNER'] },
      },
      {
        path: 'products/:productId/edit',
        component: () => import('@/views/AddProductPage.vue'),
        meta: { roles: ['OWNER'] },
      },
    ],
  },
  {
    path: '/stores/:storeId',
    component: () => import('@/views/StoreDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/products/:productId',
    component: () => import('@/views/ProductDetailPage.vue'),
    meta: { requiresAuth: true, roles: ['BUYER'] },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.initialize();

  if (to.meta.guestOnly && authStore.profile) {
    return authStore.profile.role === 'OWNER' ? '/tabs/owner' : '/tabs/home';
  }

  if (to.meta.requiresAuth && !authStore.profile) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  const permittedRoles = to.meta.roles;
  if (permittedRoles?.length && authStore.profile && !permittedRoles.includes(authStore.profile.role)) {
    return authStore.profile.role === 'OWNER' ? '/tabs/owner' : '/tabs/home';
  }

  return true;
});

export default router;
