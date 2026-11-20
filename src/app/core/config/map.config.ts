/** Configuração do mapa. O provedor de tiles fica isolado aqui para permitir troca futura. */

export interface TileProvider {
  readonly name: string;
  readonly urlTemplate: string;
  readonly attribution: string;
  readonly minZoom: number;
  readonly maxZoom: number;
}

/**
 * Tiles públicos do OpenStreetMap (sem SLA; ver https://operations.osmfoundation.org/policies/tiles/).
 * Se o tráfego crescer, trocar por um provedor apropriado alterando apenas este objeto.
 */
export const TILE_PROVIDER: TileProvider = {
  name: 'OpenStreetMap',
  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  minZoom: 5,
  maxZoom: 19,
};

/**
 * Retângulo de enquadramento de Minas Gerais [[sul, oeste], [norte, leste]].
 * Derivado do retângulo envolvente do contorno oficial do IBGE (malha estadual, qualidade
 * intermediária: lat -22.9228..-14.2467, lng -51.0461..-39.8568), arredondado para fora.
 * Serve só como viewport inicial; o contorno desenhado vem de `data/geo/minas-gerais.geo.json`.
 */
export const MINAS_VIEW_BOUNDS: [[number, number], [number, number]] = [
  [-22.93, -51.05],
  [-14.24, -39.85],
];

/** Folga (fração do retângulo de MG) permitida ao arrastar o mapa para fora do estado. */
export const FOCUS_PADDING = 0.12;

/** Ajuste do mapa aos resultados filtrados. */
export const RESULTS_FIT_OPTIONS = { padding: [48, 48] as [number, number], maxZoom: 10, animate: true };

/** Pane da máscara que esmaece o entorno de MG (fica entre tiles e contorno). */
export const MASK_PANE = 'me-mask';

/** Máscara fora de MG; a cor vem de `--me-map-mask` (muda com o tema). */
export const MASK_STYLE = {
  stroke: false,
  fillOpacity: 0.72,
  interactive: false,
} as const;

/** Estilo do contorno estadual: apenas visual; cores vêm de `--me-map-boundary*` (mudam com o tema). */
export const BOUNDARY_STYLE = {
  weight: 2.5,
  opacity: 0.9,
  fillOpacity: 0.08,
  interactive: false,
} as const;

/** Centro e zoom usados quando o container ainda não tem dimensões. */
export const MINAS_FALLBACK_VIEW = { center: [-18.5, -44.6] as [number, number], zoom: 6 };
