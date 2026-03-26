import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string): string {
    // Al leer currentLang() aquí, Angular registra este pipe
    // como dependiente del signal. Cuando cambie el idioma,
    // Angular re-ejecuta transform() automáticamente.
    this.i18n.currentLang();

    return this.i18n.translate(key);
  }
}