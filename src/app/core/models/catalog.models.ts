/** Modelos do catálogo turístico. Os dados vivem em `public/data` (JSON). */

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/** Fonte de uma informação (coordenadas, texto, dado prático). */
export interface SourceRef {
  readonly name: string;
  readonly url: string;
}

export interface CatalogImage {
  readonly url: string;
  readonly alt: string;
  readonly author?: string;
  readonly license?: string;
  readonly sourceUrl?: string;
  readonly attribution?: string;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  /** Nome do ícone Lucide (ex.: "waves"). */
  readonly icon: string;
  /** Cor semântica; nunca é a única forma de distinguir a categoria (há ícone e nome). */
  readonly color: string;
}

export interface City {
  /** Igual ao código IBGE do município (7 dígitos); deve existir em municipalities.json. */
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly regionId: string;
  readonly description: string;
  readonly coordinates: Coordinates;
  readonly coordinatesSource: SourceRef;
  readonly coverImage?: CatalogImage;
  readonly sources: readonly SourceRef[];
  readonly lastVerifiedAt: string;
}

export interface PracticalInfo {
  readonly openingHours?: string;
  readonly admission?: string;
  readonly bookingRequired?: boolean;
  readonly accessibility?: string;
  readonly trailDifficulty?: string;
  readonly warnings?: string;
  readonly source: SourceRef;
  readonly verifiedAt: string;
}

export interface Attraction {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly cityId: string;
  readonly categoryId: string;
  readonly description: string;
  readonly coordinates: Coordinates;
  readonly coordinatesSource: SourceRef;
  readonly images: readonly CatalogImage[];
  readonly tags: readonly string[];
  readonly featured: boolean;
  readonly practicalInfo?: PracticalInfo;
  readonly sources: readonly SourceRef[];
  readonly lastVerifiedAt: string;
}
