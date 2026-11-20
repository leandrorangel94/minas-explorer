import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  output,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { FeatureCollection, Polygon } from 'geojson';
import * as L from 'leaflet';
import LeafletModule from 'leaflet';
import 'leaflet.markercluster';

/**
 * `import * as L` gera uma CÓPIA do módulo no bundle de produção, feita antes de o plugin se registrar,
 * então `L.markerClusterGroup` não existe nela. O import default é o próprio objeto do módulo
 * (que o plugin estende). Os testes (Vitest) não reproduzem isso: confira sempre no build de produção.
 */
const markerClusterGroup = (LeafletModule as unknown as typeof L).markerClusterGroup;
import {
  BOUNDARY_STYLE, FOCUS_PADDING, MASK_PANE, MASK_STYLE, MINAS_FALLBACK_VIEW, MINAS_VIEW_BOUNDS, RESULTS_FIT_OPTIONS,
  TILE_PROVIDER,
} from '../../core/config/map.config';
import { createIcon } from '../../core/utils/icons';
import { ThemeService } from '../../core/services/theme.service';
import { configureLeafletIcons } from '../../core/utils/leaflet-icons';
import { Icon } from '../../shared/components/icon/icon';

const prefersReducedMotion = (): boolean => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Dados de um município para o hover/popup da camada de divisas. */
export interface MunicipalityInfo {
  readonly name: string;
  readonly href?: string;
}

const MUNICIPALITY_PANE = 'me-municipios';

export interface MapPoint {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  /** Texto secundário do popup (ex.: cidade). */
  readonly subtitle?: string;
  /** Nome do ícone Lucide da categoria; sem ele usa o marcador padrão do Leaflet. */
  readonly icon?: string;
  readonly color?: string;
  /** Nome da categoria (texto acessível do marcador). */
  readonly categoryName?: string;
  /** Link da página de detalhes (já pronto para `href`, compatível com a estratégia de rotas). */
  readonly href?: string;
  /** Link da página do município (aparece como "Ver município" no popup). */
  readonly cityHref?: string;
  /** Miniatura exibida no popup (carregada só quando o popup abre). */
  readonly imageUrl?: string;
  readonly imageAlt?: string;
}

/**
 * Mapa Leaflet encapsulado. Toda a interação com o Leaflet fica nesta classe,
 * fora da zona do Angular, e a instância é destruída junto com o componente.
 * Visual minimalista: tiles dessaturados (CSS), área fora de MG esmaecida por uma máscara,
 * navegação limitada ao entorno do estado.
 */
