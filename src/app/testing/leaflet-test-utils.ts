/**
 * Utilidades de teste para o mapa. O jsdom não faz layout, então o container do Leaflet teria
 * tamanho 0 e o grupo de marcadores (clustering) não renderizaria nada.
 */

/** Dá 800x600 aos containers `.me-map__canvas` durante os testes. Retorna a função que desfaz. */
export function fakeMapSize(width = 800, height = 600): () => void {
  const w = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  const h = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight');
  const isMap = (el: Element) => el.classList.contains('me-map__canvas');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get() { return isMap(this) ? width : 0; } });
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get() { return isMap(this) ? height : 0; } });
  return () => {
    if (w) Object.defineProperty(Element.prototype, 'clientWidth', w);
    if (h) Object.defineProperty(Element.prototype, 'clientHeight', h);
  };
}

/** Quantidade de destinos visíveis no mapa: marcadores soltos + destinos dentro de cada grupo. */
export function mapDestinationCount(root: HTMLElement): number {
  let total = 0;
  for (const icon of Array.from(root.querySelectorAll('.leaflet-marker-icon'))) {
    const cluster = icon.querySelector('.me-cluster');
    total += cluster ? Number(cluster.getAttribute('data-count')) : 1;
  }
  return total;
}
