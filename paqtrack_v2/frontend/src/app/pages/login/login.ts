import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
  imports: [CommonModule],
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  correo = '';
  contrasena = '';
  error = signal('');
  cargando = signal(false);

  comprobarUser() {
    this.cargando.set(true);
    this.error.set('');

    this.auth.login(this.correo, this.contrasena).subscribe({
      next: (data) => {
        console.log('Respuesta login:', data);

        this.cargando.set(false);
        this.auth.guardarSesion(data);
        if (data.usuario.rol === 'usuario') {
          this.router.navigate(['/busqueda']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.error.set('Credenciales incorrectas');
        this.cargando.set(false);
      },
    });
  }
}
