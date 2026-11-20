import { Coordinates } from '../models/catalog.models';

/**
 * Links para navegação externa (Google Maps). Usam só coordenadas já verificadas do catálogo;
 * nenhum dado do usuário é enviado. Abrir sempre com `target="_blank" rel="noopener noreferrer"`.
 */

const fmt = (n: number) => n.toFixed(6);

/** Abre o ponto no Google Maps. */
export function googleMapsPlaceUrl(c: Coordinates): string {
  return `https://www.google.com/maps/search/?api=1&query=${fmt(c.latitude)},${fmt(c.longitude)}`;
}

/** Abre o Google Maps com rota até o ponto (a origem é escolhida pelo usuário no próprio Google Maps). */
export function googleMapsDirectionsUrl(c: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${fmt(c.latitude)},${fmt(c.longitude)}`;
}
