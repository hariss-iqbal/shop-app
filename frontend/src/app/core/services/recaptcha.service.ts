import { Injectable, signal, computed } from '@angular/core';
import { environment } from '@env/environment';

/**
 * reCAPTCHA v3 Service
 * Optional invisible bot detection for the contact form
 * Owner Module: M-14 Security
 *
 * Loads reCAPTCHA v3 script dynamically when enabled in environment config.
 * Provides token generation for form submissions.
 * No visible CAPTCHA is shown to users (v3 is fully invisible).
 */

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class RecaptchaService {
  private scriptLoaded = signal(false);
  private scriptLoading = signal(false);

  readonly isEnabled = computed(() => environment.recaptcha.enabled && !!environment.recaptcha.siteKey);
  readonly isReady = computed(() => this.isEnabled() && this.scriptLoaded());

  async initialize(): Promise<void> {
    if (!this.isEnabled() || this.scriptLoaded() || this.scriptLoading()) {
      return;
    }

    this.scriptLoading.set(true);

    try {
      await this.loadScript();
      this.scriptLoaded.set(true);
    } catch {
      this.scriptLoaded.set(false);
    } finally {
      this.scriptLoading.set(false);
    }
  }

  async getToken(action: string): Promise<string | null> {
    if (!this.isEnabled()) {
      return null;
    }

    if (!this.scriptLoaded()) {
      await this.initialize();
    }

    if (!this.scriptLoaded()) {
      return null;
    }

    try {
      return await new Promise<string>((resolve) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(environment.recaptcha.siteKey, { action })
            .then(resolve)
            .catch(() => resolve(''));
        });
      });
    } catch {
      return null;
    }
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[src*="recaptcha/api.js"]'
      );
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptcha.siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
      document.head.appendChild(script);
    });
  }
}
