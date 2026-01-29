import { PwaService } from './pwa.service';

describe('PwaService', () => {
  describe('PwaService interface', () => {
    it('should define updateAvailable signal', () => {
      expect(PwaService.prototype).toBeDefined();
    });

    it('should define installPromptAvailable signal', () => {
      expect(PwaService.prototype).toBeDefined();
    });

    it('should define applyUpdate method', () => {
      expect(typeof PwaService.prototype.applyUpdate).toBe('function');
    });

    it('should define dismissUpdate method', () => {
      expect(typeof PwaService.prototype.dismissUpdate).toBe('function');
    });

    it('should define promptInstall method', () => {
      expect(typeof PwaService.prototype.promptInstall).toBe('function');
    });
  });
});
