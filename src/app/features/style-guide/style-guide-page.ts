import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { LucideSearchX } from '@lucide/angular';
import { DestinationCard } from '../../shared/components/destination-card/destination-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { SectionTitle } from '../../shared/components/section-title/section-title';

/** Página de referência visual. Os textos são apenas exemplos, não dados reais do catálogo. */
@Component({
  selector: 'me-style-guide-page',
  imports: [MatButtonModule, MatChipsModule, LucideSearchX, DestinationCard, EmptyState, SectionTitle],
  template: `
    <div class="me-container grid gap-12 py-10">
      <me-section-title eyebrow="Interno" title="Guia de estilo" subtitle="Referência dos componentes visuais. Conteúdo ilustrativo." />

      <section class="grid gap-3" aria-labelledby="sg-type">
        <h3 id="sg-type">Tipografia</h3>
        <h1>Título H1</h1>
        <h2>Título H2</h2>
        <h3>Título H3</h3>
        <p>Texto de corpo em Inter, com bom contraste sobre o fundo off-white.</p>
      </section>

      <section class="grid gap-3" aria-labelledby="sg-btn">
        <h3 id="sg-btn">Botões</h3>
        <div class="flex flex-wrap gap-3">
          <button matButton="filled" type="button">Primário</button>
          <button matButton="outlined" type="button">Secundário</button>
          <button matButton type="button">Texto</button>
          <button matButton="filled" type="button" disabled>Desabilitado</button>
        </div>
      </section>

      <section class="grid gap-3" aria-labelledby="sg-chip">
        <h3 id="sg-chip">Chips</h3>
        <mat-chip-set aria-label="Exemplo de filtros">
          <mat-chip>Categoria A</mat-chip>
          <mat-chip highlighted>Selecionado</mat-chip>
          <mat-chip>Categoria C</mat-chip>
        </mat-chip-set>
      </section>

      <section class="grid gap-3" aria-labelledby="sg-card">
        <h3 id="sg-card">Cards</h3>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <me-destination-card name="Exemplo de atração" city="Cidade de exemplo" category="Categoria" />
          <me-destination-card name="Imagem com falha" city="Cidade de exemplo" category="Categoria" imageUrl="/nao-existe.jpg" imageAlt="" />
        </div>
      </section>

      <section class="grid gap-3" aria-labelledby="sg-empty">
        <h3 id="sg-empty">Estado vazio</h3>
        <me-empty-state title="Nenhum resultado" description="Tente remover filtros ou buscar por outro termo.">
          <svg icon lucideSearchX [size]="28" aria-hidden="true"></svg>
        </me-empty-state>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyleGuidePage {}
