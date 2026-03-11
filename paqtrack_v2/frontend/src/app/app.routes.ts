  import { Routes } from '@angular/router';
  import { authGuard } from './guards/auth-guard';

  export const routes: Routes = [
    {
      path: '',
      redirectTo: 'login',
      pathMatch: 'full',
    },
    {
      path: 'login',
      loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    },
    {
      path: 'dashboard',
      canActivate: [authGuard],
      loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    },
    {
      path: 'busqueda',
      canActivate: [authGuard],
      loadComponent: () => import('./pages/busqueda/busqueda').then((m) => m.Busqueda),
    },
    {
      path: '**',   
      redirectTo: 'login',
    },
  ];
