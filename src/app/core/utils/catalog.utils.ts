import { Attraction, City } from '../models/catalog.models';

/** Funções puras sobre o catálogo (fáceis de testar). */

export function findCityBySlug(cities: readonly City[], slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}

export function findAttraction(
  attractions: readonly Attraction[],
  cityId: string,
  slug: string,
): Attraction | undefined {
  return attractions.find((a) => a.cityId === cityId && a.slug === slug);
}

export function attractionsOfCity(attractions: readonly Attraction[], cityId: string): Attraction[] {
  return attractions.filter((a) => a.cityId === cityId);
}
