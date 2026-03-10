import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'busqueda',
    loadComponent: () => import('./pages/busqueda/busqueda').then((m) => m.Busqueda),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/error/error').then((m) => m.Error),
  },
];
