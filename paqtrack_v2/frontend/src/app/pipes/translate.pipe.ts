import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // re-evaluate on every change detection cycle for reactive updates
})
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string): string {
    return this.i18n.translate(key);
  }
}