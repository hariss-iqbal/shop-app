import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';

import { PhoneService } from '../../../../core/services/phone.service';
import { SaleService } from '../../../../core/services/sale.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ReceiptStorageService } from '../../../../core/services/receipt-storage.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { ReceiptService } from '../../../../shared/services/receipt.service';
import { WhatsAppService } from '../../../../shared/services/whatsapp.service';
import { PaymentMethodSelectorComponent } from '../../../../shared/components/payment-method-selector/payment-method-selector.component';
import { DiscountPanelComponent, DiscountAppliedEvent } from '../../../../shared/components/discount-panel/discount-panel.component';
import { BarcodeScannerComponent } from '../../../../shared/components/barcode-scanner/barcode-scanner.component';
import { LoyaltyRedemptionPanelComponent } from '../../../../shared/components/loyalty-redemption-panel/loyalty-redemption-panel.component';
import { LoyaltyService } from '../../../../core/services/loyalty.service';
import { BarcodeScanResult } from '../../../../core/services/barcode-scanner.service';
import { PointsEarnedResult } from '../../../../models/loyalty.model';
import { ViewportService } from '../../../../core/services/viewport.service';
import { TaxCalculationService } from '../../../../core/services/tax-calculation.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { Phone } from '../../../../models/phone.model';
import { CartItem, CartSummary, CustomerInfo, ReceiptData, InventoryAvailabilityResult, AppliedDiscountInfo } from '../../../../models/sale.model';
import { PaymentDetail, SplitPaymentValidation } from '../../../../models/payment.model';
import { CustomerWithStats } from '../../../../models/customer.model';
import { PhoneStatus } from '../../../../enums';
import { PrintReceiptDialogComponent } from '../print-receipt-dialog/print-receipt-dialog.component';
import { CustomerFormDialogComponent } from '../../customers/customer-form-dialog.component';

/**
 * Sale Create Component - Rebuilt without signals
 * Feature: F-008 Automatic Inventory Deduction
 * Feature: F-018 Payment Method Integration
 * Feature: F-023 Discount and Coupon Management
 * Feature: F-022 Loyalty Points Integration
 * Handles sale creation with inventory availability checks and atomic deduction
 */
@Component({
  selector: 'app-sale-create',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    FloatLabelModule,
    DividerModule,
    TagModule,
    ImageModule,
    TableModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
    ProgressSpinnerModule,
    DialogModule,
    CurrencyPipe,
    PrintReceiptDialogComponent,
    PaymentMethodSelectorComponent,
    CustomerFormDialogComponent,
    DiscountPanelComponent,
    BarcodeScannerComponent,
    LoyaltyRedemptionPanelComponent
  ],
  templateUrl: './sale-create.component.html'
})
export class SaleCreateComponent implements OnInit, OnDestroy {
  private phoneService = inject(PhoneService);
  private saleService = inject(SaleService);
  private customerService = inject(CustomerService);
  private sanitizer = inject(InputSanitizationService);
  private receiptStorageService = inject(ReceiptStorageService);
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private receiptService = inject(ReceiptService);
  private whatsAppService = inject(WhatsAppService);
  private router = inject(Router);
  private taxCalculationService = inject(TaxCalculationService);
  private loyaltyService = inject(LoyaltyService);
  readonly viewportService = inject(ViewportService);
  private supabaseService = inject(SupabaseService);
  private currencyService = inject(CurrencyService);

  // Expose enum to template
  readonly PhoneStatus = PhoneStatus;

  // Search state - using regular properties instead of signals
  searchQuery = '';
  showSearchResults = false;
  filteredPhones: any[] = [];
  searchLoading = false;
  saving = false;

  // Cart state
  cartItems: CartItem[] = [];

  // Inventory availability state (F-008)
  checkingInventory = false;
  inventoryWarnings: Array<{ phoneId: string; message: string }> = [];
  inventoryError: string | null = null;

  // Payment state (F-018)
  payments: PaymentDetail[] = [];
  paymentValidation: SplitPaymentValidation = { isValid: true, totalPaid: 0, amountDue: 0, difference: 0, message: '' };

  // Discount state (F-023)
  appliedDiscount: DiscountAppliedEvent | null = null;

  // Loyalty state (F-022)
  loyaltyRedemption: { points: number; discount: number } | null = null;
  loyaltyPointsEarned: PointsEarnedResult | null = null;

