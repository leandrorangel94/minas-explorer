import { Attraction, City } from '../models/catalog.models';

export interface AttractionFilters {
  readonly query: string;
  readonly categoryIds: readonly string[];
  readonly regionId: string | null;
}

export const NO_FILTERS: AttractionFilters = { query: '', categoryIds: [], regionId: null };

/** Minúsculas, sem acentos e sem espaços nas pontas ("Capitólio" ≡ "capitolio"). */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function hasActiveFilters(f: AttractionFilters): boolean {
  return normalizeText(f.query).length > 0 || f.categoryIds.length > 0 || f.regionId !== null;
}

/**
 * Filtra atrações. A busca exige que TODAS as palavras apareçam no nome da atração,
 * no nome da cidade ou nas tags; categorias combinam por "ou"; região restringe pela cidade.
 */
export function filterAttractions(
  attractions: readonly Attraction[],
  cityById: ReadonlyMap<string, City>,
  filters: AttractionFilters,
): Attraction[] {
  const tokens = normalizeText(filters.query).split(/\s+/).filter(Boolean);
  return attractions.filter((a) => {
    const city = cityById.get(a.cityId);
    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(a.categoryId)) return false;
    if (filters.regionId !== null && city?.regionId !== filters.regionId) return false;
    if (tokens.length === 0) return true;
    const haystack = normalizeText([a.name, city?.name ?? '', ...a.tags].join(' '));
    return tokens.every((t) => haystack.includes(t));
  });
}
