import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Card de cidade/atração. Sem imagem (ou com erro de carga) mostra placeholder próprio.
 * O título é um botão que "estica" sobre o card (área de clique/toque grande e acessível por teclado).
 */
@Component({
  selector: 'me-destination-card',
  imports: [
    Icon,
  ],
  templateUrl: './destination-card.html',
  styleUrl: './destination-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationCard {
  readonly name = input.required<string>();
  readonly city = input<string>();
  readonly category = input<string>();
  readonly categoryIcon = input<string>();
  readonly categoryColor = input<string>();
  readonly imageUrl = input<string>();
  /** Miniatura (480 px). Com ela, o navegador escolhe o arquivo certo via `srcset`. */
  readonly imageThumbUrl = input<string>();
  readonly imageAlt = input<string>('');
  readonly selected = input(false);
  /** Layout em linha (miniatura + texto) para painéis estreitos. */
  readonly compact = input(false);
  /** Emitido ao ativar o card (clique, Enter ou Espaço no título). Sem ouvinte, o título é texto simples. */
  readonly activated = output<void>();

  protected readonly imageFailed = signal(false);
  protected readonly srcset = computed(() => {
    const [thumb, full] = [this.imageThumbUrl(), this.imageUrl()];
    return thumb && full ? `${thumb} 480w, ${full} 960w` : null;
  });
  /** Largura exibida: miniatura fixa no card compacto; no card grande, até ~1/3 da tela. */
  protected readonly sizes = computed(() => (this.compact() ? '88px' : '(min-width: 640px) 33vw, 100vw'));
  protected readonly showImage = computed(() => !!this.imageUrl() && !this.imageFailed());

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
