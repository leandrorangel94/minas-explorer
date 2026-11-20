import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { map, startWith, switchMap } from 'rxjs';
import { Enrichment, EnrichmentService, formatDistance, translateOpeningHours } from '../../../core/services/enrichment.service';
import { formatIsoDate } from '../../../core/utils/format';
import { fadeIn } from '../../animations';
import { Icon } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';

type State = { loading: true } | { loading: false; data: Enrichment | undefined };

/**
 * Seções complementares de um destino (sobre/curiosidades, dados do OpenStreetMap e hospedagens
 * próximas). Só aparecem quando há dado; sempre com fonte, licença e data.
 */
@Component({
  selector: 'me-place-extras',
  imports: [MatCardModule, Icon, Skeleton],
  animations: [fadeIn],
  templateUrl: './place-extras.html',
  styleUrl: './place-extras.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceExtras {
  /** Id do destino (cidade ou atração) na chave de `enrichment.json`. */
  readonly placeId = input.required<string>();
  /** Atrações mostram dados práticos do OSM; cidades não. */
  readonly showPractical = input(true);

  private readonly service = inject(EnrichmentService);

  protected readonly state = toSignal(
    toObservable(this.placeId).pipe(
      switchMap((id) => this.service.forId(id).pipe(map((data): State => ({ loading: false, data })), startWith<State>({ loading: true }))),
    ),
    { initialValue: { loading: true } as State },
  );

  protected readonly data = computed(() => {
    const s = this.state();
    return s.loading ? undefined : s.data;
  });

  protected readonly practicalRows = computed(() => {
    const p = this.data()?.practical;
    if (!p || !this.showPractical()) return [];
    const rows: { label: string; value: string; href?: string }[] = [];
    if (p.openingHours) rows.push({ label: 'Horário', value: translateOpeningHours(p.openingHours) });
    if (p.fee) rows.push({ label: 'Entrada', value: p.fee === 'yes' ? 'Paga' : p.fee === 'no' ? 'Gratuita' : p.fee });
    if (p.wheelchair) {
      const labels: Record<string, string> = { yes: 'Acessível a cadeirantes', limited: 'Acessibilidade parcial', no: 'Sem acesso para cadeirantes' };
      rows.push({ label: 'Acessibilidade', value: labels[p.wheelchair] ?? p.wheelchair });
    }
    if (p.phone) rows.push({ label: 'Telefone', value: p.phone });
    if (p.website && /^https?:\/\//.test(p.website)) rows.push({ label: 'Site', value: p.website, href: p.website });
    return rows;
  });

  protected readonly distance = formatDistance;
  protected readonly date = (iso: string) => formatIsoDate(iso);
  protected safeUrl(url?: string): string | null {
    return url && /^https?:\/\//.test(url) ? url : null;
  }
}
