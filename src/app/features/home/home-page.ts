import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { catchError, map, of } from 'rxjs';
import { GeoDataService } from '../../core/services/geo-data.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ExplorerStore } from '../explore/explorer.store';
import { FiltersPanel } from '../explore/filters-panel/filters-panel';
import { ResultsList } from '../explore/results-list/results-list';
import { MapPoint, MinasMap } from '../map/minas-map';
import { ExplorerSkeleton } from '../explore/explorer-skeleton';
import { expandCollapse, fadeIn } from '../../shared/animations';
import { Icon } from '../../shared/components/icon/icon';

type View = 'map' | 'list';

@Component({
  selector: 'me-home-page',
  imports: [
    MatButtonModule, MatButtonToggleModule, EmptyState, MinasMap, FiltersPanel, ResultsList, Icon,
    ExplorerSkeleton,
  ],
  animations: [expandCollapse, fadeIn],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly store = inject(ExplorerStore);
  private readonly location = inject(Location);

  /** Painel lateral (≥1024px): lista em formato compacto. */
  protected readonly isDesktop = toSignal(
    inject(BreakpointObserver).observe('(min-width: 1024px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected readonly view = signal<View>('map');
  protected readonly filtersOpen = signal(false);

  /** Se o contorno falhar ao carregar, o mapa segue funcionando sem ele. */
  protected readonly boundary = toSignal(
    inject(GeoDataService).boundary$.pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  /** Mesmos itens da lista, no formato do mapa. */
  protected readonly points = computed<readonly MapPoint[]>(() =>
    this.store.results().map(({ attraction, city, category }) => ({
      id: attraction.id,
      name: attraction.name,
      latitude: attraction.coordinates.latitude,
      longitude: attraction.coordinates.longitude,
      subtitle: city.name,
      icon: category?.icon,
      color: category?.color,
      categoryName: category?.name,
      href: this.location.prepareExternalUrl(`/cidades/${city.slug}/${attraction.slug}`),
      imageUrl: attraction.images[0]?.thumbUrl ?? attraction.images[0]?.url,
      imageAlt: attraction.images[0]?.alt,
    })),
  );

  /** Números do catálogo para o hero (derivados dos dados, nunca fixos no código). */
  protected readonly stats = computed(() => [
    { value: this.store.attractions().length, label: 'destinos' },
    { value: this.store.cities().length, label: 'cidades' },
    { value: new Set(this.store.cities().map((c) => c.regionId)).size, label: 'regiões' },
  ]);

  protected readonly countLabel = computed(() => {
    const n = this.store.results().length;
    return n === 1 ? '1 destino' : `${n} destinos`;
  });
}
