import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LucideCompass, LucideMenu, LucideSearch } from '@lucide/angular';
import { ExplorerStore } from '../../features/explore/explorer.store';
import { FavoritesService } from '../../core/services/favorites.service';

export interface NavItem {
  readonly label: string;
  readonly path: string;
}

@Component({
  selector: 'me-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, LucideCompass, LucideMenu, LucideSearch],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly store = inject(ExplorerStore);
  protected readonly favorites = inject(FavoritesService);
  private readonly router = inject(Router);

  protected readonly navItems: readonly NavItem[] = [
    { label: 'Explorar', path: '/' },
    { label: 'Roteiros', path: '/roteiros' },
    { label: 'Favoritos', path: '/favoritos' },
  ];

  protected onSearchInput(event: Event): void {
    this.store.setQuery((event.target as HTMLInputElement).value);
  }

  /** Enter leva ao mapa/lista, onde o resultado da busca aparece. */
  protected onSearchSubmit(event: Event): void {
    event.preventDefault();
    void this.router.navigateByUrl('/');
  }
}
