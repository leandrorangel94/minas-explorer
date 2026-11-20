import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input } from '@angular/core';
import { createIcon } from '../../../core/utils/icons';

/**
 * Ícone (Lucide, registro em `core/utils/icons.ts`). Decorativo: o significado deve estar em texto
 * ao lado ou no `aria-label` do botão que o contém.
 */
@Component({
  selector: 'me-icon',
  template: '',
  styles: ':host { display: inline-flex; line-height: 0; flex: none; }',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input<string | undefined>();
  readonly size = input(18);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    effect(() => this.host.replaceChildren(createIcon(this.name(), this.size())));
  }
}
