import {
  Building2, Church, createElement, Droplets, IconNode, Landmark, MapPin, Mountain, Trees, Utensils, Waves, Wheat,
} from 'lucide';

/** Ícones Lucide usados pelas categorias (campo `icon` de categories.json). Só estes entram no bundle. */
const ICONS: Readonly<Record<string, IconNode>> = {
  landmark: Landmark,
  'building-2': Building2,
  church: Church,
  droplets: Droplets,
  trees: Trees,
  mountain: Mountain,
  waves: Waves,
  wheat: Wheat,
  utensils: Utensils,
  'map-pin': MapPin,
};

export function createCategoryIcon(name: string | undefined, size = 18): SVGElement {
  const el = createElement(ICONS[name ?? ''] ?? MapPin);
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('aria-hidden', 'true');
  return el;
}
