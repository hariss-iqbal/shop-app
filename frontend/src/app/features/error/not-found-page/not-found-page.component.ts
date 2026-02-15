import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './not-found-page.component.html',
  styleUrls: ['./not-found-page.component.scss']
})
export class NotFoundPageComponent {
  constructor(private router: Router) { }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  navigateBack(): void {
    window.history.back();
  }
}
