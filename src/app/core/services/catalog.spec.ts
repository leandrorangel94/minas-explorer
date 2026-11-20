import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import catalogJson from '../../../../public/data/catalog.json';
import categoriesJson from '../../../../public/data/categories.json';
import municipalitiesJson from '../../../../public/data/municipalities.json';
import { Category } from '../models/catalog.models';
import { Municipality } from '../models/geo.models';
import { attractionsOfCity, findAttraction, findCityBySlug } from '../utils/catalog.utils';
import { Catalog, CatalogService } from './catalog.service';

const catalog = catalogJson as unknown as Catalog;
const categories = categoriesJson as Category[];
const municipalities = municipalitiesJson as Municipality[];

describe('Catálogo (dados)', () => {
  it('tem cidades e atrações', () => {
    expect(catalog.cities.length).toBeGreaterThan(0);
    expect(catalog.attractions.length).toBeGreaterThan(0);
  });

  it('cada cidade corresponde a um município IBGE com mesmo nome e região', () => {
    for (const c of catalog.cities) {
      const m = municipalities.find((x) => x.id === c.id);
      expect(m, c.name).toBeTruthy();
      expect(m?.name).toBe(c.name);
      expect(m?.regionId).toBe(c.regionId);
    }
  });

  it('cada atração aponta para cidade e categoria existentes', () => {
    const cityIds = new Set(catalog.cities.map((c) => c.id));
    const categoryIds = new Set(categories.map((c) => c.id));
    for (const a of catalog.attractions) {
      expect(cityIds.has(a.cityId), a.name).toBe(true);
      expect(categoryIds.has(a.categoryId), a.name).toBe(true);
    }
  });

  it('todo registro tem fonte das coordenadas e data de verificação', () => {
    for (const e of [...catalog.cities, ...catalog.attractions]) {
      expect(e.coordinatesSource.url).toMatch(/^https:\/\//);
      expect(e.lastVerifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.sources.length).toBeGreaterThan(0);
    }
  });

  it('imagens, quando existem, trazem procedência completa', () => {
    for (const a of catalog.attractions)
      for (const img of a.images) {
        expect(img.author && img.license && img.sourceUrl && img.attribution, a.name).toBeTruthy();
      }
  });

  it('ids e slugs são únicos', () => {
    expect(new Set(catalog.cities.map((c) => c.id)).size).toBe(catalog.cities.length);
    expect(new Set(catalog.cities.map((c) => c.slug)).size).toBe(catalog.cities.length);
    expect(new Set(catalog.attractions.map((a) => a.id)).size).toBe(catalog.attractions.length);
  });
});

describe('catalog.utils', () => {
  it('encontra cidade, atração e atrações da cidade', () => {
    const city = findCityBySlug(catalog.cities, 'ouro-preto');
    expect(city?.name).toBe('Ouro Preto');
    expect(findCityBySlug(catalog.cities, 'nao-existe')).toBeUndefined();

    const list = attractionsOfCity(catalog.attractions, city!.id);
    expect(list.length).toBeGreaterThan(0);
    expect(findAttraction(catalog.attractions, city!.id, list[0].slug)).toBe(list[0]);
    expect(findAttraction(catalog.attractions, city!.id, 'nao-existe')).toBeUndefined();
  });
});

describe('CatalogService', () => {
  it('lê catalog.json e categories.json por URL relativa, com cache', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(CatalogService);
    const http = TestBed.inject(HttpTestingController);

    let cities = 0;
    service.cities$.subscribe((c) => (cities = c.length));
    service.attractions$.subscribe();
    http.expectOne('data/catalog.json').flush(catalog); // uma só requisição apesar de dois assinantes
    expect(cities).toBe(catalog.cities.length);

    let cats = 0;
    service.categories$.subscribe((c) => (cats = c.length));
    http.expectOne('data/categories.json').flush(categories);
    expect(cats).toBe(categories.length);
    http.verify();
  });
});
