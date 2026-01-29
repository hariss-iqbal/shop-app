import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { NetworkStatusService } from '../../../core/services/network-status.service';

@Component({
  selector: 'app-offline-page',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="offline-page">
      <div class="offline-content">
        <div class="offline-icon-container">
          <div class="offline-icon-bg">
            <i class="pi pi-wifi-slash"></i>
          </div>
          <div class="offline-pulse"></div>
        </div>

        <h1 class="offline-title">You're Offline</h1>

        <p class="offline-message">
          It looks like you've lost your internet connection.
          @if (isOnline()) {
            <span class="text-green-500 font-semibold">Connection restored!</span>
          }
        </p>

        <p class="offline-hint">
          Previously viewed catalog pages may still be available from cache.
        </p>

        <div class="offline-actions">
          <p-button
            [label]="isOnline() ? 'Go Back' : 'Try Again'"
            [icon]="isOnline() ? 'pi pi-arrow-left' : 'pi pi-refresh'"
            [loading]="isRetrying()"
            (onClick)="retry()"
            styleClass="p-button-lg"
          />
          <p-button
            label="Browse Catalog"
            icon="pi pi-shopping-bag"
            severity="secondary"
            [outlined]="true"
            (onClick)="goToCatalog()"
            styleClass="p-button-lg"
          />
        </div>

        <div class="offline-status">
          <span class="status-dot" [class.online]="isOnline()"></span>
          <span class="status-text">
            {{ isOnline() ? 'Back online' : 'No internet connection' }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offline-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-100) 100%);
      padding: 1rem;
    }

    .offline-content {
      text-align: center;
      max-width: 420px;
      width: 100%;
    }

    .offline-icon-container {
      position: relative;
      display: inline-block;
      margin-bottom: 2rem;
    }

    .offline-icon-bg {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--surface-200) 0%, var(--surface-300) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
    }

    .offline-icon-bg i {
      font-size: 3.5rem;
      color: var(--text-color-secondary);
    }

    .offline-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: var(--primary-color);
      opacity: 0.15;
      animation: pulse 2s ease-out infinite;
    }

    @keyframes pulse {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.15;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
      }
    }

    .offline-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0 0 1rem 0;
    }

    .offline-message {
      font-size: 1.125rem;
      color: var(--text-color-secondary);
      margin: 0 0 0.5rem 0;
      line-height: 1.6;
    }

    .offline-hint {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin: 0 0 2rem 0;
      opacity: 0.8;
    }

    .offline-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    @media (min-width: 480px) {
      .offline-actions {
        flex-direction: row;
        justify-content: center;
      }
    }

    .offline-actions :deep(.p-button) {
      width: 100%;
    }

    @media (min-width: 480px) {
      .offline-actions :deep(.p-button) {
        width: auto;
        min-width: 160px;
      }
    }

    .offline-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface-card);
      border-radius: 2rem;
      border: 1px solid var(--surface-border);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--red-500);
      animation: blink 1.5s ease-in-out infinite;
    }

    .status-dot.online {
      background: var(--green-500);
      animation: none;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .status-text {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
  `]
})
export class OfflinePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly networkStatusService = inject(NetworkStatusService);

  readonly isOnline = this.networkStatusService.isOnline;
  readonly isRetrying = signal(false);

  private returnUrl: string | null = null;
  private connectionCheckInterval: number | null = null;

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.startConnectionCheck();
  }

  ngOnDestroy(): void {
    this.stopConnectionCheck();
  }

  private startConnectionCheck(): void {
    this.connectionCheckInterval = window.setInterval(() => {
      this.networkStatusService.checkConnection();
    }, 3000);
  }

  private stopConnectionCheck(): void {
    if (this.connectionCheckInterval !== null) {
      window.clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  retry(): void {
    this.isRetrying.set(true);

    if (this.networkStatusService.checkConnection()) {
      this.networkStatusService.resetFailureCount();

      if (this.returnUrl && this.returnUrl !== '/offline') {
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      setTimeout(() => {
        this.isRetrying.set(false);
      }, 1000);
    }
  }

  goToCatalog(): void {
    this.router.navigate(['/']);
  }
}
