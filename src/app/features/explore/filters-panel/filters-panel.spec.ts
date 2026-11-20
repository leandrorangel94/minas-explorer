import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import catalogJson from '../../../../../public/data/catalog.json';
import categoriesJson from '../../../../../public/data/categories.json';
import regionsJson from '../../../../../public/data/regions.json';
import { ExplorerStore } from '../explorer.store';
import { FiltersPanel } from './filters-panel';

describe('FiltersPanel', () => {
  async function create() {
    TestBed.configureTestingModule({ imports: [FiltersPanel], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const store = TestBed.inject(ExplorerStore);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(FiltersPanel);
    fixture.detectChanges();
    http.expectOne('data/catalog.json').flush(catalogJson);
    http.expectOne('data/categories.json').flush(categoriesJson);
    http.expectOne('data/regions.json').flush(regionsJson);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, store, el: fixture.nativeElement as HTMLElement };
  }

  const chip = (el: HTMLElement, text: string) =>
    [...el.querySelectorAll('mat-chip-option')].find((c) => c.textContent?.includes(text)) as HTMLElement;

  it('um chip por categoria existente, com ícone', async () => {
    const { el, store } = await create();
    expect(el.querySelectorAll('mat-chip-option').length).toBe(store.categories().length);
    expect(el.querySelectorAll('mat-chip-option me-icon svg').length).toBe(store.categories().length);
  });

  it('clicar no chip alterna a categoria e "Limpar filtros" desmarca sem reativar', async () => {
    const { fixture, el, store } = await create();
    (chip(el, 'Parques').querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.categoryIds()).toEqual(['park']);
    expect(chip(el, 'Parques').classList.contains('mdc-evolution-chip--selected')).toBe(true);

    store.clearFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(store.categoryIds()).toEqual([]);
    expect(chip(el, 'Parques').classList.contains('mdc-evolution-chip--selected')).toBe(false);
  });
});
