import { Component, computed, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';

import { ProductService, LazyLoadParams } from '../../../../core/services/product.service';
import { BrandService } from '../../../../core/services/brand.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { CsvExportService, CsvColumn } from '../../../../shared/services/csv-export.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { Product } from '../../../../models/product.model';
import { Brand } from '../../../../models/brand.model';
import { ProductStatus, ProductStatusLabels } from '../../../../enums/product-status.enum';
import { ProductCondition, ProductConditionLabels } from '../../../../enums/product-condition.enum';
import { ProductType, ProductTypeLabels } from '../../../../enums/product-type.enum';
import { PtaStatus, PtaStatusLabels } from '../../../../enums/pta-status.enum';
import { MarkAsSoldDialogComponent } from '../mark-as-sold-dialog/mark-as-sold-dialog.component';
import { InventoryStatusActionsComponent } from '../inventory-status-actions/inventory-status-actions.component';
import { PrintLabelDialogComponent } from '../print-label-dialog/print-label-dialog.component';
import { InventoryImageDialogComponent } from '../inventory-image-dialog/inventory-image-dialog.component';
import { DialogModule } from 'primeng/dialog';
import { InventoryFormComponent } from '../inventory-form/inventory-form.component';

@Component({
  selector: 'app-inventory-list',
  imports: [
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SkeletonModule,
    TagModule,
    SelectModule,
    AppCurrencyPipe,
    MarkAsSoldDialogComponent,
    InventoryStatusActionsComponent,
    PrintLabelDialogComponent,
    InventoryImageDialogComponent,
    DialogModule,
    InventoryFormComponent
  ],
  templateUrl: './inventory-list.component.html'
})
export class InventoryListComponent implements OnInit {
  constructor(
    private productService: ProductService,
    private brandService: BrandService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService,
    private csvExportService: CsvExportService,
    private router: Router
  ) { }

  readonly ProductStatus = ProductStatus;
  readonly ProductTypeLabels = ProductTypeLabels;

  products = signal<Product[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  exportLoading = signal(false);
  readonly skeletonRows = Array(5).fill({});
  bulkActionLoading = signal(false);
  selectedProducts = signal<Product[]>([]);
  globalFilter = '';

  markAsSoldDialogVisible = signal(false);
  markAsSoldProduct = signal<Product | null>(null);

  printLabelDialogVisible = signal(false);
  printLabelProduct = signal<Product | null>(null);

  imageDialogProduct = signal<Product | null>(null);
  imageDialogVisible = signal(false);

  editDialogVisible = signal(false);
  editDialogProductId = signal<string | null>(null);

  productTypeFilter = signal<string | null>(null);
  productTypeFilterOptions = [
    { label: 'All Types', value: null },
    { label: 'Phone', value: ProductType.PHONE },
    { label: 'Accessory', value: ProductType.ACCESSORY },
    { label: 'Tablet', value: ProductType.TABLET },
    { label: 'Laptop', value: ProductType.LAPTOP }
  ];

  // Brand filter
  brands = signal<Brand[]>([]);
  brandFilter = signal<string | null>(null);
  brandOptions = computed(() => [
    { label: 'All Brands', value: null },
    ...this.brands().map(b => ({ label: b.name, value: b.id }))
  ]);

  // Model filter (populated based on selected brand)
  modelFilter = signal<string | null>(null);
  modelOptions = signal<{ label: string; value: string | null }[]>([]);

  // Condition filter
  conditionFilter = signal<string | null>(null);
  conditionOptions = [
    { label: 'All Conditions', value: null },
    { label: ProductConditionLabels[ProductCondition.NEW], value: ProductCondition.NEW },
    { label: ProductConditionLabels[ProductCondition.USED], value: ProductCondition.USED },
    { label: ProductConditionLabels[ProductCondition.OPEN_BOX], value: ProductCondition.OPEN_BOX }
  ];

  // Status filter
  statusFilter = signal<string | null>(null);
  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: ProductStatusLabels[ProductStatus.AVAILABLE], value: ProductStatus.AVAILABLE },
    { label: ProductStatusLabels[ProductStatus.SOLD], value: ProductStatus.SOLD },
    { label: ProductStatusLabels[ProductStatus.RESERVED], value: ProductStatus.RESERVED }
  ];

  // Inline price editing
  editingProductId = signal<string | null>(null);
  editCostPrice = signal<number | null>(null);
  editSellingPrice = signal<number | null>(null);
  savingPriceId = signal<string | null>(null);

  private lastLazyLoadEvent: TableLazyLoadEvent | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    try {
      this.brands.set(await this.brandService.getBrands());
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  }

  async loadProducts(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyLoadEvent = event;
    this.loading.set(true);

    try {
      const params: LazyLoadParams = {
        first: event.first ?? 0,
        rows: event.rows ?? 10,
        sortField: event.sortField as string | undefined,
        sortOrder: event.sortOrder ?? undefined,
        globalFilter: this.globalFilter || undefined
      };

      const filter: Record<string, unknown> = {};
      if (this.productTypeFilter()) {
        filter['productType'] = this.productTypeFilter();
      }
      if (this.brandFilter()) {
        filter['brandId'] = this.brandFilter();
      }
      if (this.conditionFilter()) {
        filter['condition'] = this.conditionFilter();
      }
      if (this.statusFilter()) {
        filter['status'] = this.statusFilter();
      }
      if (this.modelFilter()) {
        filter['model'] = this.modelFilter();
      }

      const response = await this.productService.getProducts(params, filter as any);
      this.products.set(response.data);
      this.totalRecords.set(response.total);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load products');
      console.error('Failed to load products:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      if (this.lastLazyLoadEvent) {
        this.loadProducts({ ...this.lastLazyLoadEvent, first: 0 });
      }
    }, 300);
  }

  clearSearch(): void {
    this.globalFilter = '';
    this.onSearch();
  }

  onProductTypeFilterChange(): void {
    if (this.lastLazyLoadEvent) {
      this.loadProducts({ ...this.lastLazyLoadEvent, first: 0 });
    }
  }

  async onBrandFilterChange(): Promise<void> {
    // Reset model filter when brand changes
    this.modelFilter.set(null);

    const brandId = this.brandFilter();
    if (brandId) {
      try {
        const models = await this.productService.getDistinctModelsByBrand(brandId);
        this.modelOptions.set([
          { label: 'All Products', value: null },
          ...models.map(m => ({ label: m, value: m }))
        ]);
      } catch (error) {
        console.error('Failed to load models:', error);
        this.modelOptions.set([]);
      }
    } else {
      this.modelOptions.set([]);
    }

    if (this.lastLazyLoadEvent) {
      this.loadProducts({ ...this.lastLazyLoadEvent, first: 0 });
    }
  }

  onModelFilterChange(): void {
    if (this.lastLazyLoadEvent) {
      this.loadProducts({ ...this.lastLazyLoadEvent, first: 0 });
    }
  }

  onConditionFilterChange(): void {
    if (this.lastLazyLoadEvent) {
      this.loadProducts({ ...this.lastLazyLoadEvent, first: 0 });
    }
  }

  onStatusFilterChange(): void {
    if (this.lastLazyLoadEvent) {
      this.loadProducts({ ...this.lastLazyLoadEvent, first: 0 });
    }
  }

  getConditionLabel(condition: string): string {
    return ProductConditionLabels[condition as keyof typeof ProductConditionLabels] || condition;
  }

  getConditionSeverity(condition: string): 'success' | 'info' | 'warn' | 'secondary' | undefined {
    const severityMap: Record<string, 'success' | 'info' | 'warn'> = {
      new: 'success',
      open_box: 'info',
      used: 'warn'
    };
    return severityMap[condition] || 'secondary';
  }

  getProductTypeLabel(type: string): string {
    return ProductTypeLabels[type as ProductType] || type;
  }

  getProductTypeSeverity(type: string): 'info' | 'success' | 'warn' | 'secondary' | undefined {
    const severityMap: Record<string, 'info' | 'success' | 'warn' | 'secondary'> = {
      phone: 'info',
      accessory: 'success',
      tablet: 'warn',
      laptop: 'secondary'
    };
    return severityMap[type] || 'secondary';
  }

  getPtaLabel(status: string): string {
    return PtaStatusLabels[status as PtaStatus] || status;
  }

  getPtaSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    const severityMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      pta_approved: 'success',
      non_pta: 'warn'
    };
    return severityMap[status] || 'secondary';
  }

  onPrintLabel(product: Product): void {
    this.printLabelProduct.set(product);
    this.printLabelDialogVisible.set(true);
  }

  onManageImages(product: Product): void {
    this.imageDialogProduct.set(product);
    this.imageDialogVisible.set(true);
  }

  onImagesSaved(): void {
    this.refreshTable();
  }

  onEdit(product: Product): void {
    this.router.navigate(['/admin/inventory', product.id, 'edit']);
  }

  onMarkAsSold(product: Product): void {
    this.markAsSoldProduct.set(product);
    this.markAsSoldDialogVisible.set(true);
  }

  onStatusChanged(): void {
    this.refreshTable();
  }

  onSaleSaved(): void {
    this.selectedProducts.set([]);
    this.refreshTable();
  }

  async onDelete(product: Product): Promise<void> {
    const itemDetails = `${product.brandName} ${product.model}${product.imei ? ' (IMEI: ' + product.imei + ')' : ''}`;
    const confirmed = await this.confirmDialogService.confirmDelete('product', itemDetails);

    if (confirmed) {
      try {
        await this.productService.deleteProduct(product.id);
        this.toastService.success('Deleted', `${product.brandName} ${product.model} has been deleted`);
        this.refreshTable();
      } catch (error) {
        this.toastService.error('Error', 'Failed to delete product');
        console.error('Failed to delete product:', error);
      }
    }
  }

  async onBulkMarkAsSold(): Promise<void> {
    const selected = this.selectedProducts();
    if (selected.length === 0) return;

    const availableProducts = selected.filter(p => p.status === ProductStatus.AVAILABLE);
    if (availableProducts.length === 0) {
      this.toastService.warn('Warning', 'No available products selected to mark as sold');
      return;
    }

    const confirmed = await this.confirmDialogService.confirmBulkAction(
      'Mark as Sold',
      'product',
      availableProducts.length
    );

    if (confirmed) {
      this.bulkActionLoading.set(true);
      try {
        const ids = availableProducts.map(p => p.id);
        await this.productService.updateProductsStatus(ids, ProductStatus.SOLD);
        this.toastService.success('Success', `${availableProducts.length} product(s) marked as sold`);
        this.selectedProducts.set([]);
        this.refreshTable();
      } catch (error) {
        this.toastService.error('Error', 'Failed to mark products as sold');
        console.error('Failed to mark products as sold:', error);
      } finally {
        this.bulkActionLoading.set(false);
      }
    }
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.selectedProducts();
    if (selected.length === 0) return;

    const confirmed = await this.confirmDialogService.confirmBulkDelete('product', selected.length);

    if (confirmed) {
      this.bulkActionLoading.set(true);
      try {
        const ids = selected.map(p => p.id);
        await this.productService.deleteProducts(ids);
        this.toastService.success('Deleted', `${selected.length} product(s) have been deleted`);
        this.selectedProducts.set([]);
        this.refreshTable();
      } catch (error) {
        this.toastService.error('Error', 'Failed to delete products');
        console.error('Failed to delete products:', error);
      } finally {
        this.bulkActionLoading.set(false);
      }
    }
  }

  async onExportCsv(): Promise<void> {
    this.exportLoading.set(true);

    try {
      const products = await this.productService.getExportProducts(
        this.globalFilter || undefined
      );

      if (products.length === 0) {
        this.toastService.warn('No Data', 'No products to export');
        return;
      }

      const columns: CsvColumn<Product>[] = [
        { header: 'Type', field: (p) => ProductTypeLabels[p.productType] || p.productType },
        { header: 'Brand', field: 'brandName' },
        { header: 'Model', field: 'model' },
        { header: 'Storage (GB)', field: (p) => p.storageGb },
        { header: 'RAM (GB)', field: (p) => p.ramGb },
        { header: 'Color', field: 'color' },
        { header: 'Condition', field: (p) => ProductConditionLabels[p.condition as keyof typeof ProductConditionLabels] || p.condition },
        { header: 'Battery Health (%)', field: (p) => p.batteryHealth },
        { header: 'Cost Price', field: 'costPrice' },
        { header: 'Selling Price', field: 'sellingPrice' },
        { header: 'Profit Margin (%)', field: (p) => p.profitMargin },
        { header: 'Status', field: 'status' },
        { header: 'Purchase Date', field: 'purchaseDate' },
        { header: 'IMEI', field: 'imei' },
        { header: 'Notes', field: 'notes' }
      ];

      this.csvExportService.exportToCsv(products, columns, 'inventory_export');
      this.toastService.success('Export Complete', 'Inventory data exported to CSV');
    } catch (error) {
      this.toastService.error('Error', 'Failed to export inventory data');
      console.error('Failed to export inventory data:', error);
    } finally {
      this.exportLoading.set(false);
    }
  }

  // Inline price editing
  startPriceEdit(product: Product): void {
    this.editingProductId.set(product.id);
    this.editCostPrice.set(product.costPrice);
    this.editSellingPrice.set(product.sellingPrice);
  }

  cancelPriceEdit(): void {
    this.editingProductId.set(null);
    this.editCostPrice.set(null);
    this.editSellingPrice.set(null);
  }

  async savePriceEdit(product: Product): Promise<void> {
    const newCost = this.editCostPrice();
    const newSelling = this.editSellingPrice();

    if (newCost === null || newSelling === null || newCost < 0 || newSelling < 0) {
      this.toastService.warn('Invalid', 'Prices must be valid positive numbers');
      return;
    }

    if (newCost === product.costPrice && newSelling === product.sellingPrice) {
      this.cancelPriceEdit();
      return;
    }

    this.savingPriceId.set(product.id);
    try {
      await this.productService.updateProduct(product.id, {
        costPrice: newCost,
        sellingPrice: newSelling
      });

      this.products.update(products =>
        products.map(p => p.id === product.id
          ? { ...p, costPrice: newCost, sellingPrice: newSelling, profitMargin: newSelling > 0 ? Math.round(((newSelling - newCost) / newSelling) * 10000) / 100 : 0 }
          : p
        )
      );

      this.toastService.success('Updated', `Prices updated for ${product.brandName} ${product.model}`);
      this.cancelPriceEdit();
    } catch (error) {
      this.toastService.error('Error', 'Failed to update prices');
    } finally {
      this.savingPriceId.set(null);
    }
  }

  onEditInDialog(product: Product): void {
    this.editDialogProductId.set(product.id);
    this.editDialogVisible.set(true);
  }

  onEditDialogSaved(): void {
    this.editDialogVisible.set(false);
    this.refreshTable();
    this.toastService.success('Success', 'Product updated successfully');
  }

  onEditDialogCancelled(): void {
    this.editDialogVisible.set(false);
  }

  private refreshTable(): void {
    if (this.lastLazyLoadEvent) {
      this.loadProducts(this.lastLazyLoadEvent);
    }
  }
}
