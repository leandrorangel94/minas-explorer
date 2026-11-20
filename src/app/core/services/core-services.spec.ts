import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { GeoDataService } from './geo-data.service';
import { PageMetaService } from './page-meta.service';

describe('PageMetaService', () => {
  it('define título com sufixo e a meta description', () => {
    const service = TestBed.inject(PageMetaService);
    service.set('Ouro Preto', 'Descrição da cidade');
    expect(TestBed.inject(Title).getTitle()).toBe('Ouro Preto – Minas Explorer');
    expect(TestBed.inject(Meta).getTag('name="description"')?.content).toBe('Descrição da cidade');
  });

  it('sem título usa só o nome do site e a descrição padrão', () => {
    TestBed.inject(PageMetaService).set(null);
    expect(TestBed.inject(Title).getTitle()).toBe('Minas Explorer');
    expect(TestBed.inject(Meta).getTag('name="description"')?.content).toContain('mais perto do que você imagina');
  });
});

describe('GeoDataService', () => {
  it('lê contorno, regiões e municípios por URL relativa, com uma requisição cada', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(GeoDataService);
    const http = TestBed.inject(HttpTestingController);
    service.boundary$.subscribe();
    service.boundary$.subscribe(); // segundo assinante: sem nova requisição (shareReplay)
    service.regions$.subscribe();
    service.municipalities$.subscribe();
    http.expectOne('data/geo/minas-gerais.geo.json').flush({ type: 'FeatureCollection', features: [] });
    http.expectOne('data/regions.json').flush([]);
    http.expectOne('data/municipalities.json').flush([]);
    http.verify();
  });
});
