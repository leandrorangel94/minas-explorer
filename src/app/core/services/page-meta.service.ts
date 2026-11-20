import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const SUFFIX = 'Minas Explorer';
const DEFAULT_DESCRIPTION = 'Minas Gerais está mais perto do que você imagina.';

/** Título e meta description por página (SPA: ajuda abas, histórico e compartilhamento; não substitui SSR). */
@Injectable({ providedIn: 'root' })
export class PageMetaService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  set(pageTitle: string | null, description: string = DEFAULT_DESCRIPTION): void {
    this.title.setTitle(pageTitle ? `${pageTitle} – ${SUFFIX}` : SUFFIX);
    this.meta.updateTag({ name: 'description', content: description });
  }
}
