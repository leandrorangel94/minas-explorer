import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloco de carregamento (skeleton) com brilho animado. É decorativo (`aria-hidden`): quem usa deve
 * envolver o conjunto em um elemento `role="status"` com um texto "Carregando…" visualmente oculto.
 * Com `prefers-reduced-motion`, o brilho para (regra global em _theme.scss).
 */
@Component({
  selector: 'me-skeleton',
  template: '',
  host: {
    'aria-hidden': 'true',
    class: 'me-skeleton',
    '[class.me-skeleton--circle]': "shape() === 'circle'",
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
  styles: `
    :host {
      display: block;
      border-radius: var(--me-radius-sm);
      background: linear-gradient(100deg, var(--me-skeleton-base) 30%, var(--me-skeleton-shine) 50%, var(--me-skeleton-base) 70%);
      background-size: 200% 100%;
      animation: me-shimmer 1.4s ease-in-out infinite;
    }
    :host(.me-skeleton--circle) { border-radius: 50%; }
    @keyframes me-shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly shape = input<'rect' | 'circle'>('rect');
}
