import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { LucideImageOff } from '@lucide/angular';
import { CatalogImage } from '../../../core/models/catalog.models';

/**
 * Galeria de fotografias com créditos obrigatórios (autor, licença, fonte).
 * Imagens carregam sob demanda; uma imagem com erro vira placeholder, sem quebrar o layout.
 */
@Component({
  selector: 'me-image-gallery',
  imports: [LucideImageOff],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGallery {
  readonly images = input<readonly CatalogImage[]>([]);
  /** Nome do destino, usado na mensagem de galeria vazia. */
  readonly subject = input('este destino');

  protected readonly index = signal(0);
  private readonly failed = signal<ReadonlySet<string>>(new Set());

  protected readonly current = computed(() => this.images()[Math.min(this.index(), this.images().length - 1)]);
  protected readonly currentFailed = computed(() => {
    const img = this.current();
    return !!img && this.failed().has(img.url);
  });

  protected select(i: number): void {
    this.index.set(i);
  }

  protected isFailed(img: CatalogImage): boolean {
    return this.failed().has(img.url);
  }

  protected onError(img: CatalogImage): void {
    this.failed.update((s) => new Set(s).add(img.url));
  }
}
