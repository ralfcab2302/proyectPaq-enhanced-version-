import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type Language = 'es' | 'en';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  // Convertimos translations a signal para que Angular
  // detecte cuando se actualizan los textos tras la petición HTTP
  private translations = signal<Record<string, any>>({});

  currentLang = signal<Language>(
    (localStorage.getItem('lang') as Language) ?? 'es'
  );

  constructor(private http: HttpClient) {
    this.loadTranslations(this.currentLang());
  }

  loadTranslations(lang: Language): void {
    this.http.get<Record<string, any>>(`/i18n/${lang}.json`).subscribe({
      next: (data) => {
        this.translations.set(data); // 👈 ahora notifica a Angular
        this.currentLang.set(lang);
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
      },
      error: () => {
        console.error(`Could not load translations for: ${lang}`);
      },
    });
  }

  setLanguage(lang: Language): void {
    if (lang !== this.currentLang()) {
      this.loadTranslations(lang);
    }
  }

  translate(key: string): string {
    // Al llamar a this.translations() leemos el signal,
    // creando la dependencia reactiva necesaria
    const keys = key.split('.');
    let value: any = this.translations(); // 👈 llamada al signal
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return typeof value === 'string' ? value : key;
  }
}