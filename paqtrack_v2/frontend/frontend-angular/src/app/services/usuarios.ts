import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class Usuarios {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll() {
    return this.http.get<{ usuarios: Usuario[] }>(`${this.apiUrl}/usuarios`);
  }

  getById(id: number) {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`);
  }
}
