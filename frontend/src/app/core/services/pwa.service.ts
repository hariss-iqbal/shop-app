import { Injectable, signal, ApplicationRef, DestroyRef, NgZone } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, switchMap, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {

  readonly updateAvailable = signal(false);
  readonly installPromptAvailable = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor(
    private readonly swUpdate: SwUpdate,
    private readonly appRef: ApplicationRef,
    private readonly destroyRef: DestroyRef,
    private readonly ngZone: NgZone
  ) {
    this.listenForUpdates();
    this.listenForInstallPrompt();
    this.checkForUpdatesPeriodically();
  }

  applyUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.activateUpdate().then(() => {
        document.location.reload();
      });
    }
  }

  dismissUpdate(): void {
    this.updateAvailable.set(false);
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.installPromptAvailable.set(false);
    return result.outcome === 'accepted';
  }

  private listenForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateAvailable.set(true);
      });
  }

  private listenForInstallPrompt(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent<BeforeInstallPromptEvent>(window, 'beforeinstallprompt')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
          event.preventDefault();
          this.ngZone.run(() => {
            this.deferredPrompt = event;
            this.installPromptAvailable.set(true);
          });
        });

      fromEvent(window, 'appinstalled')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.ngZone.run(() => {
            this.deferredPrompt = null;
            this.installPromptAvailable.set(false);
          });
        });
    });
  }

  private checkForUpdatesPeriodically(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.appRef.isStable
      .pipe(
        first(stable => stable),
        switchMap(() => interval(6 * 60 * 60 * 1000)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.swUpdate.checkForUpdate();
      });
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}
