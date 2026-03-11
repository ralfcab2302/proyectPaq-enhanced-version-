import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Nabvar } from '../nabvar/nabvar';
import { Salidas } from '../../services/salidas';
import { Salida } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  imports: [Nabvar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
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
  private salidas = inject(Salidas);
  protected totalSalidas = signal(0);
  protected salidasPaq: Salida[] = [];
  cargando = signal(true);
  protected aregloSalida = signal<Salida[]>([]);
  protected totalHoy = signal(0);
  protected totalMes = signal(0);
  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    const hoy = new Date();

    const inicioHoy = hoy.toISOString().slice(0, 10) + ' 00:00:00';
    const finHoy = hoy.toISOString().slice(0, 10) + ' 23:59:59';

    const inicioMes =
      new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10) + ' 00:00:00';

    // Paquetes de hoy
    this.salidas.getAll({ desde: inicioHoy, hasta: finHoy }).subscribe({
      next: (data) => this.totalHoy.set(data.total),
    });

    // Paquetes del mes
    this.salidas.getAll({ desde: inicioMes }).subscribe({
      next: (data) => this.totalMes.set(data.total),
    });

    // Tabla completa
    this.salidas.getAll().subscribe({
      next: (data) => {
        this.totalSalidas.set(data.total);
        this.aregloSalida.set(data.salidas);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.cargando.set(false);
      },
    });
  }
}
