import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },{path:'login'},
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'busqueda',
    loadComponent: () => import('./pages/busqueda/busqueda').then((m) => m.Busqueda),
  },
];
