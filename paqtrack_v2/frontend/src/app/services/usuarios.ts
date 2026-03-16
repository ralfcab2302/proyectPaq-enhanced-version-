import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Usuarios {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll() { return this.http.get<{ usuarios: Usuario[] }>(`${this.apiUrl}/usuarios`); }
  getById(id: number) { return this.http.get<{ usuario: Usuario }>(`${this.apiUrl}/usuarios/${id}`); }
  create(data: { correo: string; contrasena: string; rol: string; codigo_empresa?: number | null }) { return this.http.post<{ mensaje: string; usuario: Usuario }>(`${this.apiUrl}/usuarios`, data); }
  update(id: number, data: { correo?: string; contrasena?: string; rol?: string }) { return this.http.put<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}`, data); }
  remove(id: number) { return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/usuarios/${id}`); }
}