  // Sale info
  saleDate: Date = new Date();
  customerInfo: CustomerInfo = { name: '', phone: '', email: '' };
  notes = '';

  // Receipt dialog
  showReceiptDialog = false;
  completedReceiptData: ReceiptData | null = null;

  // Previous sales dialog state
  showPreviousSalesDialog = false;
  customerPreviousSales: any[] = [];
  loadingPreviousSales = false;

  // Customer lookup state (F-019)
  customerLookupLoading = false;
  customerLookupStatus: 'idle' | 'found' | 'not_found' = 'idle';
  selectedCustomer: CustomerWithStats | null = null;
  showCustomerFormDialog = false;

  // Cart summary - manually calculated
  cartSummary: CartSummary = {
    subtotal: 0,
    taxAmount: 0,
    grandTotal: 0,
    totalProfit: 0,
    totalCost: 0,
    itemCount: 0,
    discountAmount: 0,
    finalTotal: 0
  };

  // Timers for cleanup
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private customerLookupTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.saleDate = new Date();
    this.updateCartSummary();
  }

  ngOnDestroy(): void {
    // Clean up timers
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    if (this.customerLookupTimeout) {
      clearTimeout(this.customerLookupTimeout);
    }
  }

  /**
   * Update cart summary - call this whenever cart changes
   */
  private updateCartSummary(): void {
    const items = this.cartItems;

    // Use TaxCalculationService for proper tax calculations (F-012)
    const taxSummary = this.taxCalculationService.calculateCartSummary(items);

    // Calculate discount amount (F-023)
    const discountAmount = this.appliedDiscount ? this.appliedDiscount.discountAmount : 0;

    // Calculate loyalty redemption discount (F-022)
    const loyaltyDiscount = this.loyaltyRedemption ? this.loyaltyRedemption.discount : 0;

    // Final total after all discounts
    const finalTotal = taxSummary.grandTotal - discountAmount - loyaltyDiscount;

    // Adjust profit to account for discounts
    const totalProfit = (taxSummary.subtotal - discountAmount - loyaltyDiscount) - taxSummary.totalCost;

    this.cartSummary = {
      subtotal: taxSummary.subtotal,
      taxAmount: taxSummary.taxAmount,
      grandTotal: taxSummary.grandTotal,
      totalProfit,
      totalCost: taxSummary.totalCost,
      itemCount: taxSummary.itemCount,
      discountAmount: discountAmount + loyaltyDiscount,
      finalTotal
    };
  }

  onProductClick(phone: any): void {
    this.addPhoneToCart(phone);
  }

  onSearchInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value.toLowerCase().trim();

    // Clear previous timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (query.length < 2) {
      this.filteredPhones = [];
      this.showSearchResults = false;
      return;
    }

    // Debounce search
    this.searchDebounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  async performSearch(query: string): Promise<void> {
    this.searchLoading = true;

    try {
      // First, find matching brand IDs
      const { data: matchingBrands } = await this.supabaseService.client
        .from('brands')
        .select('id')
        .ilike('name', `%${query}%`);

      const brandIds = matchingBrands?.map((b: any) => b.id) || [];

      // Then search phones by model OR matching brand IDs
      const { data: phones, error } = await this.supabaseService.client
        .from('phones')
        .select(`
          id,
          brand_id,
          model,
          storage_gb,
          color,
          imei,
          selling_price,
          cost_price,
          condition,
          status,
          tax_rate,
          is_tax_inclusive,
          is_tax_exempt,
          created_at,
          brand:brands!brand_id(id, name, logo_url)
        `)
        .eq('status', 'available')
        .or(brandIds.length > 0
          ? `model.ilike.%${query}%,brand_id.in.(${brandIds.join(',')})`
          : `model.ilike.%${query}%`
        )
        .limit(20);

      if (error) {
        throw new Error(error.message);
      }

      const existingIds = new Set(this.cartItems.map(item => item.phoneId));

      this.filteredPhones = (phones || [])
        .filter((phone: any) => !existingIds.has(phone.id))
        .map((phone: any) => ({
          id: phone.id,
          phoneId: phone.id,
          brandId: phone.brand_id,
          brandName: phone.brand?.name || '',
          brandLogoUrl: phone.brand?.logo_url || null,
          model: phone.model,
          storageGb: phone.storage_gb,
          color: phone.color,
          imei: phone.imei,
          sellingPrice: phone.selling_price,
          costPrice: phone.cost_price,
          condition: phone.condition,
          status: phone.status,
          taxRate: phone.tax_rate ?? 0,
          isTaxInclusive: phone.is_tax_inclusive ?? false,
          isTaxExempt: phone.is_tax_exempt ?? false,
          primaryImageUrl: null,
          createdAt: phone.created_at,
          updatedAt: null,
          profitMargin: 0
        }));

      this.showSearchResults = true;
    } catch (error) {
      console.error('Error searching phones:', error);
      this.toastService.error('Error', 'Failed to search products');
      this.filteredPhones = [];
      this.showSearchResults = false;
    } finally {
      this.searchLoading = false;
    }
  }

  private addPhoneToCart(phone: any): void {
    if (!phone) return;

    const existingIds = new Set(this.cartItems.map(item => item.phoneId));
    if (existingIds.has(phone.id)) {
      this.toastService.warn('Already in Cart', 'This product is already in the cart');
      return;
    }

    try {
      // Create minimal phone object for cart item creation
      const minimalPhone: Phone = {
        id: phone.id,
        brandId: phone.brandId || phone.brand_id,
        brandName: phone.brandName || phone.brand?.name || '',
        brandLogoUrl: phone.brandLogoUrl || phone.brand?.logo_url || null,
        model: phone.model,
        storageGb: phone.storageGb ?? phone.storage_gb ?? null,
        ramGb: phone.ramGb ?? phone.ram_gb ?? null,
        color: phone.color ?? null,
        condition: phone.condition,
        batteryHealth: phone.batteryHealth ?? phone.battery_health ?? null,
        imei: phone.imei ?? null,
        sellingPrice: phone.sellingPrice ?? phone.selling_price,
        costPrice: phone.costPrice ?? phone.cost_price,
        profitMargin: 0,
        status: phone.status,
        taxRate: phone.taxRate ?? phone.tax_rate ?? 0,
        isTaxInclusive: phone.isTaxInclusive ?? phone.is_tax_inclusive ?? false,
        isTaxExempt: phone.isTaxExempt ?? phone.is_tax_exempt ?? false,
        description: null,
        purchaseDate: null,
        supplierId: null,
        supplierName: null,
        notes: null,
        primaryImageUrl: null,
        conditionRating: phone.conditionRating ?? phone.condition_rating ?? null,
        ptaStatus: phone.ptaStatus ?? phone.pta_status ?? null,
        createdAt: phone.createdAt ?? phone.created_at ?? new Date().toISOString(),
        updatedAt: null
      };

      // Use TaxCalculationService to properly calculate tax (F-012)
      const cartItem = this.taxCalculationService.phoneToCartItem(minimalPhone);

      // Add to cart - simple array push
      this.cartItems = [...this.cartItems, cartItem];

      // Clear search
      this.filteredPhones = [];
      this.showSearchResults = false;
      this.searchQuery = '';

      // Update summary
      this.updateCartSummary();

      this.toastService.success('Added to Cart', `${minimalPhone.brandName} ${minimalPhone.model} added to cart`);

      // Check inventory availability after adding item (fire and forget, don't block)
      this.checkInventoryAvailability().catch(err => {
        console.error('Inventory check failed:', err);
      });
    } catch (error) {
      console.error('Error adding product to cart:', error);
      this.toastService.error('Error', 'Failed to add product to cart');
    }
  }

  onRemoveItem(index: number): void {
    const item = this.cartItems[index];
    this.cartItems = this.cartItems.filter((_, i) => i !== index);
    this.updateCartSummary();
    this.toastService.info('Removed', `${item.brandName} ${item.model} removed from cart`);

    // Re-check inventory availability after removing item
    if (this.cartItems.length > 0) {
      this.checkInventoryAvailability();
    } else {
      this.inventoryWarnings = [];
      this.inventoryError = null;
    }
  }

  async onClearCart(): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      header: 'Clear Cart',
      message: 'Are you sure you want to remove all items from the cart?',
      acceptLabel: 'Clear',
      rejectLabel: 'Cancel',
      icon: 'pi pi-trash'
    });

    if (confirmed) {
      this.cartItems = [];
      this.updateCartSummary();
      this.inventoryWarnings = [];
      this.inventoryError = null;
      this.appliedDiscount = null; // Clear discount when cart is cleared (F-023)
      this.toastService.info('Cart Cleared', 'All items have been removed from the cart');
    }
  }

  /**
   * Recalculate tax when sale price changes
   * Feature: F-012 Tax Calculation and Compliance
   */
  onSalePriceChange(): void {
    // Recalculate tax for all items in place (don't create new array to avoid re-render loop)
    for (const item of this.cartItems) {
      const taxCalc = this.taxCalculationService.calculateItemTax(
        item.salePrice,
        item.taxRate,
        item.isTaxInclusive,
        item.isTaxExempt,
        1
      );
      item.basePrice = taxCalc.basePrice;
      item.taxAmount = taxCalc.taxAmount;
    }
    this.updateCartSummary();
  }

  getItemProfit(item: CartItem): number {
    return item.salePrice - item.costPrice;
  }

  isFormValid(): boolean {
    return this.cartItems.length > 0 && this.saleDate !== null && this.paymentValidation.isValid;
  }

  /**
   * Handle payment changes from the payment selector
   * Feature: F-018 Payment Method Integration
   */
  onPaymentsChange(payments: PaymentDetail[]): void {
    this.payments = payments;
  }

  /**
   * Handle payment validation changes
   * Feature: F-018 Payment Method Integration
   */
  onPaymentValidationChange(validation: SplitPaymentValidation): void {
    this.paymentValidation = validation;
  }

  /**
   * Handle discount applied event
   * Feature: F-023 Discount and Coupon Management
   */
  onDiscountApplied(event: DiscountAppliedEvent): void {
    this.appliedDiscount = event;
    this.updateCartSummary();

    let message = `Discount of ${this.formatCurrency(event.discountAmount)} applied`;
    if (event.couponCode) {
      message = `Coupon "${event.couponCode}" applied - ${this.formatCurrency(event.discountAmount)} off`;
    }
    this.toastService.success('Discount Applied', message);
  }

  /**
   * Handle discount removed event
   * Feature: F-023 Discount and Coupon Management
   */
  onDiscountRemoved(): void {
    this.appliedDiscount = null;
    this.updateCartSummary();
    this.toastService.info('Discount Removed', 'The discount has been removed from this sale');
  }

  /**
   * Handle loyalty redemption changes
   * Feature: F-022 Loyalty Points Integration
   */
  onLoyaltyRedemptionChange(event: { points: number; discount: number }): void {
    if (event.points > 0 && event.discount > 0) {
      this.loyaltyRedemption = event;
    } else {
      this.loyaltyRedemption = null;
    }
    this.updateCartSummary();
  }

  /**
   * Handle request to enroll customer in loyalty program
   * Feature: F-022 Loyalty Points Integration
   */
  async onEnrollCustomerInLoyalty(): Promise<void> {
    if (!this.selectedCustomer) {
      this.toastService.warn('No Customer', 'Please select a customer first');
      return;
    }

    try {
      await this.loyaltyService.enrollCustomer({ customerId: this.selectedCustomer.id });
      this.toastService.success('Enrolled', `${this.selectedCustomer.name} is now enrolled in the loyalty program!`);
      // Force refresh of the loyalty panel by re-selecting the customer
      const currentCustomer = this.selectedCustomer;
      this.selectedCustomer = null;
      setTimeout(() => {
        this.selectedCustomer = currentCustomer;
      }, 100);
    } catch (error) {
      console.error('Failed to enroll customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to enroll customer';
      this.toastService.error('Enrollment Failed', errorMessage);
    }
  }

  /**
   * Check inventory availability for all items in cart
   * Feature: F-008 Automatic Inventory Deduction
   */
  async checkInventoryAvailability(): Promise<void> {
    if (this.cartItems.length === 0) return;

    this.checkingInventory = true;
    this.inventoryError = null;
    this.inventoryWarnings = [];

    try {
      const phoneIds = this.cartItems.map(item => item.phoneId);
      const result: InventoryAvailabilityResult = await this.saleService.checkInventoryAvailability(phoneIds);

      if (!result.allAvailable && !result.allowOversell) {
        // Find unavailable items
        const unavailablePhones = result.phones.filter(p => !p.available);
        if (unavailablePhones.length > 0) {
          this.inventoryError =
            `Some items are not available: ${unavailablePhones.map(p => p.model).join(', ')}`;
        }
      }

      if (result.hasWarnings) {
        this.inventoryWarnings = result.warnings;
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      this.inventoryError = 'Failed to verify inventory availability';
    } finally {
      this.checkingInventory = false;
    }
  }

  async onCompleteSale(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }

    const summary = this.cartSummary;

    // Build confirmation message (F-023: use finalTotal to account for discount)
    let confirmMessage = `Confirm sale of ${this.cartItems.length} item(s) for ${this.formatCurrency(summary.finalTotal)}?`;

    if (this.appliedDiscount) {
      confirmMessage += `\n\nDiscount applied: ${this.formatCurrency(this.appliedDiscount.discountAmount)} off`;
      if (this.appliedDiscount.couponCode) {
        confirmMessage += ` (${this.appliedDiscount.couponCode})`;
      }
    }

    if (this.inventoryWarnings.length > 0) {
      confirmMessage += `\n\nNote: ${this.inventoryWarnings.length} item(s) have warnings but sale can proceed.`;
    }

    const confirmed = await this.confirmDialogService.confirm({
      header: 'Complete Sale',
      message: confirmMessage,
      acceptLabel: 'Complete Sale',
      rejectLabel: 'Cancel',
      icon: 'pi pi-check-circle',
      acceptButtonStyleClass: 'p-button-success'
    });

    if (!confirmed) return;

    this.saving = true;

    try {
      const sanitizedCustomerInfo = {
        name: this.sanitizer.sanitize(this.customerInfo.name),
        phone: this.sanitizer.sanitize(this.customerInfo.phone),
        email: this.customerInfo.email.trim()
      };
      const sanitizedNotes = this.sanitizer.sanitizeOrNull(this.notes);

      // Prepare discount info for the sale transaction (F-023)
      const discountInfo: AppliedDiscountInfo | null = this.appliedDiscount ? {
        discountType: this.appliedDiscount.discountType,
        discountValue: this.appliedDiscount.discountValue,
        discountAmount: this.appliedDiscount.discountAmount,
        couponId: this.appliedDiscount.couponId,
        couponCode: this.appliedDiscount.couponCode,
        requiresManagerApproval: this.appliedDiscount.requiresManagerApproval,
        managerApprovedBy: this.appliedDiscount.managerApprovedBy,
        managerApprovalReason: this.appliedDiscount.managerApprovalReason
      } : null;

      // Use the new atomic batch sale with inventory deduction, payments, and discount
      const result = await this.saleService.completeSaleTransaction({
        items: this.cartItems.map(item => ({
          phoneId: item.phoneId,
          salePrice: item.salePrice
        })),
        customerInfo: sanitizedCustomerInfo,
        saleDate: this.formatDate(this.saleDate),
        notes: sanitizedNotes,
        payments: this.payments,
        discount: discountInfo
      });

      if (!result.success) {
        this.toastService.error('Sale Failed', result.error || 'Failed to complete sale');
        return;
      }

      // Show success message with inventory deduction status (F-023: use finalTotal)
      let successMessage = `Successfully sold ${this.cartItems.length} item(s) for ${this.formatCurrency(summary.finalTotal)}`;
      if (result.inventoryDeducted) {
        successMessage += '. Inventory updated.';
      }
      if (this.appliedDiscount) {
        successMessage += ` (saved ${this.formatCurrency(this.appliedDiscount.discountAmount)})`;
      }

      this.toastService.success('Sale Completed', successMessage);

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        for (const warning of result.warnings) {
          this.toastService.warn('Inventory Warning', warning.warning);
        }
      }

      // Build receipt data with sequential receipt number (F-011)
      const paymentSummary = this.paymentService.toPaymentSummary(this.payments);

      const { receiptData } = await this.receiptService.buildReceiptDataFromCartAsync(
        this.cartItems,
        summary,
        sanitizedCustomerInfo,
        this.saleDate,
        sanitizedNotes,
        'DEFAULT',
        paymentSummary
      );

      // Apply discount info to receipt data (F-023)
      if (this.appliedDiscount) {
        receiptData.discount = {
          discountType: this.appliedDiscount.discountType,
          discountValue: this.appliedDiscount.discountValue,
          discountAmount: this.appliedDiscount.discountAmount,
          couponCode: this.appliedDiscount.couponCode
        };
        receiptData.originalTotal = summary.grandTotal;
        receiptData.finalTotal = summary.finalTotal;
      }

      // Apply loyalty info to receipt data (F-022)
      const loyaltyPointsInfo = await this.getLoyaltyInfoForReceipt(this.loyaltyRedemption);
      if (loyaltyPointsInfo) {
        receiptData.loyalty = loyaltyPointsInfo;
      }

      const saleIds = result.sales?.map(sale => sale.id) || [];
      try {
        await this.receiptStorageService.createReceiptFromReceiptData(receiptData, saleIds);
      } catch (receiptError) {
        console.error('Failed to store receipt:', receiptError);
      }

      this.completedReceiptData = receiptData;
      this.showReceiptDialog = true;
    } catch (error) {
      console.error('Error completing sale:', error);
      this.toastService.error('Error', 'Failed to complete sale. Please try again.');
    } finally {
      this.saving = false;
    }
  }

  onReceiptDialogClose(visible: boolean): void {
    this.showReceiptDialog = visible;
    if (!visible) {
      this.router.navigate(['/admin/sales']);
    }
  }

  onWhatsAppSent(event: { phoneNumber: string; receiptNumber: string }): void {
    this.toastService.success(
      'WhatsApp Receipt',
      `Receipt ${event.receiptNumber} sent to ${this.whatsAppService.formatPhoneDisplay(event.phoneNumber)}`
    );
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatCurrency(value: number): string {
    return this.currencyService.format(value, { minDecimals: 2, maxDecimals: 2 });
  }

  /**
   * Get loyalty information for receipt
   * Feature: F-022 Loyalty Points Integration
   */
  private async getLoyaltyInfoForReceipt(
    redemption: { points: number; discount: number } | null
  ): Promise<{
    pointsEarned: number;
    pointsRedeemed: number;
    redemptionDiscount: number;
    balanceAfter: number;
    tier: string;
    tierMultiplier: number;
  } | null> {
    if (!this.selectedCustomer) return null;

    try {
      // Calculate points that will be earned
      const earnedResult = await this.loyaltyService.calculatePointsEarned(
        this.selectedCustomer.id,
        this.cartSummary.finalTotal
      );

      if (!earnedResult.isEnabled || !earnedResult.isEnrolled) {
        return null;
      }

      // Calculate balance after transaction
      const currentBalance = earnedResult.currentBalance || 0;
      const pointsRedeemed = redemption?.points || 0;
      const pointsEarned = earnedResult.pointsToEarn || 0;
      const balanceAfter = currentBalance - pointsRedeemed + pointsEarned;

      return {
        pointsEarned,
        pointsRedeemed,
        redemptionDiscount: redemption?.discount || 0,
        balanceAfter,
        tier: earnedResult.tierLabel || 'Bronze',
        tierMultiplier: earnedResult.multiplier || 1
      };
    } catch (error) {
      console.error('Failed to get loyalty info for receipt:', error);
      return null;
    }
  }

  /**
   * Look up customer by phone number when phone field loses focus
   * Feature: F-019 Customer Contact Management
   */
  async onCustomerPhoneLookup(): Promise<void> {
    const phone = this.customerInfo.phone.trim();

    // Reset if phone is empty or too short
    if (phone.length < 5) {
      this.customerLookupStatus = 'idle';
      this.selectedCustomer = null;
      return;
    }

    // Debounce to avoid multiple rapid lookups
    if (this.customerLookupTimeout) {
      clearTimeout(this.customerLookupTimeout);
    }

    this.customerLookupTimeout = setTimeout(async () => {
      this.customerLookupLoading = true;

      try {
        const customer = await this.customerService.lookupByPhone(phone);

        if (customer) {
          this.selectedCustomer = customer;
          this.customerLookupStatus = 'found';

          // Auto-fill customer info
          this.customerInfo.name = customer.name;
          if (customer.email) {
            this.customerInfo.email = customer.email;
          }

          this.toastService.info('Customer Found', `${customer.name} - ${customer.totalTransactions} previous transaction(s)`);
        } else {
          this.selectedCustomer = null;
          this.customerLookupStatus = 'not_found';
        }
      } catch (error) {
        console.error('Error looking up customer:', error);
        this.customerLookupStatus = 'not_found';
      } finally {
        this.customerLookupLoading = false;
      }
    }, 300);
  }

  /**
   * Open the create customer dialog with pre-filled phone
   * Feature: F-019 Customer Contact Management
   */
  openCreateCustomerDialog(): void {
    this.showCustomerFormDialog = true;
  }

  /**
   * Handle new customer creation from the dialog
   * Feature: F-019 Customer Contact Management
   */
  onCustomerCreated(customer: CustomerWithStats): void {
    this.selectedCustomer = customer;
    this.customerLookupStatus = 'found';

    // Fill customer info
    this.customerInfo.phone = customer.phone;
    this.customerInfo.name = customer.name;
    if (customer.email) {
      this.customerInfo.email = customer.email;
    }

    this.toastService.success('Customer Created', `${customer.name} has been added`);
  }

  /**
   * Load previous sales for the current customer
   */
  async loadPreviousSales(): Promise<void> {
    if (!this.customerInfo.phone || this.customerInfo.phone.length < 5) return;

    this.loadingPreviousSales = true;
    this.showPreviousSalesDialog = true;

    try {
      const history = await this.saleService.getCustomerHistory(this.customerInfo.phone);
      this.customerPreviousSales = history?.transactions || [];
    } catch (error) {
      console.error('Failed to load previous sales:', error);
      this.customerPreviousSales = [];
    } finally {
      this.loadingPreviousSales = false;
    }
  }

  /**
   * Handle barcode scan result
   * Feature: F-025 Mobile-Optimized Interface
   * Searches for product by scanned barcode (IMEI or other identifier)
   */
  async onBarcodeScanned(result: BarcodeScanResult): Promise<void> {
    const scannedValue = result.rawValue.trim();

    if (!scannedValue) {
      this.toastService.warn('Scan Error', 'No barcode value detected');
      return;
    }

    this.toastService.info('Scanning...', `Looking up: ${scannedValue}`);

    try {
      // Search for phone by IMEI or model
      const response = await this.phoneService.getPhones(
        { first: 0, rows: 10, globalFilter: scannedValue },
        { status: PhoneStatus.AVAILABLE }
      );

      if (response.data.length === 0) {
        this.toastService.warn('Not Found', `No product found for barcode: ${scannedValue}`);
        return;
      }

      // If exact IMEI match, add directly
      const exactMatch = response.data.find(p => p.imei === scannedValue);
      if (exactMatch) {
        const alreadyInCart = this.cartItems.some(item => item.phoneId === exactMatch.id);
        if (alreadyInCart) {
          this.toastService.warn('Already in Cart', 'This product is already in your cart');
          return;
        }

        this.addPhoneToCartFromPhone(exactMatch);
        this.toastService.success('Product Added', `${exactMatch.brandName} ${exactMatch.model} added to cart`);
        return;
      }

      // If multiple matches, use the first one but notify user
      const firstMatch = response.data[0];
      const alreadyInCart = this.cartItems.some(item => item.phoneId === firstMatch.id);
      if (alreadyInCart) {
        this.toastService.warn('Already in Cart', 'This product is already in your cart');
        return;
      }

      this.addPhoneToCartFromPhone(firstMatch);
      if (response.data.length > 1) {
        this.toastService.info(
          'Multiple Matches',
          `Added ${firstMatch.brandName} ${firstMatch.model}. ${response.data.length - 1} other matches found.`
        );
      } else {
        this.toastService.success('Product Added', `${firstMatch.brandName} ${firstMatch.model} added to cart`);
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      this.toastService.error('Search Error', 'Failed to search for product');
    }
  }

  /**
   * Helper to add a phone to the cart from Phone model
   * Feature: F-025 Mobile-Optimized Interface
   * Feature: F-012 Tax Calculation and Compliance
   */
  private addPhoneToCartFromPhone(phone: Phone): void {
    // Use TaxCalculationService to properly calculate tax (F-012)
    const cartItem = this.taxCalculationService.phoneToCartItem(phone);

    this.cartItems = [...this.cartItems, cartItem];
    this.updateCartSummary();

    // Check inventory availability after adding item
    this.checkInventoryAvailability();
  }
}
