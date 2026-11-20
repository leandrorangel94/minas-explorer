import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import catalogJson from '../../public/data/catalog.json';
import categoriesJson from '../../public/data/categories.json';
import itinerariesJson from '../../public/data/itineraries.json';
import regionsJson from '../../public/data/regions.json';
import { AttractionPage } from './features/attractions/attraction-page';
import { CityPage } from './features/cities/city-page';
import { FavoritesPage } from './features/favorites/favorites-page';
import { HomePage } from './features/home/home-page';
import { ItinerariesPage } from './features/itineraries/itineraries-page';
import { ItineraryPage } from './features/itineraries/itinerary-page';
import { StyleGuidePage } from './features/style-guide/style-guide-page';
import { fakeMapSize } from './testing/leaflet-test-utils';
import { FAVORITES_STORAGE_KEY } from './core/services/favorites.service';

/**
 * Regressão de acessibilidade com axe-core (WCAG 2.x A/AA + boas práticas) em cada página.
 * `color-contrast` fica de fora aqui porque o jsdom não calcula estilos de layout: o contraste
 * é auditado por `core/theme-contrast.spec.ts` (tokens) e pelo axe no navegador real.
 * `region` também: os componentes são testados fora do app shell (header/main/footer).
 */
async function render(component: Type<unknown>, inputs: Record<string, string> = {}) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  const flush = (url: string, body: object) => http.match(url).forEach((r) => r.flush(body));
  flush('data/catalog.json', catalogJson);
  flush('data/categories.json', categoriesJson);
  flush('data/regions.json', regionsJson);
  flush('data/itineraries.json', itinerariesJson);
  flush('data/geo/minas-gerais.geo.json', { type: 'FeatureCollection', features: [] });
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

async function audit(el: HTMLElement) {
  const result = await axe.run(el, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'page-has-heading-one': { enabled: false } },
  });
  return result.violations.map((v) => `${v.id}: ${v.nodes[0].html.slice(0, 120)}`);
}

describe('Acessibilidade (axe-core)', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = fakeMapSize();
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 1, items: [
      { kind: 'attraction', id: '3117504-cachoeira-do-tabuleiro' }, { kind: 'city', id: '3146107' },
    ] }));
  });
  afterEach(() => {
    restore();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  const pages: [string, Type<unknown>, Record<string, string>][] = [
    ['início (mapa, filtros e lista)', HomePage, {}],
    ['cidade', CityPage, { citySlug: 'ouro-preto' }],
    ['atração com foto e créditos', AttractionPage, { citySlug: 'conceicao-do-mato-dentro', attractionSlug: 'cachoeira-do-tabuleiro' }],
    ['favoritos', FavoritesPage, {}],
    ['lista de roteiros', ItinerariesPage, {}],
    ['roteiro', ItineraryPage, { slug: 'regiao-de-bh-historia-e-natureza' }],
    ['guia de estilo', StyleGuidePage, {}],
    ['cidade não encontrada', CityPage, { citySlug: 'nao-existe' }],
    ['atração não encontrada', AttractionPage, { citySlug: 'ouro-preto', attractionSlug: 'nao-existe' }],
    ['roteiro não encontrado', ItineraryPage, { slug: 'nao-existe' }],
  ];
  for (const [name, component, inputs] of pages) {
    it(`sem violações: ${name}`, async () => {
      const el = await render(component, inputs);
      expect((await audit(el)).join(' || ')).toBe('');
    });
  }

  it('cada página com título principal tem exatamente um h1', async () => {
    for (const [component, inputs] of [
      [FavoritesPage, {}], [ItinerariesPage, {}], [StyleGuidePage, {}], [CityPage, { citySlug: 'ouro-preto' }],
      [AttractionPage, { citySlug: 'ouro-preto', attractionSlug: 'museu-da-inconfidencia' }],
      [ItineraryPage, { slug: 'regiao-de-bh-historia-e-natureza' }], [HomePage, {}],
      [CityPage, { citySlug: 'nao-existe' }], [ItineraryPage, { slug: 'nao-existe' }],
    ] as [Type<unknown>, Record<string, string>][]) {
      TestBed.resetTestingModule();
      document.body.innerHTML = '';
      const el = await render(component, inputs);
      expect(el.querySelectorAll('h1').length, component.name).toBe(1);
    }
  });
});
