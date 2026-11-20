import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'me-section-title',
  template: `
    <div class="me-section-title">
      @if (eyebrow()) {
        <span class="me-section-title__eyebrow">{{ eyebrow() }}</span>
      }
      <h2>{{ title() }}</h2>
      @if (subtitle()) {
        <p class="me-section-title__subtitle">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: `
    .me-section-title { display: grid; gap: 6px; }
    .me-section-title__eyebrow { font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; color: var(--me-muted); font-weight: 600; }
    .me-section-title__subtitle { color: var(--me-muted); max-width: 60ch; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionTitle {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
  readonly subtitle = input<string>();
}
