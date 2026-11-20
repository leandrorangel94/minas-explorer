import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LucideImageOff } from '@lucide/angular';
import { CategoryIcon } from '../category-icon/category-icon';

/**
 * Card de cidade/atração. Sem imagem (ou com erro de carga) mostra placeholder próprio.
 * O título é um botão que "estica" sobre o card (área de clique/toque grande e acessível por teclado).
 */
@Component({
  selector: 'me-destination-card',
  imports: [LucideImageOff, CategoryIcon],
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
  readonly imageAlt = input<string>('');
  readonly selected = input(false);
  /** Layout em linha (miniatura + texto) para painéis estreitos. */
  readonly compact = input(false);
  /** Emitido ao ativar o card (clique, Enter ou Espaço no título). Sem ouvinte, o título é texto simples. */
  readonly activated = output<void>();

  protected readonly imageFailed = signal(false);
  protected readonly showImage = computed(() => !!this.imageUrl() && !this.imageFailed());

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
