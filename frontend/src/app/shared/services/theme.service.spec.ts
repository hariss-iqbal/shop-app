import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from './theme.service';
import { ThemeMode } from '../../enums/theme-mode.enum';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockLocalStorage: { [key: string]: string };
  let mockClassList: { add: jasmine.Spy; remove: jasmine.Spy };
  let getItemSpy: jasmine.Spy;
  let setItemSpy: jasmine.Spy;
  let matchMediaSpy: jasmine.Spy;

  const THEME_STORAGE_KEY = 'phone-shop-theme';

  beforeEach(() => {
    mockLocalStorage = {};
    mockClassList = {
      add: jasmine.createSpy('add'),
      remove: jasmine.createSpy('remove')
    };

    // Mock localStorage
    getItemSpy = spyOn(localStorage, 'getItem').and.callFake((key: string) => mockLocalStorage[key] || null);
    setItemSpy = spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });

    // Mock matchMedia
    matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);

    // Mock document.documentElement.classList
    spyOnProperty(document, 'documentElement', 'get').and.returnValue({
      classList: mockClassList
    } as unknown as HTMLElement);
  });

  describe('Browser environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
    });

    describe('initialization', () => {
      it('should default to light theme when no localStorage and system prefers light', () => {
        matchMediaSpy.and.returnValue({ matches: false } as MediaQueryList);

        service = TestBed.inject(ThemeService);

        expect(service.currentTheme()).toBe(ThemeMode.LIGHT);
        expect(service.isDark()).toBe(false);
      });

      it('should default to dark theme when no localStorage and system prefers dark', () => {
        matchMediaSpy.and.returnValue({ matches: true } as MediaQueryList);

        service = TestBed.inject(ThemeService);

        expect(service.currentTheme()).toBe(ThemeMode.DARK);
        expect(service.isDark()).toBe(true);
      });

      it('should use stored light theme from localStorage', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'light';

        service = TestBed.inject(ThemeService);

        expect(service.currentTheme()).toBe(ThemeMode.LIGHT);
        expect(service.isDark()).toBe(false);
      });

      it('should use stored dark theme from localStorage', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'dark';

        service = TestBed.inject(ThemeService);

        expect(service.currentTheme()).toBe(ThemeMode.DARK);
        expect(service.isDark()).toBe(true);
      });

      it('should fall back to system preference when localStorage has invalid value', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'invalid';
        matchMediaSpy.and.returnValue({ matches: true } as MediaQueryList);

        service = TestBed.inject(ThemeService);

        expect(service.currentTheme()).toBe(ThemeMode.DARK);
      });

      it('should apply dark-theme class when initializing with dark theme', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'dark';

        service = TestBed.inject(ThemeService);
        TestBed.flushEffects();

        expect(mockClassList.add).toHaveBeenCalledWith('dark-theme');
      });

      it('should remove dark-theme class when initializing with light theme', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'light';

        service = TestBed.inject(ThemeService);
        TestBed.flushEffects();

        expect(mockClassList.remove).toHaveBeenCalledWith('dark-theme');
      });
    });

    describe('toggleTheme', () => {
      it('should toggle from light to dark', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'light';
        service = TestBed.inject(ThemeService);

        service.toggleTheme();

        expect(service.currentTheme()).toBe(ThemeMode.DARK);
        expect(service.isDark()).toBe(true);
      });

      it('should toggle from dark to light', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'dark';
        service = TestBed.inject(ThemeService);

        service.toggleTheme();

        expect(service.currentTheme()).toBe(ThemeMode.LIGHT);
        expect(service.isDark()).toBe(false);
      });

      it('should persist theme to localStorage after toggle', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'light';
        service = TestBed.inject(ThemeService);
        TestBed.flushEffects();
        setItemSpy.calls.reset();

        service.toggleTheme();
        TestBed.flushEffects();

        expect(setItemSpy).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
      });

      it('should apply dark-theme class after toggling to dark', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'light';
        service = TestBed.inject(ThemeService);
        TestBed.flushEffects();
        mockClassList.add.calls.reset();

        service.toggleTheme();
        TestBed.flushEffects();

        expect(mockClassList.add).toHaveBeenCalledWith('dark-theme');
      });

      it('should remove dark-theme class after toggling to light', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'dark';
        service = TestBed.inject(ThemeService);
        TestBed.flushEffects();
        mockClassList.remove.calls.reset();

        service.toggleTheme();
        TestBed.flushEffects();

        expect(mockClassList.remove).toHaveBeenCalledWith('dark-theme');
      });
    });

    describe('isDark', () => {
      it('should return true when theme is dark', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'dark';
        service = TestBed.inject(ThemeService);

        expect(service.isDark()).toBe(true);
      });

      it('should return false when theme is light', () => {
        mockLocalStorage[THEME_STORAGE_KEY] = 'light';
        service = TestBed.inject(ThemeService);

        expect(service.isDark()).toBe(false);
      });
    });

    describe('prefers-color-scheme detection', () => {
      it('should check prefers-color-scheme media query', () => {
        service = TestBed.inject(ThemeService);

        expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      });

      it('should respect system dark preference for first-time visitors', () => {
        matchMediaSpy.and.returnValue({ matches: true } as MediaQueryList);

        service = TestBed.inject(ThemeService);

        expect(service.isDark()).toBe(true);
      });

      it('should respect system light preference for first-time visitors', () => {
        matchMediaSpy.and.returnValue({ matches: false } as MediaQueryList);

        service = TestBed.inject(ThemeService);

        expect(service.isDark()).toBe(false);
      });
    });
  });

  describe('Server environment (SSR)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
    });

    it('should default to light theme on server', () => {
      service = TestBed.inject(ThemeService);

      expect(service.currentTheme()).toBe(ThemeMode.LIGHT);
      expect(service.isDark()).toBe(false);
    });

    it('should not access localStorage on server', () => {
      service = TestBed.inject(ThemeService);

      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it('should not apply DOM classes on server', () => {
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();

      expect(mockClassList.add).not.toHaveBeenCalled();
      expect(mockClassList.remove).not.toHaveBeenCalled();
    });

    it('should not persist to localStorage on server', () => {
      service = TestBed.inject(ThemeService);
      service.toggleTheme();
      TestBed.flushEffects();

      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });
});
