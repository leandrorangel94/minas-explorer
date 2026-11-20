import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

export interface EnrichmentSource {
  readonly name: string;
  readonly url: string;
  readonly license: string;
  readonly retrievedAt: string;
}

export interface LodgingItem {
  readonly name: string;
  readonly type: string;
  readonly distanceMeters: number;
  readonly website?: string;
  readonly phone?: string;
  readonly osmUrl: string;
}

export interface Enrichment {
  readonly about?: { readonly description: string; readonly curiosities: readonly string[]; readonly source: EnrichmentSource };
  readonly practical?: {
    readonly openingHours?: string;
    readonly fee?: string;
    readonly wheelchair?: string;
    readonly phone?: string;
    readonly website?: string;
    readonly source: EnrichmentSource;
  };
  readonly lodging?: { readonly items: readonly LodgingItem[]; readonly source: EnrichmentSource };
}

interface EnrichmentFile {
  readonly items: Readonly<Record<string, Enrichment>>;
}

/**
 * Dados complementares gerados offline por `npm run enrich` (Wikipedia e OpenStreetMap).
 * O arquivo é opcional: se faltar, o app simplesmente não mostra essas seções.
 */
@Injectable({ providedIn: 'root' })
export class EnrichmentService {
  private readonly http = inject(HttpClient);

  private readonly file$: Observable<EnrichmentFile> = this.http.get<EnrichmentFile>('data/enrichment.json').pipe(
    catchError(() => of<EnrichmentFile>({ items: {} })),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  forId(id: string): Observable<Enrichment | undefined> {
    return this.file$.pipe(map((f) => f.items[id]));
  }
}

const DAYS: Readonly<Record<string, string>> = { Mo: 'Seg', Tu: 'Ter', We: 'Qua', Th: 'Qui', Fr: 'Sex', Sa: 'Sáb', Su: 'Dom', PH: 'feriados' };

/** Traduz o formato `opening_hours` do OpenStreetMap só nos termos simples; o resto fica como está. */
export function translateOpeningHours(value: string): string {
  return value
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAYS[d])
    .replace(/\boff\b/g, 'fechado')
    .replace(/\s*;\s*/g, '; ');
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}
