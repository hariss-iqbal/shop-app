import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="not-found-container flex align-items-center justify-content-center" style="min-height: 60vh;">
      <div class="not-found-card flex flex-column align-items-center gap-4 p-5 text-center surface-card border-round-xl shadow-2" style="max-width: 520px;">
        <!-- Animated 404 Icon -->
        <div class="not-found-icon-wrapper">
          <div class="icon-circle">
            <i class="pi pi-search text-5xl" aria-hidden="true"></i>
          </div>
        </div>

        <!-- 404 Error Code with gradient -->
        <h1 class="error-code text-8xl font-bold m-0">404</h1>

        <!-- Page Not Found Message -->
        <h2 class="text-3xl font-semibold m-0 text-color">Page Not Found</h2>

        <!-- Description -->
        <p class="not-found-description text-lg text-color-secondary m-0 line-height-3">
          The page you are looking for does not exist or has been moved.
          Let's get you back on track.
        </p>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 justify-content-center w-full mt-2">
          <p-button
            label="Go Back"
            icon="pi pi-arrow-left"
            severity="secondary"
            [outlined]="true"
            (onClick)="navigateBack()"
            ariaLabel="Go back to the previous page"
            styleClass="flex-grow-1 sm:flex-grow-0"
          />
          <p-button
            label="Back to Catalog"
            icon="pi pi-home"
            (onClick)="navigateHome()"
            ariaLabel="Return to the catalog home page"
            styleClass="flex-grow-1 sm:flex-grow-0"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .not-found-card {
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .not-found-icon-wrapper {
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .icon-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
    }

    .error-code {
      background: linear-gradient(135deg, var(--primary-color) 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -2px;
    }

    .not-found-description {
      max-width: 380px;
    }

    :host-context(.dark-theme) {
      .icon-circle {
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        box-shadow: 0 10px 40px rgba(96, 165, 250, 0.25);
      }

      .error-code {
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .not-found-container,
      .not-found-card {
        animation: none;
      }

      .not-found-icon-wrapper {
        animation: none;
      }
    }
  `]
})
export class NotFoundPageComponent {
  private router = inject(Router);

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  navigateBack(): void {
    window.history.back();
  }
}
