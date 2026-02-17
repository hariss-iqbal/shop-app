import { Inject, Injectable, PLATFORM_ID, effect, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeMode } from '../../enums/theme-mode.enum';

const THEME_STORAGE_KEY = 'phone-shop-theme';

const themeStorageLabels: Record<ThemeMode, string> = {
  [ThemeMode.LIGHT]: 'light',
  [ThemeMode.DARK]: 'dark'
};

// Browser chrome colors for mobile devices
const themeColors: Record<ThemeMode, string> = {
  [ThemeMode.LIGHT]: '#f5f7f8',
  [ThemeMode.DARK]: '#0c1220'
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly currentTheme = signal<ThemeMode>(this.resolveInitialTheme());

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.persistTheme(theme);
    });
  }

  toggleTheme(): void {
    const next = this.currentTheme() === ThemeMode.LIGHT
      ? ThemeMode.DARK
      : ThemeMode.LIGHT;
    this.currentTheme.set(next);
  }

  isDark(): boolean {
    return this.currentTheme() === ThemeMode.DARK;
  }

  private resolveInitialTheme(): ThemeMode {
    if (!this.isBrowser) {
      return ThemeMode.LIGHT;
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === themeStorageLabels[ThemeMode.LIGHT]) {
      return ThemeMode.LIGHT;
    }
    if (stored === themeStorageLabels[ThemeMode.DARK]) {
      return ThemeMode.DARK;
    }

    // Default to light theme for new users
    return ThemeMode.LIGHT;
  }

  private applyTheme(theme: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    const htmlElement = document.documentElement;
    if (theme === ThemeMode.DARK) {
      htmlElement.classList.add('dark-theme');
    } else {
      htmlElement.classList.remove('dark-theme');
    }

    // Update meta theme-color for mobile browser chrome
    this.updateMetaThemeColor(theme);
  }

  private updateMetaThemeColor(theme: ThemeMode): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColors[theme]);
    }
  }

  private persistTheme(theme: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(THEME_STORAGE_KEY, themeStorageLabels[theme]);
  }
}
