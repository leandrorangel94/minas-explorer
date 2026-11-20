import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LucideHeart } from '@lucide/angular';
import { FavoriteKind, FavoritesService } from '../../../core/services/favorites.service';

/** Botão de favoritar (alternância). O estado é anunciado por `aria-pressed` e não só pelo ícone. */
@Component({
  selector: 'me-favorite-button',
  imports: [MatButtonModule, LucideHeart],
  template: `
    <button
      matIconButton
      type="button"
      class="me-fav"
      [class.me-fav--on]="active()"
      [attr.aria-pressed]="active()"
      [attr.aria-label]="'Favoritar ' + label()"
      (click)="toggle($event)"
    >
      <svg lucideHeart [size]="22" aria-hidden="true"></svg>
    </button>
  `,
  styles: `
    :host { display: inline-flex; position: relative; z-index: 1; }
    .me-fav { color: var(--me-muted); }
    .me-fav--on { color: var(--me-danger); }
    .me-fav--on svg { fill: currentColor; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteButton {
  readonly kind = input.required<FavoriteKind>();
  readonly id = input.required<string>();
  /** Nome do destino, para o rótulo acessível. */
  readonly label = input.required<string>();

  private readonly favorites = inject(FavoritesService);
  protected readonly active = computed(() => this.favorites.isFavorite(this.kind(), this.id()));

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.favorites.toggle(this.kind(), this.id());
  }
}
