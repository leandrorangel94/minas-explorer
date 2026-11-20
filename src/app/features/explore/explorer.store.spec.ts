import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import catalogJson from '../../../../public/data/catalog.json';
import categoriesJson from '../../../../public/data/categories.json';
import regionsJson from '../../../../public/data/regions.json';
import { ExplorerStore } from './explorer.store';

export function setupStore(opts: { fail?: boolean } = {}) {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const store = TestBed.inject(ExplorerStore);
  const http = TestBed.inject(HttpTestingController);
  const respond = () => {
    for (const [url, body] of [
      ['data/catalog.json', catalogJson],
      ['data/categories.json', categoriesJson],
      ['data/regions.json', regionsJson],
    ] as const) {
      const req = http.expectOne(url);
      if (opts.fail && url === 'data/catalog.json') req.flush('x', { status: 500, statusText: 'err' });
      else req.flush(body);
    }
    TestBed.tick();
  };
  return { store, respond };
}

describe('ExplorerStore', () => {
  it('começa carregando e passa a pronto com todos os destinos', () => {
    const { store, respond } = setupStore();
    expect(store.status()).toBe('loading');
    respond();
    expect(store.status()).toBe('ready');
    expect(store.results().length).toBe(catalogJson.attractions.length);
    expect(store.filtersActive()).toBe(false);
  });

  it('sinaliza erro quando o catálogo falha', () => {
    const { store, respond } = setupStore({ fail: true });
    respond();
    expect(store.status()).toBe('error');
    expect(store.results()).toEqual([]);
  });

  it('busca por texto, categoria e região alteram os resultados', () => {
    const { store, respond } = setupStore();
    respond();

    store.setQuery('ouro preto');
    expect(store.results().map((i) => i.attraction.slug)).toEqual(['museu-da-inconfidencia']);

    store.clearFilters();
    store.toggleCategory('park');
    expect(store.results().every((i) => i.attraction.categoryId === 'park')).toBe(true);
    expect(store.results().length).toBe(2);
    expect(store.activeFilterCount()).toBe(1);

    store.toggleCategory('park');
    expect(store.filtersActive()).toBe(false);

    const bh = store.results().find((i) => i.city.slug === 'belo-horizonte')!;
    store.setRegion(bh.city.regionId);
    expect(store.results().every((i) => i.city.regionId === bh.city.regionId)).toBe(true);
  });

  it('sem resultados devolve lista vazia', () => {
    const { store, respond } = setupStore();
    respond();
    store.setQuery('xyz inexistente');
    expect(store.results()).toEqual([]);
  });

  it('descarta a seleção quando o item some dos resultados', () => {
    const { store, respond } = setupStore();
    respond();
    const museum = store.results().find((i) => i.attraction.slug === 'museu-da-inconfidencia')!;
    store.select(museum.attraction.id);
    expect(store.selected()?.attraction.id).toBe(museum.attraction.id);

    store.setQuery('tabuleiro');
    expect(store.selectedId()).toBeNull();
  });

  it('só oferece categorias e regiões que existem no catálogo', () => {
    const { store, respond } = setupStore();
    respond();
    const usedCategories = new Set(catalogJson.attractions.map((a) => a.categoryId));
    expect(store.categories().map((c) => c.id).sort()).toEqual([...usedCategories].sort());
    expect(store.categories().length).toBeLessThan(categoriesJson.length);
    expect(store.regions().length).toBeLessThan(regionsJson.length);
  });
});
