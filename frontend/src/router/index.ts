import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/ProductsPage.vue'),
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetailPage.vue'),
    props: true,
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchPage.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterPage.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: () => import('../views/EditProfilePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfilePage.vue'),
    props: true,
  },
  {
    path: '/profile/:userId/comments/:commentId/reactions',
    name: 'CommentReactions',
    component: () => import('../views/CommentReactionsPage.vue'),
    props: true,
  },
  {
    path: '/account/settings',
    name: 'AccountSettings',
    component: () => import('../views/AccountSettingsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('../views/FriendsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/NotificationsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/my-posts',
    name: 'MyPosts',
    component: () => import('../views/MyPostsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  next();
});

export default router;
