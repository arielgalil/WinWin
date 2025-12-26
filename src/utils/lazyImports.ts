import { lazy } from 'react';

// Simple lazy loading for admin components
export const LazyAdminPanel = lazy(() => import('../components/AdminPanel').then(module => ({ default: module.AdminPanel })));
export const LazyShareableLeaderboard = lazy(() => import('../components/dashboard/ShareableLeaderboard').then(module => ({ default: module.ShareableLeaderboard })));