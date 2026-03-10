import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Empresa as EmpresaI } from '../models/models';
@Injectable({
  providedIn: 'root',
})
export class Empresa {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll() {
    return this.http.get<EmpresaI>(`${this.apiUrl}/empresas`);
  }
  getById(idEmpresa: number) {
    return this.http.get<Empresa>(`${this.apiUrl}/empresas/${idEmpresa}`);
  }
  create(codigo: number, nombre: string, contacto: string) {
    return this.http.post(`${this.apiUrl}/empresas`, { codigo, nombre, contacto });
  }
  
  //   export interface Empresa {
  //   codigo: number;
  //   nombre: string;
  //   contacto: string;
  // }
}
