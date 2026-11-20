import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PracticalInfo } from '../../../core/models/catalog.models';
import { formatIsoDate, monthsSince } from '../../../core/utils/format';

/** Após esse prazo a informação deixa de ser apresentada como atual. */
export const PRACTICAL_INFO_MAX_AGE_MONTHS = 12;

interface Row {
  readonly label: string;
  readonly value: string;
}

/**
 * Informações práticas (horário, preço etc.). Só mostra campos informados, sempre com fonte e
 * data de verificação; se estiver desatualizada, avisa em vez de apresentar como atual.
 */
@Component({
  selector: 'me-practical-info',
  templateUrl: './practical-info.html',
  styleUrl: './practical-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticalInfoView {
  readonly info = input<PracticalInfo | undefined>();

  protected readonly rows = computed<readonly Row[]>(() => {
    const i = this.info();
    if (!i) return [];
    const rows: Row[] = [];
    if (i.openingHours) rows.push({ label: 'Horário de visitação', value: i.openingHours });
    if (i.admission) rows.push({ label: 'Entrada', value: i.admission });
    if (i.bookingRequired !== undefined) rows.push({ label: 'Agendamento', value: i.bookingRequired ? 'Necessário' : 'Não necessário' });
    if (i.accessibility) rows.push({ label: 'Acessibilidade', value: i.accessibility });
    if (i.trailDifficulty) rows.push({ label: 'Dificuldade da trilha', value: i.trailDifficulty });
    if (i.warnings) rows.push({ label: 'Avisos e restrições', value: i.warnings });
    return rows;
  });

  protected readonly verifiedOn = computed(() => formatIsoDate(this.info()?.verifiedAt ?? ''));
  protected readonly stale = computed(() => {
    const at = this.info()?.verifiedAt;
    return !!at && monthsSince(at) >= PRACTICAL_INFO_MAX_AGE_MONTHS;
  });
}
