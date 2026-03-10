import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(correo: string, contraseña: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { correo, contraseña });
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
  guardarSesion(data: AuthResponse) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getUsuario() {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }
}
