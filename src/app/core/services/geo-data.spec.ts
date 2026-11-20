import regionsJson from '../../../../public/data/regions.json';
import municipalitiesJson from '../../../../public/data/municipalities.json';
import boundaryJson from '../../../../public/data/geo/minas-gerais.geo.json';
import { Municipality, Region } from '../models/geo.models';

const regions = regionsJson as Region[];
const municipalities = municipalitiesJson as Municipality[];

describe('Dados geográficos (IBGE)', () => {
  it('tem 13 regiões e 853 municípios', () => {
    expect(regions.length).toBe(13);
    expect(municipalities.length).toBe(853);
  });

  it('não repete ids nem slugs', () => {
    expect(new Set(regions.map((r) => r.id)).size).toBe(regions.length);
    expect(new Set(municipalities.map((m) => m.id)).size).toBe(municipalities.length);
    expect(new Set(municipalities.map((m) => m.slug)).size).toBe(municipalities.length);
  });

  it('mantém regiões e municípios consistentes entre si', () => {
    const regionIds = new Set(regions.map((r) => r.id));
    for (const m of municipalities) expect(regionIds.has(m.regionId)).toBe(true);

    for (const r of regions) {
      const expected = municipalities.filter((m) => m.regionId === r.id).map((m) => m.id).sort();
      expect([...r.municipalityIds].sort()).toEqual(expected);
    }
  });

  it('não contém coordenadas nos registros de município/região', () => {
    for (const item of [...regions, ...municipalities]) {
      expect(Object.keys(item)).not.toContain('latitude');
      expect(Object.keys(item)).not.toContain('longitude');
    }
  });

  it('contorno é um único polígono de MG dentro do retângulo esperado', () => {
    const geo = boundaryJson as unknown as { features: { properties: { codarea: string }; geometry: { type: string; coordinates: number[][][] } }[] };
    expect(geo.features.length).toBe(1);
    expect(geo.features[0].properties.codarea).toBe('31');
    expect(geo.features[0].geometry.type).toBe('Polygon');
    for (const [lng, lat] of geo.features[0].geometry.coordinates[0]) {
      expect(lat).toBeGreaterThan(-22.93);
      expect(lat).toBeLessThan(-14.24);
      expect(lng).toBeGreaterThan(-51.05);
      expect(lng).toBeLessThan(-39.85);
    }
  });
});
