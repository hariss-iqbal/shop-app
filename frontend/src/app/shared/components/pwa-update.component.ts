import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PwaService } from '../../core/services/pwa.service';
import { ShopDetailsService } from '../../core/services/shop-details.service';

@Component({
  selector: 'app-pwa-update',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  templateUrl: './pwa-update.component.html',
  styleUrls: ['./pwa-update.component.scss']
})
export class PwaUpdateComponent {
  shopName = this.shopDetailsService.shopName;

  constructor(
    public readonly pwaService: PwaService,
    private shopDetailsService: ShopDetailsService
  ) { }

  dismissInstall(): void {
    this.pwaService.installPromptAvailable.set(false);
  }
}
