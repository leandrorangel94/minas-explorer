import { TestBed } from '@angular/core/testing';
import { MinasMap } from './minas-map';

describe('MinasMap', () => {
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
    expect(el.querySelectorAll('.leaflet-marker-icon').length).toBe(2);

    fixture.componentRef.setInput('points', [{ id: 'a', name: 'A', latitude: -19, longitude: -44 }]);
    await fixture.whenStable();
    expect(el.querySelectorAll('.leaflet-marker-icon').length).toBe(1);
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

  it('removes the map on destroy without errors', async () => {
    const fixture = await create();
    const container = (fixture.nativeElement as HTMLElement).querySelector('.me-map__canvas') as HTMLElement;
    expect(() => fixture.destroy()).not.toThrow();
    expect(container.querySelector('.leaflet-pane')).toBeNull(); // painéis removidos por map.remove()
  });
});
