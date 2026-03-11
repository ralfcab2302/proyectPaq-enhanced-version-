import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-nabvar',
  imports: [],
  templateUrl: './nabvar.html',
  styleUrl: './nabvar.css',
})
export class Nabvar {
    protected rolUser = localStorage.getItem('usuario')
    ? JSON.parse(localStorage.getItem('usuario')!).rol
    : null;
  protected nombreUser = localStorage.getItem('usuario')
    ? JSON.parse(localStorage.getItem('usuario')!).nombre
    : null;
  protected correoUser = localStorage.getItem('usuario')
    ? JSON.parse(localStorage.getItem('usuario')!).correo
    : null;
  private authService = inject(AuthService);
  private router = inject(Router);

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);

  }
}
