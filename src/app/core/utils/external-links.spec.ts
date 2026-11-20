import { formatIsoDate, monthsSince } from './format';
import { googleMapsDirectionsUrl, googleMapsPlaceUrl } from './external-links';

describe('external-links', () => {
  const c = { latitude: -20.385277, longitude: -43.503611 };

  it('monta URL do ponto e da rota só com coordenadas', () => {
    expect(googleMapsPlaceUrl(c)).toBe('https://www.google.com/maps/search/?api=1&query=-20.385277,-43.503611');
    expect(googleMapsDirectionsUrl(c)).toBe('https://www.google.com/maps/dir/?api=1&destination=-20.385277,-43.503611');
  });
});

describe('format', () => {
  it('formata data ISO em pt-BR sem deslocar o dia', () => {
    expect(formatIsoDate('2026-11-20')).toBe('20/11/2026');
    expect(formatIsoDate('2026-01-01')).toBe('01/01/2026');
    expect(formatIsoDate('lixo')).toBe('lixo');
  });

  it('calcula meses desde uma data', () => {
    const now = new Date(Date.UTC(2026, 10, 20));
    expect(monthsSince('2026-11-20', now)).toBe(0);
    expect(monthsSince('2026-11-21', now)).toBe(-1);
    expect(monthsSince('2025-11-20', now)).toBe(12);
    expect(monthsSince('2025-11-21', now)).toBe(11);
  });
});
