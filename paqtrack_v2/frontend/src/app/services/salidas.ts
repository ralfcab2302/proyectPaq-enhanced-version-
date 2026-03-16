import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { EstadisticasResponse, Salida } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class Salidas {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(params?: {
    nro_salida?: number;
    codigo_barras?: string;
    desde?: string;
    hasta?: string;
    pagina?: number;
    limite?: number;
  }) {
    return this.http.get<{ salidas: Salida[]; total: number }>(`${this.apiUrl}/salidas`, {
      params,
    });
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
