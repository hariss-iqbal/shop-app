import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { NetworkStatusService } from '../../../core/services/network-status.service';

@Component({
  selector: 'app-offline-page',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './offline-page.component.html',
  styleUrls: ['./offline-page.component.scss']
})
export class OfflinePageComponent implements OnInit, OnDestroy {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly networkStatusService: NetworkStatusService
  ) { }

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
