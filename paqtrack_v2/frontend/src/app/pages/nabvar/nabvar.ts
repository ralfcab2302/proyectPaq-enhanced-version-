import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-nabvar',
  imports: [],
  templateUrl: './nabvar.html',
  styleUrl: './nabvar.css',
})
export class Nabvar implements OnInit {
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
  protected rutaActual = signal('');
  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.rutaActual.set(event.url);
      }
    });
    // para la carga inicial
    this.rutaActual.set(this.router.url);
    console.log(`La ruta actual es: ${this.rutaActual()}`);
  }
  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  redirigirBuscar() {
    this.router.navigate(['/busqueda']);
  }
  redirigirDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
