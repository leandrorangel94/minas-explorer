import { TestBed } from '@angular/core/testing';
import { fakeMapSize, mapDestinationCount } from '../../testing/leaflet-test-utils';
import { MinasMap } from './minas-map';

describe('MinasMap', () => {
  let restoreSize: () => void;
  beforeEach(() => (restoreSize = fakeMapSize()));
  afterEach(() => restoreSize());

  async function create() {
    const fixture = TestBed.createComponent(MinasMap);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('creates the Leaflet map with OpenStreetMap attribution', async () => {
    const fixture = await create();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.leaflet-container')).toBeTruthy();
    expect(el.querySelector('.leaflet-control-attribution')?.textContent).toContain('OpenStreetMap');
    expect(el.querySelector('.leaflet-control-zoom')).toBeTruthy();
  });

  it('renders and updates markers when points change', async () => {
    const fixture = await create();
    const el = fixture.nativeElement as HTMLElement;
    // Coordenadas arbitrárias, usadas só neste teste (não são dados do catálogo).
    fixture.componentRef.setInput('points', [
      { id: 'a', name: 'A', latitude: -19, longitude: -44 },
      { id: 'b', name: 'B', latitude: -20, longitude: -45 },
    ]);
    await fixture.whenStable();
    expect(mapDestinationCount(el)).toBe(2);

    fixture.componentRef.setInput('points', [{ id: 'a', name: 'A', latitude: -19, longitude: -44 }]);
    await fixture.whenStable();
    expect(mapDestinationCount(el)).toBe(1);
  });

  it('draws and clears the state boundary', async () => {
    const fixture = await create();
    const el = fixture.nativeElement as HTMLElement;
    const square = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature', properties: {},
        geometry: { type: 'Polygon', coordinates: [[[-45, -19], [-44, -19], [-44, -18], [-45, -18], [-45, -19]]] },
      }],
    };
    fixture.componentRef.setInput('boundary', square);
    await fixture.whenStable();
    expect(el.querySelectorAll('path.leaflet-interactive, .leaflet-overlay-pane path').length).toBe(1);

    fixture.componentRef.setInput('boundary', null);
    await fixture.whenStable();
    expect(el.querySelectorAll('.leaflet-overlay-pane path').length).toBe(0);
  });

  it('controles e rótulos estão em português', async () => {
    const fixture = await create();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.leaflet-control-zoom-in')?.getAttribute('aria-label')).toBe('Aproximar');
    expect(el.querySelector('.leaflet-control-zoom-out')?.getAttribute('aria-label')).toBe('Afastar');
    expect(el.querySelector('.me-map__reset')?.getAttribute('aria-label')).toBe('Voltar ao enquadramento de Minas Gerais');
  });

  it('marcadores e grupos têm nome acessível', async () => {
    const fixture = await create();
    const el = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('points', [
      { id: 'a', name: 'Lugar A', subtitle: 'Cidade X', categoryName: 'Parques', icon: 'trees', latitude: -19, longitude: -44 },
      { id: 'b', name: 'Lugar B', subtitle: 'Cidade Y', categoryName: 'Museus', icon: 'building-2', latitude: -19.0001, longitude: -44.0001 },
    ]);
    await fixture.whenStable();
    // Muito próximos: viram um grupo, cujo nome vem de texto visualmente oculto.
    const cluster = el.querySelector('.me-cluster')!;
    expect(cluster.getAttribute('data-count')).toBe('2');
    expect(cluster.querySelector('.me-visually-hidden')?.textContent).toContain('2 destinos agrupados');
    expect(cluster.querySelector('[aria-hidden="true"]')?.textContent).toBe('2');

    fixture.componentRef.setInput('points', [
      { id: 'a', name: 'Lugar A', subtitle: 'Cidade X', categoryName: 'Parques', icon: 'trees', latitude: -19, longitude: -44 },
    ]);
    await fixture.whenStable();
    expect(el.querySelector('.leaflet-marker-icon')?.getAttribute('aria-label')).toBe('Lugar A, Cidade X, Parques');
  });

  it('removes the map on destroy without errors', async () => {
    const fixture = await create();
    const container = (fixture.nativeElement as HTMLElement).querySelector('.me-map__canvas') as HTMLElement;
    expect(() => fixture.destroy()).not.toThrow();
    expect(container.querySelector('.leaflet-pane')).toBeNull(); // painéis removidos por map.remove()
  });
});
