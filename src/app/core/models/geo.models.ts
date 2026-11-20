/** Região Geográfica Intermediária do IBGE (13 em Minas Gerais). */
export interface Region {
  /** Código IBGE (ex.: "3101"). */
  readonly id: string;
  readonly ibgeCode: number;
  readonly name: string;
  readonly slug: string;
  /** Códigos IBGE dos municípios da região. */
  readonly municipalityIds: readonly string[];
}

/** Índice de municípios de MG (853). Não é o catálogo turístico; não possui coordenadas. */
export interface Municipality {
  /** Código IBGE de 7 dígitos. */
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly regionId: string;
}
