import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { pageTransition } from './shared/animations';

@Component({
  imports: [RouterOutlet, Header, Footer],
  selector: 'app-root',
  templateUrl: './app.html',
  animations: [pageTransition],
})
export class App {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly announcer = inject(LiveAnnouncer);
  private readonly title = inject(Title);
  private firstNavigation = true;
  private readonly router = inject(Router);

  /** Chave da rota atual (sem query/fragmento): dispara a animação de entrada ao trocar de página. */
  protected readonly routeKey = signal(this.router.url.split(/[?#]/)[0]);
  /** Desliga todas as animações quando o usuário prefere menos movimento. */
  protected readonly reduceMotion = signal(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  constructor() {
    // SPA: a cada troca de página, leva o foco ao conteúdo e anuncia o título (leitores de tela
    // não percebem a troca sozinhos). A primeira carga não rouba o foco.
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => this.reduceMotion.set(e.matches));
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        this.routeKey.set(this.router.url.split(/[?#]/)[0]);
        if (this.firstNavigation) {
          this.firstNavigation = false;
          return;
        }
        // O título das páginas de detalhe é definido depois que o catálogo é lido; espera um instante.
        setTimeout(() => {
          this.focusMain();
          this.announcer.announce(this.title.getTitle(), 'polite');
        }, 300);
      });
  }

  /**
   * Com hash routing, `href="#conteudo"` seria lido como rota e navegaria para outra página;
   * por isso o link de pular é tratado aqui.
   */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.focusMain();
  }

  private focusMain(): void {
    this.main().nativeElement.focus({ preventScroll: false });
  }
}
