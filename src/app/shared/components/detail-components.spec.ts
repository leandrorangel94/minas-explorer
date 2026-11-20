import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogImage, PracticalInfo } from '../../core/models/catalog.models';
import { Breadcrumbs } from './breadcrumbs/breadcrumbs';
import { ImageGallery } from './image-gallery/image-gallery';
import { PracticalInfoView } from './practical-info/practical-info';

const img = (n: number): CatalogImage => ({
  url: `https://img.test/${n}.jpg`, alt: `Foto ${n}`, author: `Autor ${n}`, license: 'CC BY-SA 4.0',
  sourceUrl: `https://commons.test/file/${n}`, attribution: `Crédito ${n}`,
});

describe('ImageGallery', () => {
  async function create(images: CatalogImage[]) {
    const fixture = TestBed.createComponent(ImageGallery);
    fixture.componentRef.setInput('images', images);
    fixture.componentRef.setInput('subject', 'Lugar X');
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('sem imagens mostra mensagem honesta, sem <img>', async () => {
    const { el } = await create([]);
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toContain('direitos de uso verificados');
  });

  it('mostra a imagem com alt e todos os créditos', async () => {
    const { el } = await create([img(1)]);
    const image = el.querySelector('figure img') as HTMLImageElement;
    expect(image.alt).toBe('Foto 1');
    expect(image.getAttribute('loading')).toBe('lazy');
    const credit = el.querySelector('figcaption')!;
    expect(credit.textContent).toContain('Crédito 1');
    expect(credit.textContent).toContain('Foto: Autor 1');
    expect(credit.textContent).toContain('Licença: CC BY-SA 4.0');
    const link = credit.querySelector('a') as HTMLAnchorElement;
    expect(link.href).toBe('https://commons.test/file/1');
    expect(link.rel).toBe('noopener noreferrer');
    expect(el.querySelector('.me-gallery__thumbs')).toBeNull(); // 1 imagem: sem miniaturas
  });

  it('com várias imagens troca pela miniatura e atualiza os créditos', async () => {
    const { fixture, el } = await create([img(1), img(2)]);
    const thumbs = el.querySelectorAll('.me-gallery__thumbs button');
    expect(thumbs.length).toBe(2);
    expect(thumbs[0].getAttribute('aria-current')).toBe('true');
    (thumbs[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect((el.querySelector('figure img') as HTMLImageElement).alt).toBe('Foto 2');
    expect(el.querySelector('figcaption')?.textContent).toContain('Autor 2');
    expect(el.querySelectorAll('.me-gallery__thumbs button')[1].getAttribute('aria-current')).toBe('true');
  });

  it('imagem com erro vira placeholder mantendo os créditos', async () => {
    const { fixture, el } = await create([img(1)]);
    (el.querySelector('figure img') as HTMLImageElement).dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(el.querySelector('figure img')).toBeNull();
    expect(el.querySelector('.me-gallery__placeholder')?.textContent).toContain('Imagem indisponível');
    expect(el.querySelector('figcaption')).toBeTruthy();
  });
});

describe('PracticalInfoView', () => {
  const base: PracticalInfo = {
    openingHours: 'Ter a dom, 9h às 17h', admission: 'Gratuita', bookingRequired: false,
    source: { name: 'Site oficial', url: 'https://oficial.test' }, verifiedAt: '2026-11-01',
  };
  async function create(info: PracticalInfo | undefined) {
    const fixture = TestBed.createComponent(PracticalInfoView);
    fixture.componentRef.setInput('info', info);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('sem informação: avisa que não foi verificada e não mostra campos', async () => {
    const el = await create(undefined);
    expect(el.textContent).toContain('ainda não verificadas');
    expect(el.querySelector('dl')).toBeNull();
  });

  it('mostra só os campos informados, com fonte e data', async () => {
    const el = await create(base);
    const labels = [...el.querySelectorAll('dt')].map((d) => d.textContent);
    expect(labels).toEqual(['Horário de visitação', 'Entrada', 'Agendamento']);
    expect(el.querySelector('.me-pinfo__alert')).toBeNull();
    expect(el.querySelector('.me-pinfo__source')?.textContent).toContain('Verificado em 01/11/2026');
    expect((el.querySelector('.me-pinfo__source a') as HTMLAnchorElement).rel).toBe('noopener noreferrer');
  });

  it('informação antiga é marcada como possivelmente desatualizada', async () => {
    const el = await create({ ...base, verifiedAt: '2020-01-15' });
    expect(el.querySelector('.me-pinfo__alert')?.textContent).toContain('podem estar desatualizadas');
  });
});

describe('Breadcrumbs', () => {
  it('links nos itens intermediários e página atual marcada', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Breadcrumbs);
    fixture.componentRef.setInput('items', [{ label: 'Explorar', link: '/' }, { label: 'Atual' }]);
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('a').length).toBe(1);
    expect(el.querySelector('[aria-current="page"]')?.textContent).toBe('Atual');
  });
});
