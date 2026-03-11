import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Empresa } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll() {
    return this.http.get<{ empresas: Empresa[] }>(`${this.apiUrl}/empresas`);
  }

  getById(id: number) {
    return this.http.get<Empresa>(`${this.apiUrl}/empresas/${id}`);
  }
}