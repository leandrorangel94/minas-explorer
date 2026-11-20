import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'minas-explorer:theme:v1';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Tema claro/escuro. A preferência (sistema, claro ou escuro) fica no LocalStorage; sem valor
 * válido (ou sem LocalStorage) vale "sistema". O atributo `data-theme` só é definido quando
 * o usuário escolhe claro/escuro; em "sistema" o CSS segue `prefers-color-scheme`.
 * Um script inline em index.html aplica o atributo antes do primeiro render (sem "flash").
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly win = this.doc.defaultView;
  private readonly media = this.safeMatchMedia();

  readonly preference = signal<ThemePreference>(this.readPreference());
  private readonly systemDark = signal(this.media?.matches ?? false);

  /** Tema realmente em uso (resolve "sistema" pela preferência do sistema operacional). */
  readonly effective = computed<EffectiveTheme>(() => {
    const p = this.preference();
    return p === 'system' ? (this.systemDark() ? 'dark' : 'light') : p;
  });

  constructor() {
    this.apply(this.preference());
    // Acompanha mudanças do sistema (relevante quando a preferência é "sistema")
    this.media?.addEventListener?.('change', (e) => this.systemDark.set(e.matches));
    // Mantém abas abertas em sincronia
    this.win?.addEventListener('storage', (e) => {
      if (e.key === THEME_STORAGE_KEY || e.key === null) {
        const next = this.readPreference();
        this.preference.set(next);
        this.apply(next);
      }
    });
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    this.apply(preference);
    try {
      this.win?.localStorage?.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      /* LocalStorage indisponível: a escolha vale só nesta sessão */
    }
  }

  private apply(preference: ThemePreference): void {
    const root = this.doc.documentElement;
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preference);
  }

  private readPreference(): ThemePreference {
    try {
      const v = this.win?.localStorage?.getItem(THEME_STORAGE_KEY);
      return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
    } catch {
      return 'system';
    }
  }

  private safeMatchMedia(): MediaQueryList | null {
    try {
      return this.win?.matchMedia?.(DARK_QUERY) ?? null;
    } catch {
      return null;
    }
  }
}
