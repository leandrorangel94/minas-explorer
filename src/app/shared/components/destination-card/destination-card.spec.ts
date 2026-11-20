import { TestBed } from '@angular/core/testing';
import { DestinationCard } from './destination-card';

describe('DestinationCard', () => {
  it('shows placeholder when there is no image and image after valid url, then falls back on error', async () => {
    const fixture = TestBed.createComponent(DestinationCard);
    fixture.componentRef.setInput('name', 'Exemplo');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.me-card__placeholder')).toBeTruthy();

    fixture.componentRef.setInput('imageUrl', '/x.jpg');
    await fixture.whenStable();
    const img = el.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();

    img.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.me-card__placeholder')).toBeTruthy();
  });
});
