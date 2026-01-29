import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface SeoConfig {
  title: string;
  description: string;
  url?: string;
  image?: string | null;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  private readonly siteName = environment.siteName;
  private readonly siteUrl = environment.siteUrl;

  updateMetaTags(config: SeoConfig): void {
    const fullTitle = `${config.title} | ${this.siteName}`;
    const absoluteUrl = config.url
      ? `${this.siteUrl}${config.url.startsWith('/') ? '' : '/'}${config.url}`
      : this.siteUrl;

    this.title.setTitle(fullTitle);

    this.setOrUpdateTag('name', 'description', config.description);

    this.setOrUpdateTag('property', 'og:title', fullTitle);
    this.setOrUpdateTag('property', 'og:description', config.description);
    this.setOrUpdateTag('property', 'og:url', absoluteUrl);
    this.setOrUpdateTag('property', 'og:type', config.type || 'website');
    this.setOrUpdateTag('property', 'og:site_name', this.siteName);

    if (config.image) {
      this.setOrUpdateTag('property', 'og:image', config.image);
    } else {
      this.removeTag('property', 'og:image');
    }

    this.setOrUpdateTag('name', 'twitter:card', config.image ? 'summary_large_image' : 'summary');
    this.setOrUpdateTag('name', 'twitter:title', fullTitle);
    this.setOrUpdateTag('name', 'twitter:description', config.description);

    if (config.image) {
      this.setOrUpdateTag('name', 'twitter:image', config.image);
    } else {
      this.removeTag('name', 'twitter:image');
    }

    this.setCanonicalUrl(absoluteUrl);
  }

  private setOrUpdateTag(attr: 'name' | 'property', key: string, value: string): void {
    const selector = `${attr}="${key}"`;
    const tag = this.meta.getTag(selector);
    if (tag) {
      this.meta.updateTag({ [attr]: key, content: value });
    } else {
      this.meta.addTag({ [attr]: key, content: value });
    }
  }

  private removeTag(attr: 'name' | 'property', key: string): void {
    this.meta.removeTag(`${attr}="${key}"`);
  }

  private setCanonicalUrl(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