@Component({
  selector: 'me-minas-map',
  imports: [
    MatButtonModule, MatTooltipModule, Icon,
  ],
  templateUrl: './minas-map.html',
  styleUrl: './minas-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinasMap {
  /** Divisas municipais (propriedade `id` = código IBGE). Destacam e mostram o nome ao passar o mouse. */
  readonly municipalities = input<FeatureCollection | null>(null);
  /** Nome e link (se o município tem página) por código IBGE. */
  readonly municipalityInfo = input<ReadonlyMap<string, MunicipalityInfo>>(new Map());
  readonly points = input<readonly MapPoint[]>([]);
  /** Contorno do estado (GeoJSON do IBGE): desenhado e usado para esmaecer o entorno. */
  readonly boundary = input<FeatureCollection | null>(null);
  readonly selectedId = input<string | null>(null);
  /** Quando verdadeiro, o mapa se ajusta aos pontos; senão, ao estado inteiro. */
  readonly fitToPoints = input(false);
  readonly pointSelected = output<string>();
  readonly selectionCleared = output<void>();

  private readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private readonly zone = inject(NgZone);
  private readonly theme = inject(ThemeService);

  private map?: L.Map;
  /** Agrupa marcadores próximos (ex.: Belo Horizonte, Ouro Preto e Mariana em zoom de estado). */
  private readonly markerLayer = markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 44,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 13,
    animate: false,
    iconCreateFunction: (cluster) => {
      const n = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="me-cluster" data-count="${n}"><span aria-hidden="true">${n}</span><span class="me-visually-hidden">${n} destinos agrupados. Ative para aproximar.</span></div>`,
        className: 'me-cluster-wrap',
        iconSize: [40, 40],
      });
    },
  });
  private readonly markers = new Map<string, L.Marker>();
  private readonly boundaryLayer = L.geoJSON(undefined, { style: () => this.boundaryStyle() });
  private maskLayer?: L.Polygon;
  private municipalityLayer?: L.GeoJSON;
  private clearMunicipalityHover: () => void = () => undefined;
  private resizeObserver?: ResizeObserver;

  constructor() {
    configureLeafletIcons();
    afterNextRender(() => this.zone.runOutsideAngular(() => this.initMap()));
    effect(() => {
      this.theme.effective(); // redesenha contorno e máscara com as cores do tema atual
      this.renderBoundary(this.boundary());
      this.renderMunicipalities(this.municipalities(), this.municipalityInfo());
    });
    effect(() => {
      const points = this.points();
      const fit = this.fitToPoints();
      this.renderMarkers(points);
      this.applyViewport(points, fit);
    });
    effect(() => this.applySelection(this.selectedId()));
    inject(DestroyRef).onDestroy(() => this.destroyMap());
  }

  protected resetView(): void {
    this.fitState();
  }

  private initMap(): void {
    const reduceMotion = prefersReducedMotion();
    const map = L.map(this.mapEl().nativeElement, {
      zoomControl: false, // adicionado abaixo, com rótulos em português
      zoomSnap: 1, // o markercluster agrupa por zoom inteiro: com zoom fracionado marcadores somem
      maxBoundsViscosity: 0.9,
      worldCopyJump: false,
      zoomAnimation: !reduceMotion,
      fadeAnimation: !reduceMotion,
      markerZoomAnimation: !reduceMotion,
    });
    L.control.zoom({ zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar' }).addTo(map);
    map.on('popupopen', (e) => {
      const thumb = e.popup.getElement()?.querySelector<HTMLImageElement>('img.me-popup-thumb[data-src]');
      if (thumb) {
        thumb.src = thumb.dataset['src']!;
        thumb.addEventListener('load', () => e.popup.update(), { once: true });
      }
      e.popup.getElement()?.querySelector('.leaflet-popup-close-button')?.setAttribute('aria-label', 'Fechar');
    });
    L.tileLayer(TILE_PROVIDER.urlTemplate, {
      attribution: TILE_PROVIDER.attribution,
      minZoom: TILE_PROVIDER.minZoom,
      maxZoom: TILE_PROVIDER.maxZoom,
    }).addTo(map);
    map.createPane(MASK_PANE).style.zIndex = '250'; // entre os tiles (200) e o contorno (400)
    map.getPane(MASK_PANE)!.style.pointerEvents = 'none';
    map.createPane(MUNICIPALITY_PANE).style.zIndex = '420'; // acima do contorno, abaixo dos marcadores (600)
    this.boundaryLayer.addTo(map);
    this.markerLayer.addTo(map);
    this.map = map;

    this.fitState();
    this.renderBoundary(this.boundary());
    this.renderMunicipalities(this.municipalities(), this.municipalityInfo());
    this.renderMarkers(this.points());
    this.applyViewport(this.points(), this.fitToPoints());
    this.applySelection(this.selectedId());

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.map?.invalidateSize();
        this.updateLimits();
      });
      this.resizeObserver.observe(this.mapEl().nativeElement);
    }
  }

  /** Enquadra Minas Gerais inteira e restringe a navegação ao entorno do estado. */
  private fitState(): void {
    const map = this.map;
    if (!map) return;
    map.invalidateSize();
    const size = map.getSize();
    if (size.x > 0 && size.y > 0) {
      map.fitBounds(MINAS_VIEW_BOUNDS, { animate: false });
      this.updateLimits();
    } else {
      map.setView(MINAS_FALLBACK_VIEW.center, MINAS_FALLBACK_VIEW.zoom);
    }
  }

  /** Limita pan/zoom ao entorno de Minas (o estado continua ocupando a maior parte da tela). */
  private updateLimits(): void {
    const map = this.map;
    if (!map || map.getSize().x === 0) return;
    const padded = L.latLngBounds(MINAS_VIEW_BOUNDS).pad(FOCUS_PADDING);
    map.setMaxBounds(padded);
    map.setMinZoom(Math.max(TILE_PROVIDER.minZoom, map.getBoundsZoom(padded, false)));
  }

  private applyViewport(points: readonly MapPoint[], fit: boolean): void {
    const map = this.map;
    if (!map) return;
    if (fit && points.length > 0) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number])), {
        ...RESULTS_FIT_OPTIONS,
        animate: RESULTS_FIT_OPTIONS.animate && !prefersReducedMotion(),
      });
    } else {
      this.fitState();
    }
  }

  private renderMarkers(points: readonly MapPoint[]): void {
    if (!this.map) return;
    this.markerLayer.clearLayers();
    this.markers.clear();
    for (const point of points) {
      const marker = L.marker([point.latitude, point.longitude], {
        title: point.name,
        alt: this.markerLabel(point),
        icon: point.icon ? this.categoryDivIcon(point, false) : new L.Icon.Default(),
        riseOnHover: true,
      })
        .bindPopup(this.popupContent(point), { closeButton: true, autoPan: true, offset: [0, -8] })
        .on('add', (e) => (e.target as L.Marker).getElement()?.setAttribute('aria-label', this.markerLabel(point)))
        .on('click', () => this.zone.run(() => this.pointSelected.emit(point.id)))
        .on('popupclose', () => {
          if (this.selectedId() === point.id) this.zone.run(() => this.selectionCleared.emit());
        })
        .addTo(this.markerLayer);
      this.markers.set(point.id, marker);
    }
  }

  private applySelection(selectedId: string | null): void {
    if (!this.map) return;
    for (const point of this.points()) {
      const marker = this.markers.get(point.id);
      if (marker && point.icon) marker.setIcon(this.categoryDivIcon(point, point.id === selectedId));
    }
    const marker = selectedId ? this.markers.get(selectedId) : undefined;
    if (marker) {
      marker.setZIndexOffset(1000);
      // Se o marcador estiver dentro de um grupo, aproxima o zoom até ele aparecer e então abre o popup.
      this.markerLayer.zoomToShowLayer(marker, () => {
        if (!marker.isPopupOpen()) marker.openPopup();
      });
    } else {
      this.map.closePopup();
    }
  }

  private markerLabel(point: MapPoint): string {
    return [point.name, point.subtitle, point.categoryName].filter(Boolean).join(', ');
  }

  private categoryDivIcon(point: MapPoint, selected: boolean): L.DivIcon {
    const size = selected ? 44 : 34;
    const el = document.createElement('div');
    el.className = `me-marker${selected ? ' me-marker--selected' : ''}`;
    el.style.setProperty('--me-marker-color', point.color ?? '#1f4d3a');
    el.appendChild(createIcon(point.icon, selected ? 22 : 18));
    return L.divIcon({ html: el, className: 'me-marker-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
  }

  /** Popup montado com nós de DOM (textContent), sem injetar HTML. */
  private popupContent(point: MapPoint): HTMLElement {
    const box = document.createElement('div');
    if (point.imageUrl) {
      const img = document.createElement('img');
      img.className = 'me-popup-thumb';
      img.alt = point.imageAlt ?? '';
      img.width = 240;
      img.height = 140;
      img.decoding = 'async';
      img.dataset['src'] = point.imageUrl; // src só é definido ao abrir o popup (evita baixar dezenas de miniaturas)
      img.addEventListener('error', () => img.remove(), { once: true });
      box.appendChild(img);
    }
    const title = document.createElement('strong');
    title.textContent = point.name;
    box.appendChild(title);
    for (const line of [point.subtitle, point.categoryName]) {
      if (!line) continue;
      const p = document.createElement('div');
      p.textContent = line;
      box.appendChild(p);
    }
    if (point.href || point.cityHref) {
      const links = document.createElement('div');
      links.className = 'me-popup-links';
      for (const [href, text] of [[point.href, 'Ver detalhes'], [point.cityHref, 'Ver município']] as const) {
        if (!href) continue;
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        a.className = 'me-popup-link';
        links.appendChild(a);
      }
      box.appendChild(links);
    }
    return box;
  }

  private renderBoundary(boundary: FeatureCollection | null): void {
    if (!this.map) return;
    this.boundaryLayer.clearLayers();
    this.maskLayer?.remove();
    this.maskLayer = undefined;
    if (!boundary) return;
    this.boundaryLayer.addData(boundary);

    // Máscara: retângulo "mundo" com um buraco no formato de Minas Gerais.
    const ring = (boundary.features[0]?.geometry as Polygon | undefined)?.coordinates[0];
    if (!ring) return;
    const world: L.LatLngTuple[] = [[-85, -180], [-85, 180], [85, 180], [85, -180]];
    const hole = ring.map(([lng, lat]) => [lat, lng] as L.LatLngTuple);
    this.maskLayer = L.polygon([world, hole], { ...MASK_STYLE, fillColor: this.cssVar('--me-map-mask', '#f4f1e8'), pane: MASK_PANE }).addTo(this.map);
  }

  /** Divisas municipais: linhas finas; no hover, realça a área e mostra o nome. */
  private renderMunicipalities(mesh: FeatureCollection | null, info: ReadonlyMap<string, MunicipalityInfo>): void {
    if (!this.map) return;
    this.clearMunicipalityHover();
    this.municipalityLayer?.remove();
    this.municipalityLayer = undefined;
    if (!mesh) return;
    const base = (): L.PathOptions => ({
      pane: MUNICIPALITY_PANE,
      color: this.cssVar('--me-map-boundary', '#1f4d3a'),
      weight: 0.7,
      opacity: 0.45,
      fillColor: this.cssVar('--me-map-boundary-fill', '#8fa98b'),
      fillOpacity: 0.001, // quase transparente, mas capta o mouse
    });
    const hover = (): L.PathOptions => ({ weight: 2, opacity: 1, fillOpacity: 0.28 });
    const tooltip = L.tooltip({ direction: 'top', offset: [0, -8], className: 'me-municipality-tooltip', permanent: false });
    let hovered: L.Path | undefined;
    const clearHover = (): void => {
      hovered?.setStyle(base());
      hovered = undefined;
      tooltip.remove();
    };
    this.map.off('zoomstart movestart dragstart mouseout', this.clearMunicipalityHover);
    this.clearMunicipalityHover = clearHover;
    this.map.on('zoomstart movestart dragstart mouseout', clearHover);
    this.municipalityLayer = L.geoJSON(mesh, {
      style: base,
      onEachFeature: (feature, layer) => {
        const entry = info.get(String(feature.properties?.['id']));
        if (!entry) return;
        const path = layer as L.Path;
        // Um único tooltip e um único destaque por vez; qualquer movimento do mapa os limpa
        // (durante o zoom o `mouseout` não dispara e os rótulos ficariam presos).
        layer.on('mouseover', (e: L.LeafletMouseEvent) => {
          clearHover();
          hovered = path;
          path.setStyle(hover());
          path.bringToFront();
          tooltip.setContent(entry.name).setLatLng(e.latlng).addTo(this.map!);
        });
        layer.on('mousemove', (e: L.LeafletMouseEvent) => tooltip.setLatLng(e.latlng));
        layer.on('mouseout', () => { if (hovered === path) clearHover(); });
        const box = document.createElement('div');
        box.className = 'me-popup-muni';
        const title = document.createElement('strong');
        title.textContent = entry.name;
        box.appendChild(title);
        if (entry.href) {
          const a = document.createElement('a');
          a.href = entry.href;
          a.textContent = 'Ver município';
          a.className = 'me-popup-link me-popup-link--button';
          box.appendChild(a);
        }
        layer.bindPopup(box, { closeButton: true, autoPan: true });
      },
    }).addTo(this.map);
  }

  /** Cores do contorno vindas dos tokens CSS do tema atual. */
  private boundaryStyle(): L.PathOptions {
    return {
      ...BOUNDARY_STYLE,
      color: this.cssVar('--me-map-boundary', '#1f4d3a'),
      fillColor: this.cssVar('--me-map-boundary-fill', '#8fa98b'),
    };
  }

  private cssVar(name: string, fallback: string): string {
    const value = getComputedStyle(this.mapEl().nativeElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  private destroyMap(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.boundaryLayer.clearLayers();
    this.markerLayer.clearLayers();
    this.markers.clear();
    this.maskLayer = undefined;
    this.map?.remove();
    this.map = undefined;
  }
}
