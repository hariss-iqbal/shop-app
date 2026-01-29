import { Component, inject, signal, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { ContactMessageService } from '../../../core/services/contact-message.service';
import { SpamPreventionService } from '../../../core/services/spam-prevention.service';
import { RecaptchaService } from '../../../core/services/recaptcha.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { environment } from '../../../../environments/environment';
import { CONTACT_MESSAGE_CONSTRAINTS } from '../../../constants/validation.constants';

@Component({
  selector: 'app-contact',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    DividerModule,
    MessageModule,
    SkeletonModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  private contactMessageService = inject(ContactMessageService);
  private spamPreventionService = inject(SpamPreventionService);
  private recaptchaService = inject(RecaptchaService);
  private toastService = inject(ToastService);
  private seoService = inject(SeoService);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('mapIframe') mapIframe?: ElementRef<HTMLIFrameElement>;

  submitting = signal(false);
  submitted = signal(false);
  rateLimited = signal(false);
  rateLimitCountdown = signal(0);
  mapLoadFailed = signal(false);
  mapVisible = signal(false);
  mapLoading = signal(true);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private mapObserver: IntersectionObserver | null = null;
  private mapLoadTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly businessInfo = environment.businessInfo;
  readonly whatsappUrl = `https://wa.me/${environment.whatsapp.phoneNumber}`;
  readonly mapEmbedUrl: SafeResourceUrl;

  /** Validation constraints for contact form fields (F-058: Input Sanitization) */
  readonly constraints = CONTACT_MESSAGE_CONSTRAINTS;

  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(this.constraints.NAME_MAX)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
    phone: ['', [Validators.maxLength(this.constraints.PHONE_MAX)]],
    subject: ['', [Validators.maxLength(this.constraints.SUBJECT_MAX)]],
    message: ['', [Validators.required, Validators.maxLength(this.constraints.MESSAGE_MAX)]],
    website: ['']
  });

  constructor() {
    /**
     * Security Note (F-058: Input Sanitization and XSS Prevention):
     * bypassSecurityTrustResourceUrl() is used here intentionally for the Google Maps embed URL.
     * This is SAFE because:
     * 1. The URL comes from environment.businessInfo.mapEmbedUrl (trusted configuration)
     * 2. It is NOT user-supplied input - it's a static URL from the application's environment config
     * 3. Google Maps embeds require this bypass as Angular blocks all resource URLs by default
     *
     * DO NOT use bypassSecurityTrust* methods with user-supplied input.
     */
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.businessInfo.mapEmbedUrl
    );
  }

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Contact Us',
      description: 'Get in touch with Phone Shop. Send us a message for inquiries about our phones, pricing, or any questions you may have.',
      url: '/contact'
    });

    this.updateRateLimitStatus();

    if (this.recaptchaService.isEnabled()) {
      this.recaptchaService.initialize();
    }
  }

  ngOnDestroy(): void {
    this.clearCountdownInterval();
    this.cleanupMapObserver();
    if (this.mapLoadTimeout) {
      clearTimeout(this.mapLoadTimeout);
      this.mapLoadTimeout = null;
    }
  }

  private cleanupMapObserver(): void {
    if (this.mapObserver) {
      this.mapObserver.disconnect();
      this.mapObserver = null;
    }
  }

  private updateRateLimitStatus(): void {
    const isLimited = this.spamPreventionService.isRateLimited();
    this.rateLimited.set(isLimited);

    if (isLimited) {
      this.startCountdown();
    } else {
      this.clearCountdownInterval();
      this.rateLimitCountdown.set(0);
    }
  }

  private startCountdown(): void {
    this.clearCountdownInterval();
    this.rateLimitCountdown.set(this.spamPreventionService.getRemainingWaitSeconds());

    this.countdownInterval = setInterval(() => {
      const remaining = this.spamPreventionService.getRemainingWaitSeconds();
      this.rateLimitCountdown.set(remaining);

      if (remaining <= 0) {
        this.rateLimited.set(false);
        this.clearCountdownInterval();
      }
    }, 1000);
  }

  private clearCountdownInterval(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  ngAfterViewInit(): void {
    this.initializeMapLazyLoading();
  }

  private initializeMapLazyLoading(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.mapContainer?.nativeElement) {
      return;
    }

    // Use Intersection Observer for true lazy loading
    if ('IntersectionObserver' in window) {
      this.mapObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && !this.mapVisible()) {
            this.mapVisible.set(true);
            this.cleanupMapObserver();
            // Start timeout for map load detection
            this.startMapLoadTimeout();
          }
        },
        {
          root: null,
          rootMargin: '100px', // Start loading slightly before in view
          threshold: 0.1
        }
      );
      this.mapObserver.observe(this.mapContainer.nativeElement);
    } else {
      // Fallback for browsers without Intersection Observer
      this.mapVisible.set(true);
      this.startMapLoadTimeout();
    }
  }

  private startMapLoadTimeout(): void {
    // Set a timeout to detect if map fails to load
    this.mapLoadTimeout = setTimeout(() => {
      if (this.mapLoading()) {
        // Map hasn't loaded within timeout, show fallback
        this.mapLoadFailed.set(true);
        this.mapLoading.set(false);
      }
    }, 10000); // 10 second timeout
  }

  onMapLoad(): void {
    if (this.mapLoadTimeout) {
      clearTimeout(this.mapLoadTimeout);
      this.mapLoadTimeout = null;
    }
    this.mapLoading.set(false);
    // Iframe loaded - check if it's an error page
    if (this.mapIframe?.nativeElement) {
      try {
        const iframe = this.mapIframe.nativeElement;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc && iframeDoc.body && iframeDoc.body.innerHTML === '') {
          this.mapLoadFailed.set(true);
        }
      } catch {
        // Cross-origin access is expected for Google Maps - iframe loaded successfully
      }
    }
  }

  onMapLoadError(): void {
    if (this.mapLoadTimeout) {
      clearTimeout(this.mapLoadTimeout);
      this.mapLoadTimeout = null;
    }
    this.mapLoadFailed.set(true);
    this.mapLoading.set(false);
  }

  isInvalid(field: string): boolean {
    const control = this.contactForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.spamPreventionService.isRateLimited()) {
      this.updateRateLimitStatus();
      return;
    }

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const formValue = this.contactForm.value;
      await this.contactMessageService.submitContactMessage({
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone || null,
        subject: formValue.subject || null,
        message: formValue.message,
        honeypot: formValue.website || ''
      });

      this.toastService.success('Message Sent', 'Thank you! We will get back to you soon.');
      this.submitted.set(true);
      this.contactForm.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      this.toastService.error('Error', message);
    } finally {
      this.submitting.set(false);
      this.updateRateLimitStatus();
    }
  }

  resetForm(): void {
    this.submitted.set(false);
    this.contactForm.reset();
    this.updateRateLimitStatus();
  }

  formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs} second${secs !== 1 ? 's' : ''}`;
  }
}
