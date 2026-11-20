import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { FAVORITES_STORAGE_KEY, FavoritesService, parseFavorites } from './favorites.service';

function setup(win?: Partial<Window> | null) {
  TestBed.resetTestingModule();
  if (win !== undefined) {
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: win } }] });
  }
  return TestBed.inject(FavoritesService);
}

describe('FavoritesService (LocalStorage real do jsdom)', () => {
  beforeEach(() => localStorage.clear());

  it('começa vazio, alterna, remove e limpa', () => {
    const s = setup();
    expect(s.count()).toBe(0);
    s.toggle('attraction', 'a1');
    s.toggle('city', 'c1');
    expect(s.isFavorite('attraction', 'a1')).toBe(true);
    expect(s.isFavorite('city', 'a1')).toBe(false); // tipos distintos não colidem
    expect(s.count()).toBe(2);
    s.toggle('attraction', 'a1');
    expect(s.isFavorite('attraction', 'a1')).toBe(false);
    s.clear();
    expect(s.count()).toBe(0);
  });

  it('persiste e restaura após "recarregar" (novo serviço)', () => {
    setup().toggle('attraction', 'a1');
    const again = setup();
    expect(again.isFavorite('attraction', 'a1')).toBe(true);
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual({ version: 1, items: [{ kind: 'attraction', id: 'a1' }] });
  });

  it('ignora JSON corrompido ou fora do formato, sem lançar', () => {
    for (const bad of ['{não é json', '[]', '{"items":"x"}', 'null', '{"items":[1,null,{"kind":"x","id":"a"},{"kind":"city"},{"kind":"city","id":""}]}']) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, bad);
      expect(setup().count()).toBe(0);
    }
  });

  it('descarta itens inválidos e duplicados, mantendo os válidos', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ items: [{ kind: 'city', id: 'c1' }, { kind: 'city', id: 'c1' }, { kind: 'nope', id: 'z' }, { kind: 'attraction', id: 'a1' }] }));
    expect(setup().items()).toEqual([{ kind: 'city', id: 'c1' }, { kind: 'attraction', id: 'a1' }]);
  });

  it('sincroniza quando outra aba altera os favoritos', () => {
    const s = setup();
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 1, items: [{ kind: 'city', id: 'c9' }] }));
    window.dispatchEvent(new StorageEvent('storage', { key: FAVORITES_STORAGE_KEY }));
    expect(s.isFavorite('city', 'c9')).toBe(true);
  });
});

describe('FavoritesService (LocalStorage indisponível)', () => {
  const blocked = { get localStorage(): Storage { throw new DOMException('blocked', 'SecurityError'); }, addEventListener() {} };

  it('continua funcionando em memória e avisa que não persiste', () => {
    const s = setup(blocked as unknown as Partial<Window>);
    expect(s.persistent()).toBe(false);
    s.toggle('attraction', 'a1');
    expect(s.isFavorite('attraction', 'a1')).toBe(true);
    s.toggle('attraction', 'a1');
    expect(s.count()).toBe(0);
  });

  it('sem window (defaultView nulo) também não quebra', () => {
    const s = setup(null);
    expect(s.persistent()).toBe(false);
    s.toggle('city', 'c1');
    expect(s.count()).toBe(1);
  });

  it('cota cheia ao salvar: mantém em memória e marca como não persistente', () => {
    const store = { getItem: () => null, removeItem() {}, setItem(k: string) { if (!k.endsWith(':probe')) throw new DOMException('full', 'QuotaExceededError'); } };
    const s = setup({ localStorage: store, addEventListener() {} } as unknown as Partial<Window>);
    expect(s.persistent()).toBe(true);
    s.toggle('attraction', 'a1');
    expect(s.isFavorite('attraction', 'a1')).toBe(true);
    expect(s.persistent()).toBe(false);
  });
});

describe('parseFavorites', () => {
  it('trata null e vazio', () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites('')).toEqual([]);
  });
});
