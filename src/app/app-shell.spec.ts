import { LiveAnnouncer } from '@angular/cdk/a11y';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({ template: '<p>página</p>' })
class Dummy {}

describe('App shell: foco e navegação por teclado', () => {
  async function create() {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: '', component: Dummy }, { path: 'outra', component: Dummy, title: 'Outra – Minas Explorer' }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    document.body.appendChild(fixture.nativeElement);
    return { fixture, el: fixture.nativeElement as HTMLElement, router: TestBed.inject(Router) };
  }

  afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ''; });

  it('"Ir para o conteúdo" foca o <main> sem navegar para outra rota', async () => {
    const { fixture, el, router } = await create();
    await router.navigateByUrl('/outra');
    fixture.detectChanges();
    const before = router.url;
    const link = el.querySelector('a.me-skip-link') as HTMLAnchorElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); // com hash routing, o href seria lido como rota
    expect(router.url).toBe(before);
    expect(document.activeElement).toBe(el.querySelector('main#conteudo'));
  });

  it('a primeira carga não rouba o foco; trocar de página foca o conteúdo e anuncia o título', async () => {
    vi.useFakeTimers();
    const { fixture, el, router } = await create();
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    const main = el.querySelector('main#conteudo') as HTMLElement;

    await router.navigateByUrl('/'); // equivale à carga inicial já concluída
    vi.advanceTimersByTime(400);
    expect(document.activeElement).not.toBe(main);

    await router.navigateByUrl('/outra');
    fixture.detectChanges();
    vi.advanceTimersByTime(400);
    expect(document.activeElement).toBe(main);
    expect(announce).toHaveBeenCalledWith(TestBed.inject(Title).getTitle(), 'polite');
    expect(TestBed.inject(Title).getTitle()).toBe('Outra – Minas Explorer');
  });

  it('tem os pontos de referência esperados', async () => {
    const { el } = await create();
    expect(el.querySelector('header')).toBeTruthy();
    expect(el.querySelector('nav[aria-label="Principal"]')).toBeTruthy();
    expect(el.querySelector('main#conteudo[tabindex="-1"]')).toBeTruthy();
    expect(el.querySelector('footer')).toBeTruthy();
  });
});
