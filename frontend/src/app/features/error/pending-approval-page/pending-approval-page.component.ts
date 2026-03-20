import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-pending-approval-page',
  imports: [ButtonModule, CardModule],
  templateUrl: './pending-approval-page.component.html',
  styleUrls: ['../access-denied-page/access-denied-page.component.scss']
})
export class PendingApprovalPageComponent {
  constructor(private router: Router) { }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
