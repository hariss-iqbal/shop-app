import { TestBed } from '@angular/core/testing';
import { SpamPreventionService } from './spam-prevention.service';

describe('SpamPreventionService', () => {
  let service: SpamPreventionService;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};

    spyOn(localStorage, 'getItem').and.callFake((key: string) => localStorageMock[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    TestBed.configureTestingModule({
      providers: [SpamPreventionService]
    });

    service = TestBed.inject(SpamPreventionService);
  });

  afterEach(() => {
    localStorageMock = {};
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isRateLimited', () => {
    it('should return false when no submissions exist', () => {
      expect(service.isRateLimited()).toBeFalse();
    });

    it('should return false when less than 3 submissions within window', () => {
      const now = Date.now();
      localStorageMock['contact_form_submissions'] = JSON.stringify([now - 1000, now - 2000]);

      expect(service.isRateLimited()).toBeFalse();
    });

    it('should return true when 3 or more submissions within window', () => {
      const now = Date.now();
      localStorageMock['contact_form_submissions'] = JSON.stringify([
        now - 1000,
        now - 2000,
        now - 3000
      ]);

      expect(service.isRateLimited()).toBeTrue();
    });

    it('should ignore submissions outside the 5-minute window', () => {
      const now = Date.now();
      const sixMinutesAgo = now - 6 * 60 * 1000;
      localStorageMock['contact_form_submissions'] = JSON.stringify([
        sixMinutesAgo,
        sixMinutesAgo - 1000,
        sixMinutesAgo - 2000
      ]);

      expect(service.isRateLimited()).toBeFalse();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock['contact_form_submissions'] = 'invalid-json';

      expect(service.isRateLimited()).toBeFalse();
    });

    it('should handle non-array localStorage data gracefully', () => {
      localStorageMock['contact_form_submissions'] = JSON.stringify({ foo: 'bar' });

      expect(service.isRateLimited()).toBeFalse();
    });
  });

  describe('recordSubmission', () => {
    it('should record a new submission timestamp', () => {
      service.recordSubmission();

      const stored = JSON.parse(localStorageMock['contact_form_submissions']);
      expect(stored.length).toBe(1);
      expect(typeof stored[0]).toBe('number');
    });

    it('should append to existing submissions', () => {
      const now = Date.now();
      localStorageMock['contact_form_submissions'] = JSON.stringify([now - 1000]);

      service.recordSubmission();

      const stored = JSON.parse(localStorageMock['contact_form_submissions']);
      expect(stored.length).toBe(2);
    });

    it('should clean expired timestamps when recording', () => {
      const now = Date.now();
      const sixMinutesAgo = now - 6 * 60 * 1000;
      localStorageMock['contact_form_submissions'] = JSON.stringify([sixMinutesAgo]);

      service.recordSubmission();

      const stored = JSON.parse(localStorageMock['contact_form_submissions']);
      expect(stored.length).toBe(1);
    });
  });

  describe('isHoneypotFilled', () => {
    it('should return false for empty string', () => {
      expect(service.isHoneypotFilled('')).toBeFalse();
    });

    it('should return false for null', () => {
      expect(service.isHoneypotFilled(null)).toBeFalse();
    });

    it('should return false for undefined', () => {
      expect(service.isHoneypotFilled(undefined)).toBeFalse();
    });

    it('should return false for whitespace-only string', () => {
      expect(service.isHoneypotFilled('   ')).toBeFalse();
    });

    it('should return true for non-empty string', () => {
      expect(service.isHoneypotFilled('bot-filled-value')).toBeTrue();
    });

    it('should return true for string with whitespace and content', () => {
      expect(service.isHoneypotFilled('  spam  ')).toBeTrue();
    });
  });

  describe('getRemainingWaitSeconds', () => {
    it('should return 0 when not rate limited', () => {
      expect(service.getRemainingWaitSeconds()).toBe(0);
    });

    it('should return 0 when less than 3 submissions', () => {
      const now = Date.now();
      localStorageMock['contact_form_submissions'] = JSON.stringify([now - 1000, now - 2000]);

      expect(service.getRemainingWaitSeconds()).toBe(0);
    });

    it('should return remaining seconds when rate limited', () => {
      const now = Date.now();
      const fourMinutesAgo = now - 4 * 60 * 1000;
      localStorageMock['contact_form_submissions'] = JSON.stringify([
        fourMinutesAgo,
        now - 1000,
        now - 2000
      ]);

      const remaining = service.getRemainingWaitSeconds();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(60);
    });

    it('should return correct seconds based on oldest submission', () => {
      const now = Date.now();
      const threeMinutesAgo = now - 3 * 60 * 1000;
      localStorageMock['contact_form_submissions'] = JSON.stringify([
        threeMinutesAgo,
        now - 1000,
        now - 2000
      ]);

      const remaining = service.getRemainingWaitSeconds();
      expect(remaining).toBeGreaterThan(110);
      expect(remaining).toBeLessThanOrEqual(120);
    });
  });

  describe('rate limiting integration', () => {
    it('should correctly track submission count across operations', () => {
      expect(service.isRateLimited()).toBeFalse();

      service.recordSubmission();
      expect(service.isRateLimited()).toBeFalse();

      service.recordSubmission();
      expect(service.isRateLimited()).toBeFalse();

      service.recordSubmission();
      expect(service.isRateLimited()).toBeTrue();
    });
  });
});
