import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ExplorerStore } from '../explorer.store';
import { Icon } from '../../../shared/components/icon/icon';

/** Filtros por categoria (que também funcionam como legenda do mapa) e região. */
@Component({
  selector: 'me-filters-panel',
  imports: [
    MatButtonModule, MatChipsModule, MatFormFieldModule, MatSelectModule, Icon,
  ],
  templateUrl: './filters-panel.html',
  styleUrl: './filters-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersPanel {
  protected readonly store = inject(ExplorerStore);

  /**
   * O chip também emite `selectionChange` quando o estado muda por código (ex.: "Limpar filtros").
   * Só age quando o evento difere do que a store já tem, evitando laço e estado fora de sincronia.
   */
  protected onCategoryChange(id: string, selected: boolean): void {
    if (selected !== this.store.categoryIds().includes(id)) this.store.toggleCategory(id);
  }
}
