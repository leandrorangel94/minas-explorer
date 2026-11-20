import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { Attraction, Category, City } from '../models/catalog.models';

/** Formato de `public/data/catalog.json` (gerado por `npm run catalog`). */
export interface Catalog {
  readonly cities: readonly City[];
  readonly attractions: readonly Attraction[];
}

/** Lê o catálogo estático. URLs relativas ao `<base href>` (GitHub Pages em subdiretório). */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  readonly catalog$: Observable<Catalog> = this.http
    .get<Catalog>('data/catalog.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly categories$: Observable<readonly Category[]> = this.http
    .get<Category[]>('data/categories.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly cities$ = this.catalog$.pipe(map((c) => c.cities));
  readonly attractions$ = this.catalog$.pipe(map((c) => c.attractions));
}
