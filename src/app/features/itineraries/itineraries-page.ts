import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LucideRoute } from '@lucide/angular';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { SectionTitle } from '../../shared/components/section-title/section-title';

@Component({
  selector: 'me-itineraries-page',
  imports: [RouterLink, MatButtonModule, LucideRoute, EmptyState, SectionTitle],
  template: `
    <section class="me-container py-10">
      <me-section-title title="Roteiros" subtitle="Sugestões editoriais de passeios por Minas Gerais." />
      <div class="mt-6">
        <me-empty-state title="Nenhum roteiro disponível ainda" description="Os roteiros serão adicionados em uma etapa futura.">
          <svg icon lucideRoute [size]="28" aria-hidden="true"></svg>
          <a matButton="outlined" routerLink="/">Voltar ao início</a>
        </me-empty-state>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItinerariesPage {}
