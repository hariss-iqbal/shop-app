import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PwaService } from '../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-update',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  templateUrl: './pwa-update.component.html',
  styleUrls: ['./pwa-update.component.scss']
})
export class PwaUpdateComponent {
  readonly pwaService = inject(PwaService);

  dismissInstall(): void {
    this.pwaService.installPromptAvailable.set(false);
  }
}
