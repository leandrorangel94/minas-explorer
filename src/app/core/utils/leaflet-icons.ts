import * as L from 'leaflet';

/**
 * Com bundlers o Leaflet não resolve sozinho os PNGs do marcador padrão.
 * Os arquivos são copiados para `leaflet/` (ver `assets` em angular.json); os caminhos
 * são relativos ao `<base href>`, então funcionam em subdiretório (hospedagem estática).
 */
export function configureLeafletIcons(): void {
  L.Icon.Default.mergeOptions({
    iconUrl: 'leaflet/marker-icon.png',
    iconRetinaUrl: 'leaflet/marker-icon-2x.png',
    shadowUrl: 'leaflet/marker-shadow.png',
  });
}
