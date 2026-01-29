import { Injectable, signal, computed, NgZone, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _isOnline = signal(navigator.onLine);
  private consecutiveFailures = 0;
  private readonly FAILURE_THRESHOLD = 2;

  readonly isOnline = this._isOnline.asReadonly();
  readonly isOffline = computed(() => !this._isOnline());

  constructor() {
    this.listenToNetworkEvents();
  }

  private listenToNetworkEvents(): void {
    this.ngZone.runOutsideAngular(() => {
      const online$ = fromEvent(window, 'online');
      const offline$ = fromEvent(window, 'offline');

      merge(online$, offline$)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.ngZone.run(() => {
            this._isOnline.set(navigator.onLine);
            if (navigator.onLine) {
              this.consecutiveFailures = 0;
            }
          });
        });
    });
  }

  reportNetworkFailure(): void {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD || !navigator.onLine) {
      this._isOnline.set(false);
      this.navigateToOfflinePage();
    }
  }

  resetFailureCount(): void {
    this.consecutiveFailures = 0;
  }

  private navigateToOfflinePage(): void {
    const currentUrl = this.router.url;

    if (currentUrl !== '/offline' && !currentUrl.startsWith('/auth')) {
      this.router.navigate(['/offline'], {
        queryParams: { returnUrl: currentUrl },
        replaceUrl: false
      });
    }
  }

  checkConnection(): boolean {
    const isOnline = navigator.onLine;
    this._isOnline.set(isOnline);
    return isOnline;
  }
}
