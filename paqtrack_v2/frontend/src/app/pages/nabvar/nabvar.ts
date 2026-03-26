import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { I18nService, Language } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-nabvar',
  imports: [TranslatePipe],
  templateUrl: './nabvar.html',
  styleUrl: './nabvar.css',
})
export class Nabvar implements OnInit {
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
  private i18n = inject(I18nService);
  protected rutaActual = signal('');
  protected currentLang = this.i18n.currentLang;

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.rutaActual.set(event.url);
      }
    });
    // para la carga inicial
    this.rutaActual.set(this.router.url);
  }

  setLang(lang: Language): void {
    this.i18n.setLanguage(lang);
    this.router.navigate([this.router.url]);
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  redirigirBuscar() {
    this.router.navigate(['/busqueda']);
  }
  redirigirDashboard() {
    this.router.navigate(['/dashboard']);
  }
}