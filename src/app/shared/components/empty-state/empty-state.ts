import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado vazio genérico. O ícone entra por projeção: `<svg lucideX icon></svg>`. */
@Component({
  selector: 'me-empty-state',
  template: `
    <div class="me-empty" role="status">
      <div class="me-empty__icon"><ng-content select="[icon]" /></div>
      <h3>{{ title() }}</h3>
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
    .me-empty__icon:empty { display: none; }
    .me-empty__description { color: var(--me-muted); max-width: 48ch; }
    .me-empty__actions:empty { display: none; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
}
