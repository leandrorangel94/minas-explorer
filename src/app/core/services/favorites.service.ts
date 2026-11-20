import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type FavoriteKind = 'city' | 'attraction';

export interface FavoriteRef {
  readonly kind: FavoriteKind;
  readonly id: string;
}

export const FAVORITES_STORAGE_KEY = 'minas-explorer:favorites:v1';
const MAX_FAVORITES = 500;

/** Chave estável de um favorito (ex.: "attraction:3146107-museu-da-inconfidencia"). */
export const favoriteKey = (kind: FavoriteKind, id: string) => `${kind}:${id}`;

/**
 * Favoritos guardados APENAS no LocalStorage deste navegador (sem conta, sem sincronização).
 * Tolera LocalStorage indisponível (modo privado, bloqueio) e dados corrompidos:
 * nesses casos o app continua funcionando e `persistent` indica que nada será salvo.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly win = inject(DOCUMENT).defaultView;
  private readonly storage = this.getStorage();

  private readonly list = signal<readonly FavoriteRef[]>(this.read());

  readonly items = this.list.asReadonly();
  readonly count = computed(() => this.list().length);
  /** Falso quando o navegador não permite salvar (favoritos só valem enquanto a página estiver aberta). */
  readonly persistent = signal(this.storage !== null);

  private readonly keys = computed(() => new Set(this.list().map((f) => favoriteKey(f.kind, f.id))));

  constructor() {
    // Mantém abas abertas em sincronia (o evento só dispara em OUTRAS abas).
    this.win?.addEventListener('storage', (e) => {
      if (e.key === FAVORITES_STORAGE_KEY || e.key === null) this.list.set(this.read());
    });
  }

  isFavorite(kind: FavoriteKind, id: string): boolean {
    return this.keys().has(favoriteKey(kind, id));
  }

  toggle(kind: FavoriteKind, id: string): void {
    if (this.isFavorite(kind, id)) this.remove(kind, id);
    else this.update([...this.list(), { kind, id }].slice(-MAX_FAVORITES));
  }

  remove(kind: FavoriteKind, id: string): void {
    this.update(this.list().filter((f) => !(f.kind === kind && f.id === id)));
  }

  clear(): void {
    this.update([]);
  }

  private update(next: readonly FavoriteRef[]): void {
    this.list.set(next);
    if (!this.storage) return;
    try {
      this.storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 1, items: next }));
      this.persistent.set(true);
    } catch {
      this.persistent.set(false); // cota cheia ou bloqueado
    }
  }

  private read(): readonly FavoriteRef[] {
    if (!this.storage) return this.list?.() ?? [];
    try {
      return parseFavorites(this.storage.getItem(FAVORITES_STORAGE_KEY));
    } catch {
      return [];
    }
  }

  private getStorage(): Storage | null {
    try {
      const s = this.win?.localStorage;
      if (!s) return null;
      const probe = `${FAVORITES_STORAGE_KEY}:probe`;
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch {
      return null;
    }
  }
}

/** Valida o JSON salvo; qualquer coisa fora do formato esperado é descartada (nunca lança). */
export function parseFavorites(raw: string | null): FavoriteRef[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    const items = (data as { version?: unknown; items?: unknown } | null)?.items;
    if (!Array.isArray(items)) return [];
    const seen = new Set<string>();
    const result: FavoriteRef[] = [];
    for (const it of items) {
      const kind = (it as FavoriteRef | null)?.kind;
      const id = (it as FavoriteRef | null)?.id;
      if ((kind !== 'city' && kind !== 'attraction') || typeof id !== 'string' || !id.trim() || id.length > 200) continue;
      const key = favoriteKey(kind, id);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ kind, id });
      if (result.length >= MAX_FAVORITES) break;
    }
    return result;
  } catch {
    return [];
  }
}
