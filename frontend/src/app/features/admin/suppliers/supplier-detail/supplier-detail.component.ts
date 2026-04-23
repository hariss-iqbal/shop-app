import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { Supplier } from '../../../../models/supplier.model';
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusLabels,
  PurchaseOrderStatusColors,
  ProductStatus,
  ProductStatusLabels,
  ProductStatusColors
} from '../../../../enums';

interface SupplierProduct {
  id: string;
  model: string;
  costPrice: number;
  sellingPrice: number;
  status: string;
  color: string | null;
  storageGb: number | null;
  condition: string | null;
  ptaStatus: string | null;
  createdAt: string;
  brand: { id: string; name: string } | null;
}

interface SupplierPurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
}

@Component({
  selector: 'app-supplier-detail',
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    SkeletonModule,
    TooltipModule,
    AppCurrencyPipe
  ],
  templateUrl: './supplier-detail.component.html'
})
export class SupplierDetailComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private supabase: SupabaseService,
    private supplierService: SupplierService,
    private toastService: ToastService
  ) {}

  supplier = signal<Supplier | null>(null);
  purchaseOrders = signal<SupplierPurchaseOrder[]>([]);
  products = signal<SupplierProduct[]>([]);
  loading = signal(true);
  notFound = signal(false);

  readonly skeletonRows = Array(5).fill({});

  totalSpent = computed(() =>
    this.products().reduce((sum, p) => sum + p.costPrice, 0)
  );

  ngOnInit(): void {
    const supplierId = this.route.snapshot.paramMap.get('id');
    if (supplierId) {
      this.loadData(supplierId);
    } else {
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  private async loadData(supplierId: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);

    try {
      await Promise.all([
        this.loadSupplier(supplierId),
        this.loadPurchaseOrders(supplierId),
        this.loadProducts(supplierId)
      ]);
    } catch (error) {
      console.error('Failed to load supplier data:', error);
      this.toastService.error('Error', 'Failed to load supplier details');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadSupplier(id: string): Promise<void> {
    const supplier = await this.supplierService.getSupplierById(id);
    if (!supplier) {
      this.notFound.set(true);
      return;
    }
    this.supplier.set(supplier);
  }

  private async loadPurchaseOrders(supplierId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('id, po_number, order_date, total_amount, status')
      .eq('supplier_id', supplierId)
      .order('order_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    this.purchaseOrders.set(
      (data || []).map((po: Record<string, unknown>) => ({
        id: po['id'] as string,
        poNumber: po['po_number'] as string,
        orderDate: po['order_date'] as string,
        totalAmount: po['total_amount'] as number,
        status: po['status'] as string
      }))
    );
  }

  private async loadProducts(supplierId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('products')
      .select('id, model, cost_price, selling_price, status, color, storage_gb, condition, pta_status, created_at, brand:brands(id, name)')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    this.products.set(
      (data || []).map((p: Record<string, unknown>) => ({
        id: p['id'] as string,
        model: p['model'] as string,
        costPrice: p['cost_price'] as number,
        sellingPrice: p['selling_price'] as number,
        status: p['status'] as string,
        color: p['color'] as string | null,
        storageGb: p['storage_gb'] as number | null,
        condition: p['condition'] as string | null,
        ptaStatus: p['pta_status'] as string | null,
        createdAt: p['created_at'] as string,
        brand: p['brand'] as { id: string; name: string } | null
      }))
    );
  }

  getPOStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const statusKey = status as PurchaseOrderStatus;
    const color = PurchaseOrderStatusColors[statusKey];
    const colorMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'warning': 'warn',
      'success': 'success',
      'danger': 'danger'
    };
    return colorMap[color] || 'secondary';
  }

  getPOStatusLabel(status: string): string {
    return PurchaseOrderStatusLabels[status as PurchaseOrderStatus] || status;
  }

  getProductStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const statusKey = status as ProductStatus;
    const color = ProductStatusColors[statusKey];
    const colorMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'success': 'success',
      'info': 'info',
      'warning': 'warn',
      'danger': 'danger'
    };
    return colorMap[color] || 'secondary';
  }

  getProductStatusLabel(status: string): string {
    return ProductStatusLabels[status as ProductStatus] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  navigateToPurchaseOrder(poId: string): void {
    this.router.navigate(['/admin/purchase-orders', poId]);
  }

  goBackToList(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/admin/suppliers']);
    }
  }

  onEdit(): void {
    const supplier = this.supplier();
    if (supplier) {
      this.router.navigate(['/admin/suppliers', supplier.id, 'edit']);
    }
  }
}
