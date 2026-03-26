import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type Language = 'es' | 'en';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private translations: Record<string, any> = {};
  currentLang = signal<Language>((localStorage.getItem('lang') as Language) ?? 'es');

  constructor(private http: HttpClient) {
    this.loadTranslations(this.currentLang());
  }

  loadTranslations(lang: Language): void {
    this.http.get<Record<string, any>>(`/i18n/${lang}.json`).subscribe({
      next: (data) => {
        this.translations = data;
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
    const keys = key.split('.');
    let value: any = this.translations;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return typeof value === 'string' ? value : key;
  }
}
