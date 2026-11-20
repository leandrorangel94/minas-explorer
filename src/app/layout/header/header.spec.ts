import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { THEME_STORAGE_KEY, ThemeService } from '../../core/services/theme.service';
import { Header } from './header';

describe('Header: alternador de tema', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.querySelectorAll('.cdk-overlay-container').forEach((o) => (o.innerHTML = ''));
  });

  async function open() {
    TestBed.configureTestingModule({ imports: [Header], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.me-theme-btn') as HTMLButtonElement;
    return { fixture, btn };
  }

  it('o botão informa o tema atual e tem nome acessível', async () => {
    const { btn } = await open();
    expect(btn.getAttribute('aria-label')).toBe('Tema: Sistema. Alterar tema');
  });

  it('abre um menu com Sistema, Claro e Escuro e aplica a escolha', async () => {
    const { fixture, btn } = await open();
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const items = [...document.querySelectorAll('[role="menuitemradio"]')] as HTMLElement[];
    expect(items.map((i) => i.textContent?.trim())).toEqual(['Sistema', 'Claro', 'Escuro']);
    expect(items[0].getAttribute('aria-checked')).toBe('true');

    items[2].click();
    fixture.detectChanges();
    expect(TestBed.inject(ThemeService).preference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(btn.getAttribute('aria-label')).toBe('Tema: Escuro. Alterar tema');
  });
});
