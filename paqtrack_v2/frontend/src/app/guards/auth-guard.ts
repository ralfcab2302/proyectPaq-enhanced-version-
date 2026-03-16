import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const usuario = auth.getUsuario();
  const rol = usuario?.rol;
  const ruta = route.routeConfig?.path;

  if (rol === 'usuario' && ruta === 'dashboard') {
    router.navigate(['/busqueda']);
    return false;
  }

  return true;
};