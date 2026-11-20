import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Attraction, Category, City } from '../../core/models/catalog.models';
import { Region } from '../../core/models/geo.models';
import { CatalogService } from '../../core/services/catalog.service';
import { GeoDataService } from '../../core/services/geo-data.service';
import { filterAttractions, hasActiveFilters } from '../../core/utils/search.utils';

/** Atração já combinada com cidade e categoria, pronta para lista e mapa. */
export interface ExplorerItem {
  readonly attraction: Attraction;
  readonly city: City;
  readonly category: Category | undefined;
}

export type ExplorerStatus = 'loading' | 'ready' | 'error';

/**
 * Estado compartilhado da exploração: busca, filtros e seleção.
 * Lista e mapa leem o MESMO `results`, então sempre mostram os mesmos itens.
 */
@Injectable({ providedIn: 'root' })
export class ExplorerStore {
  private readonly catalog = toSignal(inject(CatalogService).catalog$.pipe(catchError(() => of(null))));
  private readonly categoryList = toSignal(inject(CatalogService).categories$.pipe(catchError(() => of(null))));
  private readonly regionList = toSignal(inject(GeoDataService).regions$.pipe(catchError(() => of(null))));

  private readonly itineraryList = toSignal(inject(CatalogService).itineraries$.pipe(catchError(() => of(null))));

  readonly query = signal('');
  readonly categoryIds = signal<readonly string[]>([]);
  readonly regionId = signal<string | null>(null);
  readonly selectedId = signal<string | null>(null);

  /** `undefined` = carregando; `null` = erro. */
  readonly status = computed<ExplorerStatus>(() => {
    const [c, k, r] = [this.catalog(), this.categoryList(), this.regionList()];
    if (c === null || k === null || r === null) return 'error';
    return c === undefined || k === undefined || r === undefined ? 'loading' : 'ready';
  });

  private readonly cityById = computed(() => new Map((this.catalog()?.cities ?? []).map((c) => [c.id, c])));
  readonly categoryById = computed(() => new Map((this.categoryList() ?? []).map((c) => [c.id, c])));

  readonly itineraries = computed(() => this.itineraryList() ?? []);
  /** Roteiros carregam separado: falha neles não derruba o mapa. */
  readonly itinerariesStatus = computed<ExplorerStatus>(() => {
    const l = this.itineraryList();
    return l === null ? 'error' : l === undefined ? 'loading' : 'ready';
  });
  readonly attractionById = computed(() => new Map((this.catalog()?.attractions ?? []).map((a) => [a.id, a])));
  readonly cityByIdMap = computed(() => this.cityById());
  readonly cities = computed(() => this.catalog()?.cities ?? []);
  readonly attractions = computed(() => this.catalog()?.attractions ?? []);
  private readonly regionNameById = computed(() => new Map((this.regionList() ?? []).map((r) => [r.id, r.name])));

  regionName(id: string): string | undefined {
    return this.regionNameById().get(id);
  }

  /** Categorias que têm ao menos uma atração (legenda e filtro mostram só o que existe). */
  readonly categories = computed(() => {
    const used = new Set((this.catalog()?.attractions ?? []).map((a) => a.categoryId));
    return (this.categoryList() ?? []).filter((c) => used.has(c.id));
  });

  /** Regiões que têm ao menos uma cidade no catálogo. */
  readonly regions = computed<readonly Region[]>(() => {
    const used = new Set((this.catalog()?.cities ?? []).map((c) => c.regionId));
    return (this.regionList() ?? []).filter((r) => used.has(r.id));
  });

  readonly filters = computed(() => ({
    query: this.query(),
    categoryIds: this.categoryIds(),
    regionId: this.regionId(),
  }));
  readonly filtersActive = computed(() => hasActiveFilters(this.filters()));
  /** Quantidade de filtros em uso (busca, cada categoria e região), para o rótulo do botão. */
  readonly activeFilterCount = computed(
    () => (this.query().trim() ? 1 : 0) + this.categoryIds().length + (this.regionId() ? 1 : 0),
  );

  readonly results = computed<readonly ExplorerItem[]>(() => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const cityById = this.cityById();
    return filterAttractions(catalog.attractions, cityById, this.filters()).map((attraction) => ({
      attraction,
      city: cityById.get(attraction.cityId)!,
      category: this.categoryById().get(attraction.categoryId),
    }));
  });

  readonly selected = computed(() => this.results().find((i) => i.attraction.id === this.selectedId()) ?? null);

  setQuery(query: string): void {
    this.query.set(query);
    this.dropSelectionIfHidden();
  }

  toggleCategory(id: string): void {
    this.categoryIds.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    this.dropSelectionIfHidden();
  }

  setRegion(id: string | null): void {
    this.regionId.set(id);
    this.dropSelectionIfHidden();
  }

  clearFilters(): void {
    this.query.set('');
    this.categoryIds.set([]);
    this.regionId.set(null);
  }

  select(id: string | null): void {
    this.selectedId.set(id);
  }

  private dropSelectionIfHidden(): void {
    const id = this.selectedId();
    if (id && !this.results().some((i) => i.attraction.id === id)) this.selectedId.set(null);
  }
}
