import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import catalogJson from '../../../../public/data/catalog.json';
import categoriesJson from '../../../../public/data/categories.json';
import regionsJson from '../../../../public/data/regions.json';
import { fakeMapSize, mapDestinationCount } from '../../testing/leaflet-test-utils';
import { ExplorerStore } from '../explore/explorer.store';
import { HomePage } from './home-page';

async function create() {
  TestBed.configureTestingModule({
    imports: [HomePage],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const store = TestBed.inject(ExplorerStore);
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(HomePage);
  fixture.detectChanges();
  http.expectOne('data/catalog.json').flush(catalogJson);
  http.expectOne('data/categories.json').flush(categoriesJson);
  http.expectOne('data/regions.json').flush(regionsJson);
  http.expectOne('data/geo/minas-gerais.geo.json').flush({ type: 'FeatureCollection', features: [] });
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, store, el: fixture.nativeElement as HTMLElement };
}

const cards = (el: HTMLElement) => el.querySelectorAll('me-destination-card').length;
const markers = (el: HTMLElement) => mapDestinationCount(el);

describe('HomePage: mapa e lista sincronizados', () => {
  let restoreSize: () => void;
  beforeEach(() => (restoreSize = fakeMapSize()));
  afterEach(() => restoreSize());

  it('mostra os mesmos destinos na lista e no mapa', async () => {
    const { fixture, store, el } = await create();
    const total = catalogJson.attractions.length;
    expect(cards(el)).toBe(total);
    expect(markers(el)).toBe(total);
    expect(el.querySelector('.me-toolbar__count')?.textContent).toContain(`${total} destinos`);

    store.setQuery('parque nacional');
    fixture.detectChanges();
    await fixture.whenStable();
    const nationalParks = catalogJson.attractions.filter((a) => a.name.startsWith('Parque Nacional')).length;
    expect(nationalParks).toBeGreaterThan(1);
    expect(cards(el)).toBe(nationalParks);
    expect(markers(el)).toBe(nationalParks);
  });

  it('mostra estado de nenhum resultado e permite limpar filtros', async () => {
    const { fixture, store, el } = await create();
    store.setQuery('zzz');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cards(el)).toBe(0);
    expect(markers(el)).toBe(0);
    expect(el.querySelector('me-empty-state')?.textContent).toContain('Nenhum destino encontrado');

    (el.querySelector('.me-results__clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cards(el)).toBe(catalogJson.attractions.length);
  });

  it('selecionar na lista marca o card e abre o popup do marcador', async () => {
    const { fixture, el } = await create();
    (el.querySelector('.me-card__title') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelectorAll('.me-card--selected').length).toBe(1);
    expect(el.querySelectorAll('.me-marker--selected').length).toBe(1);
    expect(el.querySelector('.leaflet-popup')).toBeTruthy();
  });

  it('marcadores trazem ícone da categoria (não só cor)', async () => {
    const { el } = await create();
    // Em zoom de estado alguns destinos ficam agrupados; os marcadores soltos devem ter ícone, e os grupos, contagem.
    const icons = el.querySelectorAll('.me-marker svg').length;
    const clustered = [...el.querySelectorAll('.me-cluster span')].reduce((n, c) => n + Number(c.textContent), 0);
    expect(icons + clustered).toBe(catalogJson.attractions.length);
    expect(el.querySelectorAll('.me-marker:not(:has(svg))').length).toBe(0);
  });
});
