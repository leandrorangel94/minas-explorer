import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import catalogJson from '../../../public/data/catalog.json';
import categoriesJson from '../../../public/data/categories.json';
import itinerariesJson from '../../../public/data/itineraries.json';
import regionsJson from '../../../public/data/regions.json';
import { FAVORITES_STORAGE_KEY, FavoritesService } from '../core/services/favorites.service';
import { ExplorerStore } from './explore/explorer.store';
import { FavoritesPage } from './favorites/favorites-page';
import { ItinerariesPage } from './itineraries/itineraries-page';
import { ItineraryPage } from './itineraries/itinerary-page';
import { FavoriteButton } from '../shared/components/favorite-button/favorite-button';

async function create<T>(component: Type<T>, inputs: Record<string, string> = {}, flush = true) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const store = TestBed.inject(ExplorerStore);
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  if (flush) {
    http.expectOne('data/catalog.json').flush(catalogJson);
    http.expectOne('data/categories.json').flush(categoriesJson);
    http.expectOne('data/regions.json').flush(regionsJson);
    http.expectOne('data/itineraries.json').flush(itinerariesJson);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, store, http, el: fixture.nativeElement as HTMLElement };
}

describe('FavoriteButton', () => {
  beforeEach(() => localStorage.clear());

  it('alterna favorito, anuncia o estado e não propaga o clique', async () => {
    const fixture = TestBed.createComponent(FavoriteButton);
    fixture.componentRef.setInput('kind', 'attraction');
    fixture.componentRef.setInput('id', 'a1');
    fixture.componentRef.setInput('label', 'Lugar A');
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Favoritar Lugar A');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(TestBed.inject(FavoritesService).isFavorite('attraction', 'a1')).toBe(true);
  });
});

describe('FavoritesPage', () => {
  beforeEach(() => localStorage.clear());

  it('sem favoritos mostra estado vazio e o aviso sobre dados locais', async () => {
    const { el } = await create(FavoritesPage);
    expect(el.querySelector('me-empty-state')?.textContent).toContain('ainda não tem favoritos');
    expect(el.querySelector('.me-fav-note')?.textContent).toContain('apenas neste navegador');
    expect(el.querySelector('.me-fav-note')?.textContent).toContain('não são sincronizados');
  });

  it('lista cidades e atrações favoritas e permite remover', async () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 1, items: [
      { kind: 'attraction', id: '3117504-cachoeira-do-tabuleiro' }, { kind: 'city', id: '3146107' },
    ] }));
    const { fixture, el } = await create(FavoritesPage);
    expect(el.querySelectorAll('me-destination-card').length).toBe(2);
    expect(el.textContent).toContain('Cachoeira do Tabuleiro');
    expect(el.textContent).toContain('Ouro Preto');
    expect(el.querySelector('.me-fav-toolbar')?.textContent).toContain('2 favoritos');

    (el.querySelector('me-favorite-button button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelectorAll('me-destination-card').length).toBe(1);
  });

  it('"Remover todos" pede confirmação antes de apagar', async () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 1, items: [{ kind: 'city', id: '3146107' }] }));
    const { fixture, el } = await create(FavoritesPage);
    const clearBtn = [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Remover todos')) as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();
    expect(TestBed.inject(FavoritesService).count()).toBe(1); // ainda não apagou
    expect(el.textContent).toContain('Remover todos os favoritos?');
    ([...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Sim, remover')) as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(TestBed.inject(FavoritesService).count()).toBe(0);
    expect(el.querySelector('me-empty-state')).toBeTruthy();
  });

  it('avisa e remove favoritos que não existem mais no catálogo', async () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 1, items: [
      { kind: 'attraction', id: 'inexistente' }, { kind: 'city', id: '3146107' },
    ] }));
    const { fixture, el } = await create(FavoritesPage);
    expect(el.querySelector('.me-fav-warning')?.textContent).toContain('não existe mais');
    (el.querySelector('.me-fav-link') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(TestBed.inject(FavoritesService).items()).toEqual([{ kind: 'city', id: '3146107' }]);
  });
});

describe('Roteiros', () => {
  it('a lista mostra os roteiros editoriais com o aviso de que não há logística', async () => {
    const { el } = await create(ItinerariesPage);
    expect(el.querySelectorAll('.me-it-card').length).toBe(itinerariesJson.length);
    expect(el.querySelector('.me-editorial')?.textContent).toContain('Não informamos distâncias');
    expect(el.querySelector('.me-it-card a')?.getAttribute('href')).toBe(`/roteiros/${itinerariesJson[0].slug}`);
  });

  it('o detalhe mostra dias, paradas resolvidas e links (detalhes, mapa, Google Maps)', async () => {
    const { el } = await create(ItineraryPage, { slug: 'regiao-de-bh-historia-e-natureza' });
    expect(el.querySelector('h1')?.textContent).toContain('história e natureza');
    expect([...el.querySelectorAll('.me-itd__day h2')].map((h) => h.textContent)).toEqual(['Dia 1: história', 'Dia 2: serra', 'Dia 3: cachoeira']);
    expect(el.querySelectorAll('me-destination-card').length).toBe(3);
    const gm = el.querySelector('.me-itd__link[target="_blank"]') as HTMLAnchorElement;
    expect(gm.href).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(gm.rel).toBe('noopener noreferrer');
    expect(el.textContent).not.toMatch(/\d+\s*(km|min|horas?)\b/i); // sem distância/duração inventada
  });

  it('"Ver no mapa" seleciona a parada e navega para a home', async () => {
    const { el, store } = await create(ItineraryPage, { slug: 'belo-horizonte-arquitetura-e-sabores' });
    const nav = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const btn = [...el.querySelectorAll('button.me-itd__link')].find((b) => b.textContent?.includes('Ver no mapa')) as HTMLButtonElement;
    btn.click();
    expect(store.selectedId()).toBe('3106200-conjunto-arquitetonico-da-pampulha');
    expect(nav).toHaveBeenCalledWith('/');
  });

  it('roteiro inexistente mostra "não encontrado"', async () => {
    const { el } = await create(ItineraryPage, { slug: 'nao-existe' });
    expect(el.querySelector('me-empty-state')?.textContent).toContain('Roteiro não encontrado');
  });

  it('todas as paradas dos roteiros existem no catálogo e não há campos logísticos', () => {
    const ids = new Set(catalogJson.attractions.map((a) => a.id));
    for (const it of itinerariesJson) {
      for (const d of it.days) for (const s of d.stopIds) expect(ids.has(s), s).toBe(true);
      for (const banned of ['duration', 'distance', 'distanceKm', 'route']) expect(Object.keys(it)).not.toContain(banned);
    }
  });
});
