import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [ButtonModule, RouterLink],
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss']
})
export class ErrorPageComponent {
  private router = inject(Router);

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  navigateBack(): void {
    window.history.back();
  }

  refreshPage(): void {
    window.location.reload();
  }
}
