import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PageMetaService } from '../../core/services/page-meta.service';
import { findAttraction, findCityBySlug } from '../../core/utils/catalog.utils';
import { googleMapsDirectionsUrl, googleMapsPlaceUrl } from '../../core/utils/external-links';
import { formatIsoDate } from '../../core/utils/format';
import { Breadcrumbs, Crumb } from '../../shared/components/breadcrumbs/breadcrumbs';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { FavoriteButton } from '../../shared/components/favorite-button/favorite-button';
import { ImageGallery } from '../../shared/components/image-gallery/image-gallery';
import { PracticalInfoView } from '../../shared/components/practical-info/practical-info';
import { DetailSkeleton } from '../../shared/components/skeleton/page-skeletons';
import { WeatherSection } from '../../shared/components/weather/weather';
import { PlaceExtras } from '../../shared/components/place-extras/place-extras';
import { ExplorerStore } from '../explore/explorer.store';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'me-attraction-page',
  imports: [
    RouterLink, MatButtonModule, MatCardModule, Breadcrumbs, EmptyState, FavoriteButton, ImageGallery, PracticalInfoView, Icon, DetailSkeleton, WeatherSection, PlaceExtras,
  ],
  templateUrl: './attraction-page.html',
  styleUrl: './attraction-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttractionPage {
  /** Vêm da rota `/cidades/:citySlug/:attractionSlug` (component input binding). */
  readonly citySlug = input.required<string>();
  readonly attractionSlug = input.required<string>();

  protected readonly store = inject(ExplorerStore);
  private readonly router = inject(Router);
  private readonly meta = inject(PageMetaService);

  protected readonly city = computed(() => findCityBySlug(this.store.cities(), this.citySlug()));
  protected readonly attraction = computed(() => {
    const city = this.city();
    return city ? findAttraction(this.store.attractions(), city.id, this.attractionSlug()) : undefined;
  });
  protected readonly category = computed(() => this.store.categoryById().get(this.attraction()?.categoryId ?? ''));

  protected readonly crumbs = computed<readonly Crumb[]>(() => {
    const [city, attraction] = [this.city(), this.attraction()];
    if (!city || !attraction) return [];
    return [{ label: 'Explorar', link: '/' }, { label: city.name, link: `/cidades/${city.slug}` }, { label: attraction.name }];
  });
  protected readonly placeUrl = computed(() => {
    const a = this.attraction();
    return a ? googleMapsPlaceUrl(a.coordinates) : '';
  });
  protected readonly directionsUrl = computed(() => {
    const a = this.attraction();
    return a ? googleMapsDirectionsUrl(a.coordinates) : '';
  });
  protected readonly verifiedOn = computed(() => formatIsoDate(this.attraction()?.lastVerifiedAt ?? ''));

  constructor() {
    effect(() => {
      const [city, a] = [this.city(), this.attraction()];
      if (a && city) this.meta.set(`${a.name}, ${city.name}`, a.description);
      else if (this.store.status() === 'ready') this.meta.set('Atração não encontrada');
    });
  }

  /** Volta ao mapa com esta atração selecionada. */
  protected showOnMap(): void {
    const a = this.attraction();
    if (!a) return;
    this.store.clearFilters();
    this.store.select(a.id);
    void this.router.navigateByUrl('/');
  }
}
