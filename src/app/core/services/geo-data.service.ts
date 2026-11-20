import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { FeatureCollection } from 'geojson';
import { Observable, shareReplay } from 'rxjs';
import { Municipality, Region } from '../models/geo.models';

/**
 * Lê os dados geográficos estáticos (IBGE) de `public/data`.
 * URLs relativas ao `<base href>` para funcionar em subdiretório (GitHub Pages).
 */
@Injectable({ providedIn: 'root' })
export class GeoDataService {
  private readonly http = inject(HttpClient);

  readonly boundary$: Observable<FeatureCollection> = this.http
    .get<FeatureCollection>('data/geo/minas-gerais.geo.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  /** Divisas dos 853 municípios (IBGE, qualidade mínima); carregada sob demanda. */
  readonly municipalityMesh$: Observable<FeatureCollection> = this.http
    .get<FeatureCollection>('data/geo/municipios.geo.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly regions$: Observable<readonly Region[]> = this.http
    .get<Region[]>('data/regions.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly municipalities$: Observable<readonly Municipality[]> = this.http
    .get<Municipality[]>('data/municipalities.json')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));
}
