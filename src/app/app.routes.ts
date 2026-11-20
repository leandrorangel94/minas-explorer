import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Minas Explorer',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    // O título é definido pela própria página (depende do catálogo carregado).
    path: 'cidades/:citySlug',
    loadComponent: () => import('./features/cities/city-page').then((m) => m.CityPage),
  },
  {
    path: 'cidades/:citySlug/:attractionSlug',
    loadComponent: () => import('./features/attractions/attraction-page').then((m) => m.AttractionPage),
  },
  {
    path: 'roteiros',
    title: 'Roteiros – Minas Explorer',
    loadComponent: () => import('./features/itineraries/itineraries-page').then((m) => m.ItinerariesPage),
  },
  {
    path: 'favoritos',
    title: 'Favoritos – Minas Explorer',
    loadComponent: () => import('./features/favorites/favorites-page').then((m) => m.FavoritesPage),
  },
  {
    path: 'guia-de-estilo',
    title: 'Guia de estilo – Minas Explorer',
    loadComponent: () => import('./features/style-guide/style-guide-page').then((m) => m.StyleGuidePage),
  },
  { path: '**', redirectTo: '' },
];
