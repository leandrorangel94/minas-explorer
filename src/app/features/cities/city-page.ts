import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LucideExternalLink, LucideMap, LucideSearchX, LucideTriangleAlert } from '@lucide/angular';
import { PageMetaService } from '../../core/services/page-meta.service';
import { attractionsOfCity, findCityBySlug } from '../../core/utils/catalog.utils';
import { googleMapsPlaceUrl } from '../../core/utils/external-links';
import { formatIsoDate } from '../../core/utils/format';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { DestinationCard } from '../../shared/components/destination-card/destination-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { FavoriteButton } from '../../shared/components/favorite-button/favorite-button';
import { ImageGallery } from '../../shared/components/image-gallery/image-gallery';
import { ExplorerStore } from '../explore/explorer.store';

@Component({
  selector: 'me-city-page',
  imports: [
    RouterLink, MatButtonModule, LucideExternalLink, LucideMap, LucideSearchX, LucideTriangleAlert,
    Breadcrumbs, DestinationCard, EmptyState, FavoriteButton, ImageGallery,
  ],
  templateUrl: './city-page.html',
  styleUrl: './city-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CityPage {
  /** Vem da rota `/cidades/:citySlug` (component input binding). */
  readonly citySlug = input.required<string>();

  protected readonly store = inject(ExplorerStore);
  private readonly router = inject(Router);
  private readonly meta = inject(PageMetaService);

  protected readonly city = computed(() => findCityBySlug(this.store.cities(), this.citySlug()));
  protected readonly attractions = computed(() => {
    const city = this.city();
    return city ? attractionsOfCity(this.store.attractions(), city.id) : [];
  });
  protected readonly regionName = computed(() => {
    const city = this.city();
    return city ? this.store.regionName(city.regionId) : undefined;
  });
  protected readonly images = computed(() => {
    const cover = this.city()?.coverImage;
    return cover ? [cover] : [];
  });
  protected readonly mapsUrl = computed(() => {
    const city = this.city();
    return city ? googleMapsPlaceUrl(city.coordinates) : '';
  });
  protected readonly verifiedOn = computed(() => formatIsoDate(this.city()?.lastVerifiedAt ?? ''));

  constructor() {
    effect(() => {
      const city = this.city();
      if (city) this.meta.set(city.name, city.description);
      else if (this.store.status() === 'ready') this.meta.set('Cidade não encontrada');
    });
  }

  protected categoryOf(id: string) {
    return this.store.categoryById().get(id);
  }

  /** Volta ao mapa já filtrado pela cidade. */
  protected showOnMap(): void {
    const city = this.city();
    if (!city) return;
    this.store.clearFilters();
    this.store.setQuery(city.name);
    void this.router.navigateByUrl('/');
  }
}
