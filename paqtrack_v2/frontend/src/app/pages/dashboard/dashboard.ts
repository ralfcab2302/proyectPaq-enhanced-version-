import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Nabvar } from '../nabvar/nabvar';
import { Salidas } from '../../services/salidas';
import { Salida, EstadisticasResponse } from '../../models/models';
import { EmpresaService } from '../../services/empresa';

@Component({
  selector: 'app-dashboard',
  imports: [Nabvar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
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
  private empresas = inject(EmpresaService);

  protected totalSalidas = signal(0);
  protected salidasPaq: Salida[] = [];
  protected aregloSalida = signal<Salida[]>([]);
  protected totalEmpresas = signal(0);
  protected totalHoy = signal(0);
  protected totalMes = signal(0);
  protected hayDayos = signal(false);
  cargando = signal(true);

  // Filtros tabla
  protected filtroDesde = signal('');
  protected filtroHasta = signal('');
  protected filtroNroSalida = signal('');
  protected filtroEmpresa = signal<number | null>(null);
  protected cargandoFiltro = signal(false);
  protected empresasSelect: { codigo: number; nombre: string }[] = [];
  // Instancias Chart.js
  private chartDonut: any = null;
  private chartLine: any = null;
  private chartColumn: any = null;

  private readonly COLORES = [
    '#3b82f6',
    '#8b5cf6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#6366f1',
    '#84cc16',
    '#a855f7',
  ];

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  protected onEmpresaChange(valor: string) {
    this.filtroEmpresa.set(+valor || null);
    this.buscarConFiltros();
  }

  ngOnInit(): void {
    this.cargarSelectEmpresas();
    const hoy = new Date();
    const inicioHoy = hoy.toISOString().slice(0, 10) + ' 00:00:00';
    const finHoy = hoy.toISOString().slice(0, 10) + ' 23:59:59';
    const inicioMes =
      new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10) + ' 00:00:00';

    this.salidas.getAll({ desde: inicioHoy, hasta: finHoy }).subscribe({
      next: (data) => this.totalHoy.set(data.total),
    });

    this.salidas.getAll({ desde: inicioMes }).subscribe({
      next: (data) => this.totalMes.set(data.total),
    });

    this.empresas.getAll().subscribe({
      next: (data) => this.totalEmpresas.set(data.empresas.length),
    });

    this.salidas.getAll().subscribe({
      next: (data) => {
        this.totalSalidas.set(data.total);
        this.aregloSalida.set(data.salidas);
        this.cargando.set(false);
        if (this.rolUser === 'superadmin') {
          setTimeout(() => this.cargarGraficos(inicioHoy, finHoy), 100);
        }
      },
      error: (err) => {
        console.error(err);
        this.cargando.set(false);
      },
    });
  }

  // ── Filtros tabla ────────────────────────────────────────────────

  protected buscarConFiltros() {
    this.cargandoFiltro.set(true);
    const contenedor = document.getElementById('graficos-container');
    if (contenedor) contenedor.style.display = 'none';

    const params: any = {};
    if (this.filtroDesde()) params.desde = this.filtroDesde() + ' 00:00:00';
    if (this.filtroHasta()) params.hasta = this.filtroHasta() + ' 23:59:59';
    if (this.filtroNroSalida()) params.nro_salida = Number(this.filtroNroSalida());
    if (this.filtroEmpresa()) params.codigo_empresa = this.filtroEmpresa();

    this.salidas.getAll(params).subscribe({
      next: (data) => {
        this.aregloSalida.set(data.salidas);
        this.cargandoFiltro.set(false);
      },
      error: () => this.cargandoFiltro.set(false),
    });
  }

  protected limpiarFiltros() {
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.filtroNroSalida.set('');
    this.filtroEmpresa.set(null);

    // Mostrar gráficos al limpiar
    const contenedor = document.getElementById('graficos-container');
    if (contenedor) contenedor.style.display = 'block';

    this.salidas.getAll().subscribe({
      next: (data) => {
        this.aregloSalida.set(data.salidas);
      },
    });
  }

  // ── Gráficos Chart.js ────────────────────────────────────────────

  private cargarGraficos(inicioHoy: string, finHoy: string) {
    this.salidas.estadisticas().subscribe({
      next: (data) => {
        this.renderDonut(data);
        this.renderLinea(data);
      },
    });
    this.salidas.estadisticas({ desde: inicioHoy, hasta: finHoy }).subscribe({
      next: (data) => {
        if (data.porEmpresa?.length) {
          this.hayDayos.set(true);
          setTimeout(() => this.renderColumnas(data), 50);
        } else {
          this.hayDayos.set(false);
        }
      },
    });
  }

  private renderChart(id: string, instance: any, config: object): any {
    const el = document.getElementById(id) as HTMLCanvasElement;
    if (!el) return instance;
    if (instance) instance.destroy();
    return new (window as any).Chart(el, config);
  }

  private renderDonut(data: EstadisticasResponse) {
    if (!data.porEmpresa?.length) return;
    this.chartDonut = this.renderChart('chart-donut', this.chartDonut, {
      type: 'doughnut',
      data: {
        labels: data.porEmpresa.map((e) => e.nombre_empresa || 'Sin nombre'),
        datasets: [
          {
            data: data.porEmpresa.map((e) => Number(e.total)),
            backgroundColor: this.COLORES,
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 16, font: { size: 12 } },
          },
          tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}` } },
        },
      },
    });
  }

  private renderLinea(data: EstadisticasResponse) {
    if (!data.porDia?.length) return;
    this.chartLine = this.renderChart('chart-line', this.chartLine, {
      type: 'line',
      data: {
        labels: data.porDia.map((d) =>
          new Date(d.dia).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        ),
        datasets: [
          {
            label: 'Salidas',
            data: data.porDia.map((d) => Number(d.total)),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#3b82f6',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' } },
        },
      },
    });
  }

  private renderColumnas(data: EstadisticasResponse) {
    if (!data.porEmpresa?.length) return;
    this.chartColumn = this.renderChart('chart-column', this.chartColumn, {
      type: 'bar',
      data: {
        labels: data.porEmpresa.map((e) => e.nombre_empresa || 'Sin nombre'),
        datasets: [
          {
            label: 'Salidas hoy',
            data: data.porEmpresa.map((e) => Number(e.total)),
            backgroundColor: this.COLORES,
            borderRadius: 6,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#1e293b' } },
        },
      },
    });
  }

  cargarSelectEmpresas() {
    this.empresas.getAll().subscribe({
      next: (data) => {
        this.empresasSelect = data.empresas;
      },
    });
  }

  ngOnDestroy() {
    if (this.chartDonut) this.chartDonut.destroy();
    if (this.chartLine) this.chartLine.destroy();
    if (this.chartColumn) this.chartColumn.destroy();
  }
}
