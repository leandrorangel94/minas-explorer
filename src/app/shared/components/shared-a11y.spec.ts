import { TestBed } from '@angular/core/testing';
import categories from '../../../../public/data/categories.json';
import { hasIcon } from '../../core/utils/icons';
import { Icon } from './icon/icon';
import { SectionTitle } from './section-title/section-title';

describe('Icon', () => {
  async function create(name: string | undefined, size?: number) {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', name);
    if (size) fixture.componentRef.setInput('size', size);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('desenha um SVG decorativo no tamanho pedido', async () => {
    const el = await create('map', 22);
    const svg = el.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('22');
    expect(svg.getAttribute('height')).toBe('22');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('nome desconhecido cai no pin de mapa, sem quebrar', async () => {
    const unknown = await create('nao-existe');
    const pin = await create('map-pin');
    expect(unknown.querySelector('svg')?.innerHTML).toBe(pin.querySelector('svg')?.innerHTML);
  });

  it('todo ícone usado pelas categorias existe no registro (senão cairia no pin sem aviso)', () => {
    for (const c of categories) expect(hasIcon(c.icon), `${c.id}: ${c.icon}`).toBe(true);
  });
});

describe('SectionTitle', () => {
  async function create(level?: 1 | 2) {
    const fixture = TestBed.createComponent(SectionTitle);
    fixture.componentRef.setInput('title', 'Meu título');
    if (level) fixture.componentRef.setInput('level', level);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('usa h2 por padrão e h1 quando é o título da página', async () => {
    expect((await create()).querySelector('h2')?.textContent).toBe('Meu título');
    expect((await create()).querySelector('h1')).toBeNull();
    const page = await create(1);
    expect(page.querySelector('h1')?.textContent).toBe('Meu título');
    expect(page.querySelector('h2')).toBeNull();
  });
});
