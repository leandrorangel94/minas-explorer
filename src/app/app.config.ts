import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    // Hash routing: compatível com hospedagem estática (GitHub Pages). Revisitar na Etapa 11.
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
  ],
};
