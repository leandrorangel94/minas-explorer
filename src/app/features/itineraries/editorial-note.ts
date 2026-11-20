import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../shared/components/icon/icon';

/** Aviso fixo: roteiros são sugestões editoriais, sem dados logísticos. */
@Component({
  selector: 'me-editorial-note',
  imports: [
    Icon,
  ],
  template: `
    <p class="me-editorial" role="note">
      <me-icon name="info" [size]="18" />
      <span>
        <strong>Sugestão editorial.</strong> Os roteiros indicam apenas destinos e uma ordem temática. Não informamos distâncias, tempos de
        deslocamento nem duração ideal: planeje o trajeto e confirme horários e condições de acesso antes de viajar.
      </span>
    </p>
  `,
  styles: `
    .me-editorial { display: flex; gap: 10px; align-items: flex-start; margin: 16px 0 0; padding: 12px 14px;
      border-radius: var(--me-radius-sm); background: var(--me-sage-light); color: var(--me-heading); font-size: .9rem; }
    svg { flex: none; margin-top: 2px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorialNote {}
