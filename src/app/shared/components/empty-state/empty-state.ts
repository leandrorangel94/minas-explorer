import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado vazio genérico. O ícone entra por projeção: `<me-icon icon name="x" />`. */
@Component({
  selector: 'me-empty-state',
  template: `
    <div class="me-empty" role="status">
      <div class="me-empty__icon"><ng-content select="[icon]" /></div>
      @switch (level()) {
        @case (1) { <h1 class="me-empty__title">{{ title() }}</h1> }
        @case (2) { <h2 class="me-empty__title">{{ title() }}</h2> }
        @default { <h3 class="me-empty__title">{{ title() }}</h3> }
      }
      @if (description()) {
        <p class="me-empty__description">{{ description() }}</p>
      }
      <div class="me-empty__actions"><ng-content /></div>
    </div>
  `,
  styles: `
    .me-empty { display: grid; justify-items: center; gap: 10px; text-align: center; padding: 40px 20px;
      background: var(--me-surface); border: 1px dashed var(--me-border); border-radius: var(--me-radius); }
    .me-empty__icon { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%;
      background: var(--me-sage-light); color: var(--me-forest); }
    .me-empty__title { font-size: 1.15rem; }
    .me-empty__icon:empty { display: none; }
    .me-empty__description { color: var(--me-muted); max-width: 48ch; }
    .me-empty__actions:empty { display: none; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
  /** Nível do título: use 1 quando o estado vazio ocupa a página inteira (ex.: "não encontrada"). */
  readonly level = input<1 | 2 | 3>(3);
}
