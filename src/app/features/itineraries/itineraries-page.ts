import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PageMetaService } from '../../core/services/page-meta.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { SectionTitle } from '../../shared/components/section-title/section-title';
import { ExplorerStore } from '../explore/explorer.store';
import { EditorialNote } from './editorial-note';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'me-itineraries-page',
  imports: [
    RouterLink, MatButtonModule, EmptyState, SectionTitle, EditorialNote, Icon,
  ],
  templateUrl: './itineraries-page.html',
  styleUrl: './itineraries-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItinerariesPage {
  protected readonly store = inject(ExplorerStore);

  protected readonly items = computed(() =>
    this.store.itineraries().map((it) => ({
      it,
      regionName: this.store.regionName(it.regionId),
      stops: it.days.reduce((n, d) => n + d.stopIds.length, 0),
    })),
  );

  constructor() {
    inject(PageMetaService).set('Roteiros', 'Sugestões editoriais de roteiros por Minas Gerais.');
  }
}
