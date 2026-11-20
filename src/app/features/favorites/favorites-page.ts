import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LucideHeart, LucideInfo, LucideTriangleAlert } from '@lucide/angular';
import { FavoritesService } from '../../core/services/favorites.service';
import { PageMetaService } from '../../core/services/page-meta.service';
import { DestinationCard } from '../../shared/components/destination-card/destination-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { FavoriteButton } from '../../shared/components/favorite-button/favorite-button';
import { SectionTitle } from '../../shared/components/section-title/section-title';
import { ExplorerStore } from '../explore/explorer.store';

@Component({
  selector: 'me-favorites-page',
  imports: [
    RouterLink, MatButtonModule, LucideHeart, LucideInfo, LucideTriangleAlert,
    DestinationCard, EmptyState, FavoriteButton, SectionTitle,
  ],
  templateUrl: './favorites-page.html',
  styleUrl: './favorites-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPage {
  protected readonly store = inject(ExplorerStore);
  protected readonly favorites = inject(FavoritesService);

  protected readonly confirmingClear = signal(false);

  /** Favoritos que ainda existem no catálogo, já resolvidos. */
  protected readonly cities = computed(() => {
    const byId = new Map(this.store.cities().map((c) => [c.id, c]));
    return this.favorites.items().filter((f) => f.kind === 'city').flatMap((f) => byId.get(f.id) ?? []);
  });
  protected readonly attractions = computed(() => {
    const byId = this.store.attractionById();
    const cityById = new Map(this.store.cities().map((c) => [c.id, c]));
    return this.favorites.items().filter((f) => f.kind === 'attraction').flatMap((f) => {
      const attraction = byId.get(f.id);
      const city = attraction ? cityById.get(attraction.cityId) : undefined;
      return attraction && city ? [{ attraction, city, category: this.store.categoryById().get(attraction.categoryId) }] : [];
    });
  });
  /** Favoritos salvos cujo item não existe mais no catálogo (ex.: removido ou renomeado). */
  protected readonly orphans = computed(() =>
    this.store.status() === 'ready'
      ? this.favorites.items().filter((f) => f.kind === 'city' ? !this.cities().some((c) => c.id === f.id) : !this.attractions().some((a) => a.attraction.id === f.id))
      : [],
  );

  constructor() {
    inject(PageMetaService).set('Favoritos', 'Seus destinos favoritos de Minas Gerais, salvos neste navegador.');
  }

  protected askClear(): void {
    this.confirmingClear.set(true);
  }

  protected confirmClear(): void {
    this.favorites.clear();
    this.confirmingClear.set(false);
  }

  protected removeOrphans(): void {
    for (const f of this.orphans()) this.favorites.remove(f.kind, f.id);
  }
}
