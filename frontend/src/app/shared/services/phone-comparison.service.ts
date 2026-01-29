import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Phone } from '../../models/phone.model';

const MAX_COMPARE_PHONES = 3;
const STORAGE_KEY = 'phone_comparison_selection';

@Injectable({
  providedIn: 'root'
})
export class PhoneComparisonService {
  private platformId = inject(PLATFORM_ID);
  private selectedPhones = signal<Phone[]>([]);

  readonly phones = this.selectedPhones.asReadonly();
  readonly count = computed(() => this.selectedPhones().length);
  readonly isFull = computed(() => this.selectedPhones().length >= MAX_COMPARE_PHONES);
  readonly hasPhones = computed(() => this.selectedPhones().length > 0);
  readonly canCompare = computed(() => this.selectedPhones().length >= 2);

  constructor() {
    this.loadFromSession();
  }

  isSelected(phoneId: string): boolean {
    return this.selectedPhones().some(p => p.id === phoneId);
  }

  toggle(phone: Phone): 'added' | 'removed' | 'full' {
    if (this.isSelected(phone.id)) {
      this.remove(phone.id);
      return 'removed';
    }

    if (this.isFull()) {
      return 'full';
    }

    this.selectedPhones.update(phones => [...phones, phone]);
    this.saveToSession();
    return 'added';
  }

  remove(phoneId: string): void {
    this.selectedPhones.update(phones => phones.filter(p => p.id !== phoneId));
    this.saveToSession();
  }

  clear(): void {
    this.selectedPhones.set([]);
    this.clearSession();
  }

  getPhoneIds(): string[] {
    return this.selectedPhones().map(p => p.id);
  }

  private saveToSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const phones = this.selectedPhones();
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(phones));
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
          const phones = JSON.parse(stored) as Phone[];
          if (Array.isArray(phones) && phones.length > 0 && phones.length <= MAX_COMPARE_PHONES) {
            this.selectedPhones.set(phones);
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
