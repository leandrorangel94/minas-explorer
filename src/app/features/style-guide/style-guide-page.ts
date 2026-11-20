import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { DestinationCard } from '../../shared/components/destination-card/destination-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { SectionTitle } from '../../shared/components/section-title/section-title';
import { Icon } from '../../shared/components/icon/icon';

/** Página de referência visual. Os textos são apenas exemplos, não dados reais do catálogo. */
@Component({
  selector: 'me-style-guide-page',
  imports: [
    MatButtonModule, MatChipsModule, DestinationCard, EmptyState, SectionTitle, Icon,
  ],
  template: `
    <div class="me-container grid gap-12 py-10">
      <me-section-title [level]="1" eyebrow="Interno" title="Guia de estilo" subtitle="Referência dos componentes visuais. Conteúdo ilustrativo." />

      <section class="grid gap-3" aria-labelledby="sg-type">
        <h2 id="sg-type">Tipografia</h2>
        <p class="sg-h1" aria-hidden="true">Título H1 (estilo)</p>
        <h2>Título H2</h2>
        <h3>Título H3</h3>
        <p>Texto de corpo em Inter, com bom contraste sobre o fundo off-white.</p>
      </section>

      <section class="grid gap-3" aria-labelledby="sg-btn">
        <h2 id="sg-btn">Botões</h2>
        <div class="flex flex-wrap gap-3">
          <button matButton="filled" type="button">Primário</button>
          <button matButton="outlined" type="button">Secundário</button>
          <button matButton type="button">Texto</button>
          <button matButton="filled" type="button" disabled>Desabilitado</button>
        </div>
      </section>

      <section class="grid gap-3" aria-labelledby="sg-chip">
        <h2 id="sg-chip">Chips</h2>
        <div role="group" aria-label="Exemplo de filtros">
          <mat-chip-set>
          <mat-chip>Categoria A</mat-chip>
          <mat-chip highlighted>Selecionado</mat-chip>
          <mat-chip>Categoria C</mat-chip>
          </mat-chip-set>
        </div>
      </section>

      <section class="grid gap-3" aria-labelledby="sg-card">
        <h2 id="sg-card">Cards</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <me-destination-card name="Exemplo de atração" city="Cidade de exemplo" category="Categoria" />
          <me-destination-card name="Imagem com falha" city="Cidade de exemplo" category="Categoria" imageUrl="/nao-existe.jpg" imageAlt="" />
        </div>
      </section>

      <section class="grid gap-3" aria-labelledby="sg-empty">
        <h2 id="sg-empty">Estado vazio</h2>
        <me-empty-state title="Nenhum resultado" description="Tente remover filtros ou buscar por outro termo.">
          <me-icon icon name="search-x" [size]="28" />
        </me-empty-state>
      </section>
    </div>
  `,
  styles: `.sg-h1 { font-family: var(--me-font-display); font-weight: 600; color: var(--me-heading); font-size: clamp(2rem, 4vw + 1rem, 3.25rem); line-height: 1.2; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyleGuidePage {}
