import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import catalogJson from '../../../public/data/catalog.json';
import categoriesJson from '../../../public/data/categories.json';
import regionsJson from '../../../public/data/regions.json';
import { AttractionPage } from './attractions/attraction-page';
import { CityPage } from './cities/city-page';
import { ExplorerStore } from './explore/explorer.store';

async function create<T>(component: Type<T>, inputs: Record<string, string>, opts: { respond?: boolean } = {}) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const store = TestBed.inject(ExplorerStore);
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(component);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  if (opts.respond !== false) {
    http.expectOne('data/catalog.json').flush(catalogJson);
    http.expectOne('data/categories.json').flush(categoriesJson);
    http.expectOne('data/regions.json').flush(regionsJson);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, store, el: fixture.nativeElement as HTMLElement };
}

describe('CityPage', () => {
  it('mostra a cidade, a região, as atrações com link e as fontes', async () => {
    const { el } = await create(CityPage, { citySlug: 'ouro-preto' });
    expect(el.querySelector('h1')?.textContent).toContain('Ouro Preto');
    const regionId = catalogJson.cities.find((c) => c.slug === 'ouro-preto')!.regionId;
    const regionName = regionsJson.find((r) => r.id === regionId)!.name;
    expect(el.querySelector('.me-detail__eyebrow')?.textContent).toContain(regionName);
    expect(el.querySelectorAll('me-destination-card').length).toBe(1);
    expect(el.querySelector('.me-detail__more')?.getAttribute('href')).toBe('/cidades/ouro-preto/museu-da-inconfidencia');
    expect(el.querySelector('.me-detail__sources a')?.getAttribute('href')).toMatch(/^https:\/\/www\.wikidata\.org/);
  });

  it('abre o Google Maps em nova aba, com rel seguro e só coordenadas', async () => {
    const { el } = await create(CityPage, { citySlug: 'ouro-preto' });
    const link = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('Google Maps')) as HTMLAnchorElement;
    expect(link.href).toContain('https://www.google.com/maps/search/?api=1&query=-20.3');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
  });

  it('mostra galeria vazia honesta quando não há foto', async () => {
    const { el } = await create(CityPage, { citySlug: 'ouro-preto' });
    expect(el.querySelector('.me-gallery__empty')?.textContent).toContain('direitos de uso verificados');
  });

  it('cidade inexistente mostra "não encontrada" com volta ao mapa', async () => {
    const { el } = await create(CityPage, { citySlug: 'nao-existe' });
    expect(el.querySelector('me-empty-state')?.textContent).toContain('Cidade não encontrada');
    expect(el.querySelector('h1')).toBeNull();
  });

  it('define o título da página', async () => {
    await create(CityPage, { citySlug: 'diamantina' });
    expect(TestBed.inject(Title).getTitle()).toBe('Diamantina – Minas Explorer');
  });

  it('"Ver no mapa" filtra pela cidade e navega para a home', async () => {
    const { el, store } = await create(CityPage, { citySlug: 'ouro-preto' });
    const nav = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(store.query()).toBe('Ouro Preto');
    expect(nav).toHaveBeenCalledWith('/');
  });
});

describe('AttractionPage', () => {
  const inputs = { citySlug: 'conceicao-do-mato-dentro', attractionSlug: 'cachoeira-do-tabuleiro' };

  it('mostra atração, categoria, cidade, breadcrumbs e fontes', async () => {
    const { el } = await create(AttractionPage, inputs);
    expect(el.querySelector('h1')?.textContent).toContain('Cachoeira do Tabuleiro');
    expect(el.querySelector('.me-detail__category')?.textContent).toContain('Cachoeiras e poços');
    expect(el.querySelector('.me-detail__city a')?.getAttribute('href')).toBe('/cidades/conceicao-do-mato-dentro');
    expect(el.querySelector('me-breadcrumbs [aria-current="page"]')?.textContent).toContain('Cachoeira do Tabuleiro');
    expect(el.querySelector('.me-detail__sources')?.textContent).toContain('Wikidata');
  });

  it('"Como chegar" usa rota do Google Maps com as coordenadas do catálogo', async () => {
    const { el } = await create(AttractionPage, inputs);
    const link = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('Como chegar')) as HTMLAnchorElement;
    expect(link.href).toContain('https://www.google.com/maps/dir/?api=1&destination=-19.088056,-43.551667');
    expect(link.rel).toBe('noopener noreferrer');
  });

  it('sem informações práticas verificadas, não inventa nada', async () => {
    const { el } = await create(AttractionPage, inputs);
    expect(el.querySelector('me-practical-info')?.textContent).toContain('ainda não verificadas');
    expect(el.querySelector('.me-pinfo')).toBeNull();
  });

  it('atração inexistente (ou cidade errada) mostra "não encontrada"', async () => {
    const a = await create(AttractionPage, { citySlug: 'ouro-preto', attractionSlug: 'cachoeira-do-tabuleiro' });
    expect(a.el.querySelector('me-empty-state')?.textContent).toContain('Atração não encontrada');
  });

  it('"Ver no mapa" seleciona a atração e navega para a home', async () => {
    const { el, store } = await create(AttractionPage, inputs);
    const nav = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(store.selectedId()).toBe('3117504-cachoeira-do-tabuleiro');
    expect(nav).toHaveBeenCalledWith('/');
  });

  it('enquanto carrega mostra estado de carregamento', async () => {
    TestBed.configureTestingModule({
      imports: [AttractionPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AttractionPage);
    fixture.componentRef.setInput('citySlug', 'x');
    fixture.componentRef.setInput('attractionSlug', 'y');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Carregando');
  });
});
