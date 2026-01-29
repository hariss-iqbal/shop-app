import { TestBed } from '@angular/core/testing';
import { RecaptchaService } from './recaptcha.service';
import { environment } from '@env/environment';

describe('RecaptchaService', () => {
  let service: RecaptchaService;
  let originalEnvironment: typeof environment.recaptcha;

  beforeEach(() => {
    originalEnvironment = { ...environment.recaptcha };

    TestBed.configureTestingModule({
      providers: [RecaptchaService]
    });

    service = TestBed.inject(RecaptchaService);
  });

  afterEach(() => {
    environment.recaptcha = originalEnvironment;
    const script = document.querySelector('script[src*="recaptcha/api.js"]');
    if (script) {
      script.remove();
    }
    delete (window as any).grecaptcha;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isEnabled', () => {
    it('should return false when recaptcha is disabled', () => {
      environment.recaptcha = { enabled: false, siteKey: 'test-key' };
      service = TestBed.inject(RecaptchaService);

      expect(service.isEnabled()).toBeFalse();
    });

    it('should return false when siteKey is empty', () => {
      environment.recaptcha = { enabled: true, siteKey: '' };
      service = TestBed.inject(RecaptchaService);

      expect(service.isEnabled()).toBeFalse();
    });

    it('should return true when enabled and siteKey is set', () => {
      environment.recaptcha = { enabled: true, siteKey: 'test-site-key' };
      service = TestBed.inject(RecaptchaService);

      expect(service.isEnabled()).toBeTrue();
    });
  });

  describe('isReady', () => {
    it('should return false when not enabled', () => {
      environment.recaptcha = { enabled: false, siteKey: '' };
      service = TestBed.inject(RecaptchaService);

      expect(service.isReady()).toBeFalse();
    });

    it('should return false when enabled but script not loaded', () => {
      environment.recaptcha = { enabled: true, siteKey: 'test-key' };
      service = TestBed.inject(RecaptchaService);

      expect(service.isReady()).toBeFalse();
    });
  });

  describe('getToken', () => {
    it('should return null when not enabled', async () => {
      environment.recaptcha = { enabled: false, siteKey: '' };
      service = TestBed.inject(RecaptchaService);

      const token = await service.getToken('test_action');

      expect(token).toBeNull();
    });

    it('should attempt to initialize when getting token if not loaded', async () => {
      environment.recaptcha = { enabled: true, siteKey: 'test-key' };
      service = TestBed.inject(RecaptchaService);
      const initializeSpy = spyOn(service, 'initialize').and.returnValue(Promise.resolve());

      await service.getToken('test_action');

      expect(initializeSpy).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should not load script when not enabled', async () => {
      environment.recaptcha = { enabled: false, siteKey: '' };
      service = TestBed.inject(RecaptchaService);

      await service.initialize();

      const script = document.querySelector('script[src*="recaptcha/api.js"]');
      expect(script).toBeNull();
    });

    it('should not reload script if already loaded', async () => {
      environment.recaptcha = { enabled: true, siteKey: 'test-key' };
      service = TestBed.inject(RecaptchaService);

      const existingScript = document.createElement('script');
      existingScript.src = 'https://www.google.com/recaptcha/api.js?render=test-key';
      document.head.appendChild(existingScript);

      await service.initialize();

      const scripts = document.querySelectorAll('script[src*="recaptcha/api.js"]');
      expect(scripts.length).toBe(1);
    });
  });
});
