import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import catalogJson from '../../../../public/data/catalog.json';
import categoriesJson from '../../../../public/data/categories.json';
import regionsJson from '../../../../public/data/regions.json';
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
const markers = (el: HTMLElement) => el.querySelectorAll('.leaflet-marker-icon').length;

describe('HomePage: mapa e lista sincronizados', () => {
  it('mostra os mesmos destinos na lista e no mapa', async () => {
    const { fixture, store, el } = await create();
    const total = catalogJson.attractions.length;
    expect(cards(el)).toBe(total);
    expect(markers(el)).toBe(total);
    expect(el.querySelector('.me-toolbar__count')?.textContent).toContain(`${total} destinos`);

    store.setQuery('parque nacional');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cards(el)).toBe(2);
    expect(markers(el)).toBe(2);
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
    expect(el.querySelectorAll('.me-marker svg').length).toBe(catalogJson.attractions.length);
  });
});
