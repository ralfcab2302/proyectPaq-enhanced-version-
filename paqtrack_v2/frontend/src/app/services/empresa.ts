import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Empresa } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll() { return this.http.get<{ empresas: Empresa[] }>(`${this.apiUrl}/empresas`); }
  getById(id: number) { return this.http.get<{ empresa: Empresa }>(`${this.apiUrl}/empresas/${id}`); }
  create(data: { nombre: string; contacto?: string }) { return this.http.post<{ mensaje: string; empresa: Empresa }>(`${this.apiUrl}/empresas`, data); }
  update(id: number, data: { nombre?: string; contacto?: string }) { return this.http.put<{ mensaje: string }>(`${this.apiUrl}/empresas/${id}`, data); }
  remove(id: number) { return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/empresas/${id}`); }
}
