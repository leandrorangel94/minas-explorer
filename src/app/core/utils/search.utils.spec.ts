import { Attraction, City } from '../models/catalog.models';
import { filterAttractions, hasActiveFilters, NO_FILTERS, normalizeText } from './search.utils';

const src = { name: 'x', url: 'https://x.test' };
const city = (id: string, name: string, regionId: string): City => ({
  id, name, slug: id, regionId, description: 'd', coordinates: { latitude: -19, longitude: -44 },
  coordinatesSource: src, sources: [src], lastVerifiedAt: '2026-01-01',
});
const attr = (id: string, name: string, cityId: string, categoryId: string, tags: string[] = []): Attraction => ({
  id, name, slug: id, cityId, categoryId, description: 'd', coordinates: { latitude: -19, longitude: -44 },
  coordinatesSource: src, images: [], tags, featured: false, sources: [src], lastVerifiedAt: '2026-01-01',
});

const cities = new Map([city('c1', 'Capitólio', 'r1'), city('c2', 'Ouro Preto', 'r2')].map((c) => [c.id, c]));
const list = [
  attr('a1', 'Cânion de Furnas', 'c1', 'water', ['natureza']),
  attr('a2', 'Museu da Inconfidência', 'c2', 'museum', ['história']),
  attr('a3', 'Igreja de São Francisco', 'c2', 'church', ['barroco']),
];
const ids = (r: Attraction[]) => r.map((a) => a.id);

describe('search.utils', () => {
  it('normaliza acentos e caixa', () => {
    expect(normalizeText('  Capitólio ')).toBe('capitolio');
  });

  it('sem filtros devolve tudo', () => {
    expect(ids(filterAttractions(list, cities, NO_FILTERS))).toEqual(['a1', 'a2', 'a3']);
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
  });

  it('busca por atração, cidade e tag, ignorando acentos', () => {
    expect(ids(filterAttractions(list, cities, { ...NO_FILTERS, query: 'canion' }))).toEqual(['a1']);
    expect(ids(filterAttractions(list, cities, { ...NO_FILTERS, query: 'CAPITOLIO' }))).toEqual(['a1']);
    expect(ids(filterAttractions(list, cities, { ...NO_FILTERS, query: 'ouro preto' }))).toEqual(['a2', 'a3']);
    expect(ids(filterAttractions(list, cities, { ...NO_FILTERS, query: 'historia' }))).toEqual(['a2']);
  });

  it('exige todas as palavras da busca', () => {
    expect(ids(filterAttractions(list, cities, { ...NO_FILTERS, query: 'ouro museu' }))).toEqual(['a2']);
    expect(filterAttractions(list, cities, { ...NO_FILTERS, query: 'ouro canion' })).toEqual([]);
  });

  it('categorias combinam por "ou" e região restringe pela cidade', () => {
    expect(ids(filterAttractions(list, cities, { ...NO_FILTERS, categoryIds: ['water', 'church'] }))).toEqual(['a1', 'a3']);
    expect(ids(filterAttractions(list, cities, { ...NO_FILTERS, regionId: 'r2' }))).toEqual(['a2', 'a3']);
    expect(ids(filterAttractions(list, cities, { query: 'museu', categoryIds: ['museum'], regionId: 'r2' }))).toEqual(['a2']);
    expect(filterAttractions(list, cities, { query: '', categoryIds: ['museum'], regionId: 'r1' })).toEqual([]);
  });

  it('detecta filtros ativos', () => {
    expect(hasActiveFilters({ ...NO_FILTERS, query: ' x ' })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, query: '   ' })).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, regionId: 'r1' })).toBe(true);
  });
});
