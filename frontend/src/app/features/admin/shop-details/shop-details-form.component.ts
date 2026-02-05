import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-shop-details-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    InputNumberModule
  ],
  templateUrl: './shop-details-form.component.html'
})
export class ShopDetailsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private shopDetailsService = inject(ShopDetailsService);
  private toastService = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  private initForm(): void {
    this.form = this.fb.group({
      shopName: ['Spring Mobiles', Validators.required],
      tagline: [''],
      description: [''],
      address: [''],
      phoneDisplay: [''],
      phoneLink: [''],
      email: [''],
      whatsappNumber: [''],
      weekdayHours: [''],
      weekendHours: [''],
      mapEmbedUrl: [''],
      mapSearchUrl: [''],
      facebookUrl: [''],
      instagramUrl: [''],
      twitterUrl: [''],
      websiteUrl: [''],
      currencyCode: ['PKR'],
      currencyLocale: ['en-PK'],
      currencySymbol: ['Rs.'],
      currencyDecimals: [0],
      logoUrl: ['']
    });
  }

  private async loadData(): Promise<void> {
    try {
      const details = await this.shopDetailsService.getShopDetails();
      if (details) {
        this.form.patchValue({
          shopName: details.shopName,
          tagline: details.tagline || '',
          description: details.description || '',
          address: details.address || '',
          phoneDisplay: details.phoneDisplay || '',
          phoneLink: details.phoneLink || '',
          email: details.email || '',
          whatsappNumber: details.whatsappNumber || '',
          weekdayHours: details.weekdayHours || '',
          weekendHours: details.weekendHours || '',
          mapEmbedUrl: details.mapEmbedUrl || '',
          mapSearchUrl: details.mapSearchUrl || '',
          facebookUrl: details.facebookUrl || '',
          instagramUrl: details.instagramUrl || '',
          twitterUrl: details.twitterUrl || '',
          websiteUrl: details.websiteUrl || '',
          currencyCode: details.currencyCode,
          currencyLocale: details.currencyLocale,
          currencySymbol: details.currencySymbol,
          currencyDecimals: details.currencyDecimals,
          logoUrl: details.logoUrl || ''
        });
      }
      // null return is expected — form keeps defaults
    } catch {
      // Only unexpected errors reach here; don't alarm the user
      console.warn('ShopDetailsForm: Unexpected error loading shop details');
    } finally {
      this.loading.set(false);
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const formValue = this.form.value;
      await this.shopDetailsService.saveShopDetails({
        shopName: formValue.shopName,
        tagline: formValue.tagline || null,
        description: formValue.description || null,
        address: formValue.address || null,
        phoneDisplay: formValue.phoneDisplay || null,
        phoneLink: formValue.phoneLink || null,
        email: formValue.email || null,
        whatsappNumber: formValue.whatsappNumber || null,
        weekdayHours: formValue.weekdayHours || null,
        weekendHours: formValue.weekendHours || null,
        mapEmbedUrl: formValue.mapEmbedUrl || null,
        mapSearchUrl: formValue.mapSearchUrl || null,
        facebookUrl: formValue.facebookUrl || null,
        instagramUrl: formValue.instagramUrl || null,
        twitterUrl: formValue.twitterUrl || null,
        websiteUrl: formValue.websiteUrl || null,
        currencyCode: formValue.currencyCode,
        currencyLocale: formValue.currencyLocale,
        currencySymbol: formValue.currencySymbol,
        currencyDecimals: formValue.currencyDecimals,
        logoUrl: formValue.logoUrl || null
      });
      this.toastService.success('Saved', 'Shop details updated successfully');
    } catch (error) {
      this.toastService.error('Error', 'Failed to save shop details');
    } finally {
      this.saving.set(false);
    }
  }
}
