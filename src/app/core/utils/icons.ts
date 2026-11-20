import {
  Building2, Check, Church, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSun, Snowflake, Thermometer, Wind, Umbrella, Compass, createElement, Droplets, ExternalLink, FilterX, Heart, IconNode, ImageOff, Info,
  Landmark, List, LocateFixed, Map as MapIcon, MapPin, Menu, Monitor, Moon, Mountain, Navigation, Route, Search, SearchX,
  SlidersHorizontal, Sun, Trees, TriangleAlert, Utensils, Waves, Wheat, X,
} from 'lucide';

/**
 * Registro ÚNICO de ícones do app (Lucide, SVG puro). Só os listados aqui entram no bundle.
 * Para usar um ícone novo: importe-o acima e registre-o com nome em kebab-case.
 * Os nomes de categorias (campo `icon` de categories.json) também vêm deste registro.
 */
const ICONS: Readonly<Record<string, IconNode>> = {
  // Interface
  check: Check,
  compass: Compass,
  'external-link': ExternalLink,
  'filter-x': FilterX,
  heart: Heart,
  'image-off': ImageOff,
  info: Info,
  list: List,
  'locate-fixed': LocateFixed,
  map: MapIcon,
  menu: Menu,
  monitor: Monitor,
  moon: Moon,
  navigation: Navigation,
  route: Route,
  search: Search,
  'search-x': SearchX,
  'sliders-horizontal': SlidersHorizontal,
  sun: Sun,
  'triangle-alert': TriangleAlert,
  x: X,
  // Clima
  cloud: Cloud,
  'cloud-drizzle': CloudDrizzle,
  'cloud-fog': CloudFog,
  'cloud-lightning': CloudLightning,
  'cloud-moon': CloudMoon,
  'cloud-rain': CloudRain,
  'cloud-sun': CloudSun,
  snowflake: Snowflake,
  thermometer: Thermometer,
  umbrella: Umbrella,
  wind: Wind,
  // Categorias
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

/** Cria o SVG do ícone (decorativo: `aria-hidden`). Nome desconhecido cai no pin de mapa. */
export function createIcon(name: string | undefined, size = 18): SVGElement {
  const el = createElement(ICONS[name ?? ''] ?? MapPin);
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('aria-hidden', 'true');
  return el;
}

export const hasIcon = (name: string): boolean => name in ICONS;
