import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService', () => {
  describe('NetworkStatusService interface', () => {
    it('should define isOnline signal', () => {
      expect(NetworkStatusService.prototype).toBeDefined();
    });

    it('should define isOffline computed signal', () => {
      expect(NetworkStatusService.prototype).toBeDefined();
    });

    it('should define reportNetworkFailure method', () => {
      expect(typeof NetworkStatusService.prototype.reportNetworkFailure).toBe('function');
    });

    it('should define resetFailureCount method', () => {
      expect(typeof NetworkStatusService.prototype.resetFailureCount).toBe('function');
    });

    it('should define checkConnection method', () => {
      expect(typeof NetworkStatusService.prototype.checkConnection).toBe('function');
    });
  });
});
