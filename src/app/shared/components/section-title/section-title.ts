import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'me-section-title',
  template: `
    <div class="me-section-title">
      @if (eyebrow()) {
        <span class="me-section-title__eyebrow">{{ eyebrow() }}</span>
      }
      @if (level() === 1) {
        <h1 class="me-section-title__heading">{{ title() }}</h1>
      } @else {
        <h2 class="me-section-title__heading">{{ title() }}</h2>
      }
      @if (subtitle()) {
        <p class="me-section-title__subtitle">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: `
    .me-section-title { display: grid; gap: 6px; }
    .me-section-title__eyebrow { font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; color: var(--me-muted); font-weight: 600; }
    .me-section-title__heading { font-size: clamp(1.5rem, 2vw + 1rem, 2rem); }
    .me-section-title__subtitle { color: var(--me-muted); max-width: 60ch; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionTitle {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
  readonly subtitle = input<string>();
  /** `1` para o título principal da página (cada página precisa de um único h1). */
  readonly level = input<1 | 2>(2);
}
