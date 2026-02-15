import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SeoService, SeoConfig } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: jasmine.SpyObj<Title>;
  let metaService: jasmine.SpyObj<Meta>;
  let mockDocument: Document;

  beforeEach(() => {
    titleService = jasmine.createSpyObj('Title', ['setTitle']);
    metaService = jasmine.createSpyObj('Meta', ['getTag', 'updateTag', 'addTag', 'removeTag']);

    mockDocument = document.implementation.createHTMLDocument('Test');

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: Title, useValue: titleService },
        { provide: Meta, useValue: metaService },
        { provide: DOCUMENT, useValue: mockDocument }
      ]
    });

    service = TestBed.inject(SeoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateMetaTags', () => {
    const basicConfig: SeoConfig = {
      title: 'Test Page',
      description: 'This is a test description for SEO purposes.'
    };

    it('should set page title with site name suffix', () => {
      service.updateMetaTags(basicConfig);

      expect(titleService.setTitle).toHaveBeenCalledWith('Test Page | Phone Shop');
    });

    it('should set meta description', () => {
      metaService.getTag.and.returnValue(null);
      service.updateMetaTags(basicConfig);

      expect(metaService.addTag).toHaveBeenCalledWith({
        name: 'description',
        content: 'This is a test description for SEO purposes.'
      });
    });

    it('should update existing meta description', () => {
      metaService.getTag.and.callFake((selector: string) => {
        if (selector === 'name="description"') {
          return document.createElement('meta');
        }
        return null;
      });

      service.updateMetaTags(basicConfig);

      expect(metaService.updateTag).toHaveBeenCalledWith({
        name: 'description',
        content: 'This is a test description for SEO purposes.'
      });
    });

    describe('Open Graph tags', () => {
      it('should set og:title with full title', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.addTag).toHaveBeenCalledWith({
          property: 'og:title',
          content: 'Test Page | Phone Shop'
        });
      });

      it('should set og:description', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.addTag).toHaveBeenCalledWith({
          property: 'og:description',
          content: 'This is a test description for SEO purposes.'
        });
      });

      it('should set og:url with absolute URL', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags({ ...basicConfig, url: '/about' });

        expect(metaService.addTag).toHaveBeenCalledWith({
          property: 'og:url',
          content: 'http://localhost:4200/about'
        });
      });

      it('should set og:url with site url when no path provided', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.addTag).toHaveBeenCalledWith({
          property: 'og:url',
          content: 'http://localhost:4200'
        });
      });

      it('should default og:type to website', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.addTag).toHaveBeenCalledWith({
          property: 'og:type',
          content: 'website'
        });
      });

      it('should set og:type to product when specified', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags({ ...basicConfig, type: 'product' });

        expect(metaService.addTag).toHaveBeenCalledWith({
          property: 'og:type',
          content: 'product'
        });
      });

      it('should set og:site_name', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.addTag).toHaveBeenCalledWith({
          property: 'og:site_name',
          content: 'Phone Shop'
        });
      });

      it('should set og:image when provided', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags({
          ...basicConfig,
          image: 'https://example.com/image.jpg'
        });

        expect(metaService.addTag).toHaveBeenCalledWith({
          property: 'og:image',
          content: 'https://example.com/image.jpg'
        });
      });

      it('should remove og:image when not provided', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.removeTag).toHaveBeenCalledWith('property="og:image"');
      });

      it('should remove og:image when image is null', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags({ ...basicConfig, image: null });

        expect(metaService.removeTag).toHaveBeenCalledWith('property="og:image"');
      });
    });

    describe('Twitter Card tags', () => {
      it('should set twitter:card to summary when no image', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.addTag).toHaveBeenCalledWith({
          name: 'twitter:card',
          content: 'summary'
        });
      });

      it('should set twitter:card to summary_large_image when image provided', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags({
          ...basicConfig,
          image: 'https://example.com/image.jpg'
        });

        expect(metaService.addTag).toHaveBeenCalledWith({
          name: 'twitter:card',
          content: 'summary_large_image'
        });
      });

      it('should set twitter:title', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.addTag).toHaveBeenCalledWith({
          name: 'twitter:title',
          content: 'Test Page | Phone Shop'
        });
      });

      it('should set twitter:description', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.addTag).toHaveBeenCalledWith({
          name: 'twitter:description',
          content: 'This is a test description for SEO purposes.'
        });
      });

      it('should set twitter:image when provided', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags({
          ...basicConfig,
          image: 'https://example.com/image.jpg'
        });

        expect(metaService.addTag).toHaveBeenCalledWith({
          name: 'twitter:image',
          content: 'https://example.com/image.jpg'
        });
      });

      it('should remove twitter:image when not provided', () => {
        metaService.getTag.and.returnValue(null);
        service.updateMetaTags(basicConfig);

        expect(metaService.removeTag).toHaveBeenCalledWith('name="twitter:image"');
      });
    });

    describe('Canonical URL', () => {
      it('should create canonical link element if not exists', () => {
        service.updateMetaTags({ ...basicConfig, url: '/about' });

        const canonicalLink = mockDocument.querySelector('link[rel="canonical"]');
        expect(canonicalLink).toBeTruthy();
        expect(canonicalLink?.getAttribute('href')).toBe('http://localhost:4200/about');
      });

      it('should update existing canonical link element', () => {
        // Create an initial canonical link
        const existingLink = mockDocument.createElement('link');
        existingLink.setAttribute('rel', 'canonical');
        existingLink.setAttribute('href', 'http://localhost:4200/old-page');
        mockDocument.head.appendChild(existingLink);

        service.updateMetaTags({ ...basicConfig, url: '/new-page' });

        const canonicalLink = mockDocument.querySelector('link[rel="canonical"]');
        expect(canonicalLink?.getAttribute('href')).toBe('http://localhost:4200/new-page');
      });

      it('should handle URL paths without leading slash', () => {
        service.updateMetaTags({ ...basicConfig, url: 'about' });

        const canonicalLink = mockDocument.querySelector('link[rel="canonical"]');
        expect(canonicalLink?.getAttribute('href')).toBe('http://localhost:4200/about');
      });

      it('should set site URL as canonical when no URL provided', () => {
        service.updateMetaTags(basicConfig);

        const canonicalLink = mockDocument.querySelector('link[rel="canonical"]');
        expect(canonicalLink?.getAttribute('href')).toBe('http://localhost:4200');
      });
    });
  });

  describe('Product detail page SEO', () => {
    it('should set correct meta tags for a product detail page', () => {
      metaService.getTag.and.returnValue(null);

      const productConfig: SeoConfig = {
        title: 'Apple iPhone 15 Pro 256GB',
        description: 'Buy Apple iPhone 15 Pro 256GB - New condition for $1,200. Browse specs, images, and inquire via WhatsApp.',
        url: '/product/product-123',
        image: 'https://example.com/iphone15.jpg',
        type: 'product'
      };

      service.updateMetaTags(productConfig);

      expect(titleService.setTitle).toHaveBeenCalledWith('Apple iPhone 15 Pro 256GB | Phone Shop');
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'og:type',
        content: 'product'
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'og:image',
        content: 'https://example.com/iphone15.jpg'
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        name: 'twitter:card',
        content: 'summary_large_image'
      });
    });
  });

  describe('Catalog page SEO', () => {
    it('should set correct meta tags for catalog page', () => {
      metaService.getTag.and.returnValue(null);

      const catalogConfig: SeoConfig = {
        title: 'Phone Catalog',
        description: 'Browse our wide selection of new, used, and refurbished phones at competitive prices.',
        url: '/'
      };

      service.updateMetaTags(catalogConfig);

      expect(titleService.setTitle).toHaveBeenCalledWith('Phone Catalog | Phone Shop');
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'og:type',
        content: 'website'
      });
    });
  });

  describe('Static pages SEO', () => {
    it('should set correct meta tags for About page', () => {
      metaService.getTag.and.returnValue(null);

      const aboutConfig: SeoConfig = {
        title: 'About Us',
        description: 'Learn about Phone Shop - your trusted source for new, used, and refurbished phones at great prices.',
        url: '/about'
      };

      service.updateMetaTags(aboutConfig);

      expect(titleService.setTitle).toHaveBeenCalledWith('About Us | Phone Shop');
    });

    it('should set correct meta tags for Contact page', () => {
      metaService.getTag.and.returnValue(null);

      const contactConfig: SeoConfig = {
        title: 'Contact Us',
        description: 'Get in touch with Phone Shop. Send us a message for inquiries about our phones, pricing, or any questions you may have.',
        url: '/contact'
      };

      service.updateMetaTags(contactConfig);

      expect(titleService.setTitle).toHaveBeenCalledWith('Contact Us | Phone Shop');
    });
  });
});
