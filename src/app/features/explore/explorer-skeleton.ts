import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from '../../shared/components/skeleton/skeleton';

/** Esqueleto da área de exploração (filtros, lista e mapa) enquanto o catálogo carrega. */
@Component({
  selector: 'me-explorer-skeleton',
  imports: [Skeleton],
  template: `
    <div class="me-sk" role="status" aria-busy="true">
      <span class="me-visually-hidden">Carregando destinos…</span>
      <div class="me-sk__filters">
        @for (w of chipWidths; track $index) {
          <me-skeleton [width]="w" height="32px" />
        }
      </div>
      <div class="me-sk__list">
        @for (i of rows; track i) {
          <div class="me-sk__card">
            <me-skeleton width="88px" height="100%" />
            <div class="me-sk__text">
              <me-skeleton width="70%" height="1.1rem" />
              <me-skeleton width="45%" height=".9rem" />
              <me-skeleton width="60%" height=".8rem" />
            </div>
          </div>
        }
      </div>
      <me-skeleton class="me-sk__map" width="100%" height="100%" />
    </div>
  `,
  styles: `
    .me-sk { display: grid; gap: var(--me-space-3); --h: clamp(360px, 62vh, 680px); }
    .me-sk__filters { display: flex; flex-wrap: wrap; gap: var(--me-space-2); }
    .me-sk__list { display: grid; gap: var(--me-space-2); align-content: start; }
    .me-sk__card { display: grid; grid-template-columns: 88px 1fr; gap: var(--me-space-3); height: 96px; padding: var(--me-space-1);
      background: var(--me-surface); border: 1px solid var(--me-border); border-radius: var(--me-radius); }
    .me-sk__text { display: grid; gap: var(--me-space-2); align-content: center; }
    .me-sk__map { height: var(--h); border-radius: var(--me-radius); }
    :host { display: block; }
    @media (min-width: 1024px) {
      .me-sk { --h: clamp(460px, calc(100vh - var(--me-header-height) - 300px), 980px);
        grid-template-columns: clamp(340px, 24vw, 460px) minmax(0, 1fr); grid-template-areas: 'f f' 'l m'; column-gap: var(--me-space-4); }
      .me-sk__filters { grid-area: f; }
      .me-sk__list { grid-area: l; max-height: var(--h); overflow: hidden; }
      .me-sk__map { grid-area: m; }
    }
    @media (max-width: 1023px) { .me-sk__list { display: none; } .me-sk__map { height: var(--h); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplorerSkeleton {
  protected readonly chipWidths = ['150px', '110px', '100px', '150px', '210px', '170px', '130px', '190px'];
  protected readonly rows = [1, 2, 3, 4, 5, 6];
}
