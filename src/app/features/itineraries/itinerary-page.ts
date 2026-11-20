import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageMetaService } from '../../core/services/page-meta.service';
import { googleMapsPlaceUrl } from '../../core/utils/external-links';
import { formatIsoDate } from '../../core/utils/format';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { DestinationCard } from '../../shared/components/destination-card/destination-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { FavoriteButton } from '../../shared/components/favorite-button/favorite-button';
import { ExplorerStore } from '../explore/explorer.store';
import { EditorialNote } from './editorial-note';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'me-itinerary-page',
  imports: [
    RouterLink, MatButtonModule, Breadcrumbs, DestinationCard, EmptyState, FavoriteButton, EditorialNote, Icon,
  ],
  templateUrl: './itinerary-page.html',
  styleUrl: './itinerary-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItineraryPage {
  /** Vem da rota `/roteiros/:slug` (component input binding). */
  readonly slug = input.required<string>();

  protected readonly store = inject(ExplorerStore);
  private readonly router = inject(Router);
  private readonly meta = inject(PageMetaService);

  protected readonly status = computed(() => {
    const [a, b] = [this.store.status(), this.store.itinerariesStatus()];
    return a === 'error' || b === 'error' ? 'error' : a === 'loading' || b === 'loading' ? 'loading' : 'ready';
  });
  protected readonly itinerary = computed(() => this.store.itineraries().find((i) => i.slug === this.slug()));
  protected readonly regionName = computed(() => {
    const it = this.itinerary();
    return it ? this.store.regionName(it.regionId) : undefined;
  });

  /** Paradas já resolvidas (atração + cidade + categoria); ids que não existem mais são ignorados. */
  protected readonly days = computed(() => {
    const it = this.itinerary();
    if (!it) return [];
    const cityById = this.store.cityByIdMap();
    return it.days.map((day) => ({
      title: day.title,
      stops: day.stopIds.flatMap((id) => {
        const attraction = this.store.attractionById().get(id);
        const city = attraction ? cityById.get(attraction.cityId) : undefined;
        return attraction && city
          ? [{ attraction, city, category: this.store.categoryById().get(attraction.categoryId), mapsUrl: googleMapsPlaceUrl(attraction.coordinates) }]
          : [];
      }),
    }));
  });
  protected readonly reviewedOn = computed(() => formatIsoDate(this.itinerary()?.lastReviewedAt ?? ''));

  constructor() {
    effect(() => {
      const it = this.itinerary();
      if (it) this.meta.set(it.title, it.summary);
      else if (this.status() === 'ready') this.meta.set('Roteiro não encontrado');
    });
  }

  /** Abre o mapa com o destino selecionado. */
  protected showOnMap(id: string): void {
    this.store.clearFilters();
    this.store.select(id);
    void this.router.navigateByUrl('/');
  }
}
