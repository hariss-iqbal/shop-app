import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { OrderListModule } from 'primeng/orderlist';
import { SelectModule } from 'primeng/select';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { ToastService } from '../../../shared/services/toast.service';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

interface RouteOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-sidebar-settings',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    OrderListModule,
    SelectModule
  ],
  templateUrl: './sidebar-settings.component.html'
})
export class SidebarSettingsComponent implements OnInit {
  constructor(
    private shopDetailsService: ShopDetailsService,
    private toastService: ToastService
  ) { }

  loading = signal(true);
  saving = signal(false);

  sidebarItems: SidebarItem[] = [];
  defaultRoute: string = '/admin/dashboard';

  private readonly allItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar' },
    { id: 'inventory', label: 'Inventory', icon: 'pi pi-mobile' },
    { id: 'location-inventory', label: 'Location Inventory', icon: 'pi pi-map-marker' },
    { id: 'locations', label: 'Store Locations', icon: 'pi pi-building' },
    { id: 'inventory-transfers', label: 'Stock Transfers', icon: 'pi pi-arrows-h' },
    { id: 'brands', label: 'Brands', icon: 'pi pi-tag' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: 'pi pi-file' },
    { id: 'suppliers', label: 'Suppliers', icon: 'pi pi-truck' },
    { id: 'sales', label: 'Sales', icon: 'pi pi-dollar' },
    { id: 'sales-dashboard', label: 'Sales Dashboard', icon: 'pi pi-chart-line' },
    { id: 'customers', label: 'Customers', icon: 'pi pi-id-card' },
    { id: 'customer-lookup', label: 'Customer Lookup', icon: 'pi pi-search' },
    { id: 'receipts', label: 'Receipts', icon: 'pi pi-receipt' },
    { id: 'receipt-sequences', label: 'Receipt Numbers', icon: 'pi pi-hashtag' },
    { id: 'refunds', label: 'Refunds', icon: 'pi pi-refresh' },
    { id: 'messages', label: 'Messages', icon: 'pi pi-envelope' },
    { id: 'users', label: 'User Management', icon: 'pi pi-users' },
    { id: 'audit-logs', label: 'Audit Logs', icon: 'pi pi-history' },
    { id: 'sidebar-settings', label: 'Sidebar Settings', icon: 'pi pi-sliders-h' },
    { id: 'shop-details', label: 'Shop Details', icon: 'pi pi-cog' }
  ];

  readonly routeOptions: RouteOption[] = [
    { label: 'Dashboard', value: '/admin/dashboard' },
    { label: 'Inventory', value: '/admin/inventory' },
    { label: 'Sales', value: '/admin/sales' },
    { label: 'Sales Dashboard', value: '/admin/sales-dashboard' }
  ];

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await this.shopDetailsService.getShopDetails();
      const savedOrder = this.shopDetailsService.sidebarItemOrder();
      const defaultRoute = this.shopDetailsService.defaultLandingRoute();

      if (savedOrder && savedOrder.length > 0) {
        // Sort items by saved order, append any new items at the end
        const ordered: SidebarItem[] = [];
        for (const id of savedOrder) {
          const item = this.allItems.find(i => i.id === id);
          if (item) ordered.push(item);
        }
        // Add items not in saved order
        for (const item of this.allItems) {
          if (!savedOrder.includes(item.id)) {
            ordered.push(item);
          }
        }
        this.sidebarItems = ordered;
      } else {
        this.sidebarItems = [...this.allItems];
      }

      this.defaultRoute = defaultRoute || '/admin/dashboard';
    } catch (error) {
      console.error('Failed to load sidebar settings:', error);
      this.sidebarItems = [...this.allItems];
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      const order = this.sidebarItems.map(item => item.id);
      await this.shopDetailsService.saveShopDetails({
        shopName: this.shopDetailsService.shopName() || 'My Shop',
        sidebarItemOrder: order,
        defaultLandingRoute: this.defaultRoute
      });
      this.toastService.success('Saved', 'Sidebar settings updated successfully');
    } catch (error) {
      console.error('Failed to save sidebar settings:', error);
      this.toastService.error('Error', 'Failed to save sidebar settings');
    } finally {
      this.saving.set(false);
    }
  }

  onReorder(): void {
    // PrimeNG OrderList mutates the array in-place; nothing extra needed here.
  }

  resetToDefault(): void {
    this.sidebarItems = [...this.allItems];
    this.defaultRoute = '/admin/dashboard';
  }
}
