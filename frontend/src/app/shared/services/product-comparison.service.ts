import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../../models/product.model';

const MAX_COMPARE_PRODUCTS = 3;
const STORAGE_KEY = 'product_comparison_selection';

@Injectable({
  providedIn: 'root'
})
export class ProductComparisonService {
  private selectedProducts = signal<Product[]>([]);

  readonly products = this.selectedProducts.asReadonly();
  readonly count = computed(() => this.selectedProducts().length);
  readonly isFull = computed(() => this.selectedProducts().length >= MAX_COMPARE_PRODUCTS);
  readonly hasProducts = computed(() => this.selectedProducts().length > 0);
  readonly canCompare = computed(() => this.selectedProducts().length >= 2);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadFromSession();
  }

  isSelected(productId: string): boolean {
    return this.selectedProducts().some(p => p.id === productId);
  }

  toggle(product: Product): 'added' | 'removed' | 'full' {
    if (this.isSelected(product.id)) {
      this.remove(product.id);
      return 'removed';
    }

    if (this.isFull()) {
      return 'full';
    }

    this.selectedProducts.update(products => [...products, product]);
    this.saveToSession();
    return 'added';
  }

  remove(productId: string): void {
    this.selectedProducts.update(products => products.filter(p => p.id !== productId));
    this.saveToSession();
  }

  clear(): void {
    this.selectedProducts.set([]);
    this.clearSession();
  }

  getProductIds(): string[] {
    return this.selectedProducts().map(p => p.id);
  }

  private saveToSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const products = this.selectedProducts();
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      } catch {
        // Session storage might be unavailable in some contexts
      }
    }
  }

  private loadFromSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const products = JSON.parse(stored) as Product[];
          if (Array.isArray(products) && products.length > 0 && products.length <= MAX_COMPARE_PRODUCTS) {
            this.selectedProducts.set(products);
          }
        }
      } catch {
        // Session storage might be unavailable or data might be corrupted
      }
    }
  }

  private clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Session storage might be unavailable
      }
    }
  }
}
