import { Component } from '@angular/core';
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
  constructor(private router: Router) { }

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
