import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Skeleton } from './skeleton';

/** Esqueleto de página de detalhe (cidade, atração, roteiro) enquanto o catálogo carrega. */
@Component({
  selector: 'me-detail-skeleton',
  imports: [Skeleton],
  template: `
    <div class="me-container me-dsk" role="status" aria-busy="true">
      <span class="me-visually-hidden">Carregando…</span>
      <me-skeleton width="220px" height="1rem" />
      <me-skeleton width="min(520px, 80%)" height="clamp(2rem, 4vw, 3rem)" />
      <me-skeleton width="min(640px, 95%)" height="1.1rem" />
      <me-skeleton width="min(480px, 80%)" height="1.1rem" />
      <div class="me-dsk__actions">
        <me-skeleton width="140px" height="44px" />
        <me-skeleton width="170px" height="44px" />
      </div>
      <div class="me-dsk__grid">
        <me-skeleton height="clamp(220px, 28vw, 420px)" />
        <div class="me-dsk__cards">
          <me-skeleton height="140px" />
          <me-skeleton height="140px" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .me-dsk { display: grid; gap: var(--me-space-3); padding-block: var(--me-space-5); }
    .me-dsk__actions { display: flex; gap: var(--me-space-3); flex-wrap: wrap; }
    .me-dsk__grid { display: grid; gap: var(--me-space-4); margin-top: var(--me-space-3); }
    .me-dsk__cards { display: grid; gap: var(--me-space-3); align-content: start; }
    @media (min-width: 900px) { .me-dsk__grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailSkeleton {}

/** Esqueleto de grade de cards (favoritos, roteiros). */
@Component({
  selector: 'me-cards-skeleton',
  imports: [Skeleton],
  template: `
    <div class="me-csk" role="status" aria-busy="true">
      <span class="me-visually-hidden">Carregando…</span>
      @for (n of items(); track n) {
        <div class="me-csk__card">
          <me-skeleton height="140px" />
          <me-skeleton width="70%" height="1.15rem" />
          <me-skeleton width="45%" height=".9rem" />
        </div>
      }
    </div>
  `,
  styles: `
    .me-csk { display: grid; gap: var(--me-space-3); grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); margin-top: var(--me-space-4); }
    .me-csk__card { display: grid; gap: var(--me-space-2); padding: var(--me-space-3); background: var(--me-surface);
      border: 1px solid var(--me-border); border-radius: var(--me-radius); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsSkeleton {
  readonly count = input(6);
  protected items() {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
