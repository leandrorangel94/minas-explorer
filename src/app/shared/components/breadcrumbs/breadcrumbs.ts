import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  readonly label: string;
  /** Sem link = página atual. */
  readonly link?: string;
}

@Component({
  selector: 'me-breadcrumbs',
  imports: [RouterLink],
  template: `
    <nav aria-label="Você está em" class="me-crumbs">
      <ol>
        @for (crumb of items(); track crumb.label) {
          <li>
            @if (crumb.link) {
              <a [routerLink]="crumb.link">{{ crumb.label }}</a>
            } @else {
              <span aria-current="page">{{ crumb.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    .me-crumbs ol { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 8px; font-size: .9rem; color: var(--me-muted); }
    .me-crumbs li:not(:last-child)::after { content: '/'; margin-left: 8px; color: var(--me-border); }
    .me-crumbs a { color: var(--me-forest); }
    .me-crumbs [aria-current] { color: var(--me-ink); font-weight: 600; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {
  readonly items = input.required<readonly Crumb[]>();
}
