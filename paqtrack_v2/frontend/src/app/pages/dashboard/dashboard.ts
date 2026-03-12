import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Nabvar } from '../nabvar/nabvar';
import { Salidas } from '../../services/salidas';
import { Salida, EstadisticasResponse } from '../../models/models'; // ← añadir EstadisticasResponse
import { EmpresaService } from '../../services/empresa';

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
  private empresas = inject(EmpresaService);
  protected totalEmpresas = signal(0);

  protected totalHoy = signal(0);
  protected totalMes = signal(0);
  protected hayDayos = signal(false);
  // ── NUEVO ──────────────────────────────────────
  private chartDonut: any = null;
  private chartLine: any = null;
  private chartColumn: any = null;
  // ───────────────────────────────────────────────

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

    this.salidas.getAll({ desde: inicioHoy, hasta: finHoy }).subscribe({
      next: (data) => this.totalHoy.set(data.total),
    });

    this.empresas.getAll().subscribe({
      next: (data) => this.totalEmpresas.set(data.empresas.length),
    });

    this.salidas.getAll({ desde: inicioMes }).subscribe({
      next: (data) => this.totalMes.set(data.total),
    });

    this.salidas.getAll().subscribe({
      next: (data) => {
        this.totalSalidas.set(data.total);
        this.aregloSalida.set(data.salidas);
        this.cargando.set(false);

        // ── NUEVO: cargar gráficos solo si superadmin ──
        if (this.rolUser === 'superadmin') {
          setTimeout(() => this.cargarGraficos(inicioHoy, finHoy), 100);
        }
        // ───────────────────────────────────────────────
      },
      error: (err) => {
        console.error(err);
        this.cargando.set(false);
      },
    });
  }

  // ── NUEVO: métodos de gráficos ─────────────────
  private cargarGraficos(inicioHoy: string, finHoy: string) {
    this.salidas.estadisticas().subscribe({
      next: (data) => {
        this.renderDonut(data);
        this.renderLinea(data);
      },
    });
    this.salidas.estadisticas({ desde: inicioHoy, hasta: finHoy }).subscribe({
      next: (data) => {
        this.renderColumnas(data);
        console.log('estadisticas hoy:', data); // ← ¿llegan datos?
        console.log('porEmpresa hoy:', data.porEmpresa);
        if(data.porEmpresa?.length) {
          this.hayDayos.set(true);
        } else {
          this.hayDayos.set(false);
        }
      },
    });
  }

  private apexConfig(type: string, height: number, extra: object) {
    return {
      chart: {
        type,
        height,
        background: 'transparent',
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      theme: { mode: 'dark' },
      tooltip: { theme: 'dark' },
      grid: { borderColor: '#1e293b', strokeDashArray: 4 },
      ...extra,
    };
  }

  private renderDonut(data: EstadisticasResponse) {
    const el = document.getElementById('chart-donut');
    if (!el || !data.porEmpresa?.length) return;
    if (this.chartDonut) this.chartDonut.destroy();

    this.chartDonut = new (window as any).ApexCharts(
      el,
      this.apexConfig('pie', 320, {
        series: data.porEmpresa.map((e) => Number(e.total)),
        labels: data.porEmpresa.map((e) => e.nombre_empresa || 'Sin nombre'),
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'],
        legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
        dataLabels: { enabled: true, style: { fontSize: '12px' } },
      }),
    );
    this.chartDonut.render();
  }

  private renderLinea(data: EstadisticasResponse) {
    const el = document.getElementById('chart-line');
    if (!el || !data.porDia?.length) return;
    if (this.chartLine) this.chartLine.destroy();

    this.chartLine = new (window as any).ApexCharts(
      el,
      this.apexConfig('area', 280, {
        series: [{ name: 'Salidas', data: data.porDia.map((d) => Number(d.total)) }],
        colors: ['#3b82f6'],
        xaxis: {
          categories: data.porDia.map((d) =>
            new Date(d.dia).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          ),
          labels: { style: { colors: '#64748b', fontSize: '11px' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { labels: { style: { colors: '#64748b' } } },
        stroke: { curve: 'smooth', width: 3 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
        dataLabels: { enabled: false },
      }),
    );
    this.chartLine.render();
  }

  private renderColumnas(data: EstadisticasResponse) {
    const el = document.getElementById('chart-column');
    if (!el || !data.porEmpresa?.length) return;
    if (this.chartColumn) this.chartColumn.destroy();

    this.chartColumn = new (window as any).ApexCharts(
      el,
      this.apexConfig('bar', 280, {
        series: [{ name: 'Salidas hoy', data: data.porEmpresa.map((e) => Number(e.total)) }],
        colors: ['#8b5cf6'],
        xaxis: {
          categories: data.porEmpresa.map((e) => e.nombre_empresa || 'Sin nombre'),
          labels: { style: { colors: '#64748b', fontSize: '11px' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { labels: { style: { colors: '#64748b' } } },
        plotOptions: {
          bar: { borderRadius: 6, borderRadiusApplication: 'end', columnWidth: '55%' },
        },
        dataLabels: { enabled: false },
      }),
    );
    this.chartColumn.render();
  }
  // ───────────────────────────────────────────────
}
