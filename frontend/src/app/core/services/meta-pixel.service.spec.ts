import { TestBed } from '@angular/core/testing';
import { MetaPixelService, PixelProduct } from './meta-pixel.service';

describe('MetaPixelService', () => {
  let service: MetaPixelService;
  let fbq: jasmine.Spy;

  const product: PixelProduct = {
    variantSlug: 'google-pixel-9a-128gb',
    color: 'Peony',
    name: 'Google Pixel 9a',
    price: 115000
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetaPixelService);

    fbq = jasmine.createSpy('fbq');
    window.fbq = fbq as unknown as (...args: unknown[]) => void;
  });

  afterEach(() => {
    delete window.fbq;
  });

  describe('catalogId', () => {
    // These must match `buildRow()` in supabase/functions/meta-catalog/index.ts.
    // A mismatch doesn't throw — events keep firing but stop matching catalog
    // items, so dynamic retargeting quietly stops working.
    it('joins slug and colour slug the way the catalog feed does', () => {
      expect(service.catalogId('google-pixel-9a-128gb', 'Peony'))
        .toBe('google-pixel-9a-128gb-peony');
    });

    it('collapses non-alphanumeric runs in the colour', () => {
      expect(service.catalogId('iphone-15-pro', 'Space   Black/Grey'))
        .toBe('iphone-15-pro-space-black-grey');
    });

    it('falls back to "default" when the product has no colour', () => {
      expect(service.catalogId('nothing-phone-2a', null))
        .toBe('nothing-phone-2a-default');
    });

    it('truncates to the feed limit of 100 characters', () => {
      expect(service.catalogId('a'.repeat(120), 'Blue').length).toBe(100);
    });
  });

  describe('viewContent', () => {
    it('reports the catalog id, value and PKR currency', () => {
      service.viewContent(product);

      expect(fbq).toHaveBeenCalledWith('track', 'ViewContent', {
        content_ids: ['google-pixel-9a-128gb-peony'],
        content_type: 'product',
        content_name: 'Google Pixel 9a',
        value: 115000,
        currency: 'PKR'
      });
    });
  });

  describe('search', () => {
    it('sends the trimmed query', () => {
      service.search('  pixel 9a  ');
      expect(fbq).toHaveBeenCalledWith('track', 'Search', { search_string: 'pixel 9a' });
    });

    it('ignores an empty query, so clearing the box is not an event', () => {
      service.search('   ');
      expect(fbq).not.toHaveBeenCalled();
    });
  });

  describe('contact', () => {
    it('includes product details when the lead came from a product page', () => {
      service.contact('whatsapp', product);

      expect(fbq).toHaveBeenCalledWith('track', 'Contact', {
        content_category: 'whatsapp',
        content_ids: ['google-pixel-9a-128gb-peony'],
        content_name: 'Google Pixel 9a',
        value: 115000,
        currency: 'PKR'
      });
    });

    it('reports the source alone when there is no product context', () => {
      service.contact('form');
      expect(fbq).toHaveBeenCalledWith('track', 'Contact', { content_category: 'form' });
    });
  });

  describe('resilience', () => {
    it('does nothing when the pixel script was blocked', () => {
      delete window.fbq;
      expect(() => service.viewContent(product)).not.toThrow();
    });

    it('swallows errors thrown by fbq', () => {
      fbq.and.throwError('blocked by extension');
      expect(() => service.viewContent(product)).not.toThrow();
    });
  });
});
