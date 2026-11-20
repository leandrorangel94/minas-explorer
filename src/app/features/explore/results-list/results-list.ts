import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideSearchX } from '@lucide/angular';
import { DestinationCard } from '../../../shared/components/destination-card/destination-card';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ExplorerItem } from '../explorer.store';

/** Lista de resultados: alternativa ao mapa e painel lateral. Mesmos itens do mapa. */
@Component({
  selector: 'me-results-list',
  imports: [RouterLink, DestinationCard, EmptyState, LucideSearchX],
  templateUrl: './results-list.html',
  styleUrl: './results-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsList {
  readonly items = input.required<readonly ExplorerItem[]>();
  readonly selectedId = input<string | null>(null);
  readonly filtersActive = input(false);
  readonly compact = input(false);
  readonly itemSelected = output<string>();
  readonly filtersCleared = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // Mantém o item selecionado (ex.: clicado no mapa) visível na lista.
    effect(() => {
      const id = this.selectedId();
      if (!id) return;
      queueMicrotask(() =>
        this.host.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' }),
      );
    });
  }
}
