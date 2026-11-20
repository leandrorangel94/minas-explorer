import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input } from '@angular/core';
import { createCategoryIcon } from '../../../core/utils/category-icons';

/** Ícone de categoria (Lucide). Decorativo: o nome da categoria deve aparecer em texto ao lado. */
@Component({
  selector: 'me-category-icon',
  template: '',
  styles: ':host { display: inline-flex; line-height: 0; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryIcon {
  readonly name = input<string | undefined>();
  readonly size = input(18);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    effect(() => this.host.replaceChildren(createCategoryIcon(this.name(), this.size())));
  }
}
