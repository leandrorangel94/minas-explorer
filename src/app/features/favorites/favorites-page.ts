import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LucideHeart } from '@lucide/angular';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { SectionTitle } from '../../shared/components/section-title/section-title';

@Component({
  selector: 'me-favorites-page',
  imports: [RouterLink, MatButtonModule, LucideHeart, EmptyState, SectionTitle],
  template: `
    <section class="me-container py-10">
      <me-section-title title="Favoritos" subtitle="Seus destinos salvos neste navegador." />
      <div class="mt-6">
        <me-empty-state
          title="Você ainda não tem favoritos"
          description="Quando a função estiver disponível, os favoritos serão guardados apenas neste navegador e dispositivo."
        >
          <svg icon lucideHeart [size]="28" aria-hidden="true"></svg>
          <a matButton="filled" routerLink="/">Explorar destinos</a>
        </me-empty-state>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPage {}
