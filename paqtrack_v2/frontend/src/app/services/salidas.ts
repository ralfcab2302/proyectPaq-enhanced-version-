import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EstadisticasResponse, Salida } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Salidas {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(params?: {
    nro_salida?: number;
    codigo_barras?: string;
    desde?: string;
    hasta?: string;
    codigo_empresa?: number;
    pagina?: number;
    limite?: number;
  }) {
    return this.http.get<{ salidas: Salida[]; total: number; paginas: number; pagina: number }>(
      `${this.apiUrl}/salidas`,
      { params: params as any },
    );
  }
  getById(id: number) {
    return this.http.get<Salida>(`${this.apiUrl}/salidas/${id}`);
  }
  buscarPorCodigoBarras(codigo_barras: string) {
    return this.http.get<{ salidas: Salida[] }>(`${this.apiUrl}/salidas/buscar/${codigo_barras}`);
  }
  estadisticas(params?: { desde?: string; hasta?: string }) {
    return this.http.get<EstadisticasResponse>(`${this.apiUrl}/salidas/estadisticas`, {
      params: params as any,
    });
  }
}
