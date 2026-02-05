import { Routes } from '@angular/router';
import {
  authGuard,
  guestGuard,
  dashboardGuard,
  inventoryGuard,
  brandsGuard,
  purchaseOrdersGuard,
  suppliersGuard,
  salesGuard,
  refundsGuard,
  messagesGuard,
  storageGuard,
  receiptSequencesGuard,
  userManagementGuard,
  auditLogsGuard
} from './core';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/public-layout/public-layout.component')
      .then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home.component')
          .then(m => m.HomeComponent)
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/public/catalog/catalog.component')
          .then(m => m.CatalogComponent)
      },
      {
        path: 'phone/:id',
        loadComponent: () => import('./features/public/phone-detail/phone-detail.component')
          .then(m => m.PhoneDetailComponent)
      },
      {
        path: 'compare',
        loadComponent: () => import('./features/public/phone-comparison/phone-comparison.component')
          .then(m => m.PhoneComparisonComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/public/contact/contact.component')
          .then(m => m.ContactComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./features/public/about/about.component')
          .then(m => m.AboutComponent)
      }
    ]
  },
  {
    path: 'receipt/:receiptNumber',
    loadComponent: () => import('./features/public/receipt-lookup/receipt-lookup.component')
      .then(m => m.ReceiptLookupComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        canActivate: [dashboardGuard]
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/admin/inventory/inventory-list/inventory-list.component')
          .then(m => m.InventoryListComponent),
        canActivate: [inventoryGuard]
      },
      {
        path: 'inventory/new',
        loadComponent: () => import('./features/admin/inventory/inventory-form/inventory-form.component')
          .then(m => m.InventoryFormComponent),
        canActivate: [inventoryGuard]
      },
      {
        path: 'inventory/:id/edit',
        loadComponent: () => import('./features/admin/inventory/inventory-form/inventory-form.component')
          .then(m => m.InventoryFormComponent),
        canActivate: [inventoryGuard]
      },
      {
        path: 'brands',
        loadComponent: () => import('./features/admin/brands/brand-list/brand-list.component')
          .then(m => m.BrandListComponent),
        canActivate: [brandsGuard]
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/admin/suppliers/supplier-list/supplier-list.component')
          .then(m => m.SupplierListComponent),
        canActivate: [suppliersGuard]
      },
      {
        path: 'suppliers/new',
        loadComponent: () => import('./features/admin/suppliers/supplier-form/supplier-form.component')
          .then(m => m.SupplierFormComponent),
        canActivate: [suppliersGuard]
      },
      {
        path: 'suppliers/:id/edit',
        loadComponent: () => import('./features/admin/suppliers/supplier-form/supplier-form.component')
          .then(m => m.SupplierFormComponent),
        canActivate: [suppliersGuard]
      },
      {
        path: 'purchase-orders',
        loadComponent: () => import('./features/admin/purchase-orders/purchase-order-list/purchase-order-list.component')
          .then(m => m.PurchaseOrderListComponent),
        canActivate: [purchaseOrdersGuard]
      },
      {
        path: 'purchase-orders/new',
        loadComponent: () => import('./features/admin/purchase-orders/purchase-order-form/purchase-order-form.component')
          .then(m => m.PurchaseOrderFormComponent),
        canActivate: [purchaseOrdersGuard]
      },
      {
        path: 'purchase-orders/:id',
        loadComponent: () => import('./features/admin/purchase-orders/purchase-order-detail/purchase-order-detail.component')
          .then(m => m.PurchaseOrderDetailComponent),
        canActivate: [purchaseOrdersGuard]
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/admin/sales/sales-list/sales-list.component')
          .then(m => m.SalesListComponent),
        canActivate: [salesGuard]
      },
      {
        path: 'sales-dashboard',
        loadComponent: () => import('./features/admin/sales-dashboard/sales-dashboard.component')
          .then(m => m.SalesDashboardComponent),
        canActivate: [salesGuard]
      },
      {
        path: 'sales/new',
        loadComponent: () => import('./features/admin/sales/sale-create/sale-create.component')
          .then(m => m.SaleCreateComponent),
        canActivate: [salesGuard]
      },
      {
        path: 'sales/customer-lookup',
        loadComponent: () => import('./features/admin/sales/customer-lookup/customer-lookup.component')
          .then(m => m.CustomerLookupComponent),
        canActivate: [salesGuard]
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/admin/customers/customer-list.component')
          .then(m => m.CustomerListComponent),
        canActivate: [salesGuard]
      },
      {
        path: 'receipts',
        loadComponent: () => import('./features/admin/receipts/receipts-list.component')
          .then(m => m.ReceiptsListComponent),
        canActivate: [salesGuard]
      },
      {
        path: 'refunds',
        loadComponent: () => import('./features/admin/refunds/refund-list/refund-list.component')
          .then(m => m.RefundListComponent),
        canActivate: [refundsGuard]
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/admin/messages/message-list/message-list.component')
          .then(m => m.MessageListComponent),
        canActivate: [messagesGuard]
      },
      {
        path: 'storage',
        loadComponent: () => import('./features/admin/storage-config/storage-config.component')
          .then(m => m.StorageConfigComponent),
        canActivate: [storageGuard]
      },
      {
        path: 'receipt-sequences',
        loadComponent: () => import('./features/admin/receipt-sequences/receipt-sequence-config.component')
          .then(m => m.ReceiptSequenceConfigComponent),
        canActivate: [receiptSequencesGuard]
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/user-list/user-list.component')
          .then(m => m.UserListComponent),
        canActivate: [userManagementGuard]
      },
      {
        path: 'permissions',
        loadComponent: () => import('./features/admin/users/permission-management/permission-management.component')
          .then(m => m.PermissionManagementComponent),
        canActivate: [userManagementGuard]
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./features/admin/audit-logs/audit-log-list.component')
          .then(m => m.AuditLogListComponent),
        canActivate: [auditLogsGuard]
      },
      {
        path: 'loyalty',
        children: [
          {
            path: '',
            redirectTo: 'members',
            pathMatch: 'full'
          },
          {
            path: 'members',
            loadComponent: () => import('./features/admin/loyalty/loyalty-members/loyalty-members.component')
              .then(m => m.LoyaltyMembersComponent),
            canActivate: [salesGuard]
          },
          {
            path: 'config',
            loadComponent: () => import('./features/admin/loyalty/loyalty-config/loyalty-config.component')
              .then(m => m.LoyaltyConfigComponent),
            canActivate: [salesGuard]
          }
        ]
      },
      {
        path: 'coupons',
        loadComponent: () => import('./features/admin/coupons/coupon-list/coupon-list.component')
          .then(m => m.CouponListComponent),
        canActivate: [salesGuard]
      },
      {
        path: 'locations',
        loadComponent: () => import('./features/admin/locations/location-list/location-list.component')
          .then(m => m.LocationListComponent),
        canActivate: [inventoryGuard]
      },
      {
        path: 'location-inventory',
        loadComponent: () => import('./features/admin/locations/location-inventory/location-inventory.component')
          .then(m => m.LocationInventoryComponent),
        canActivate: [inventoryGuard]
      },
      {
        path: 'inventory-transfers',
        loadComponent: () => import('./features/admin/inventory-transfers/transfer-list/transfer-list.component')
          .then(m => m.TransferListComponent),
        canActivate: [inventoryGuard]
      },
      {
        path: 'inventory-transfers/new',
        loadComponent: () => import('./features/admin/inventory-transfers/transfer-create/transfer-create.component')
          .then(m => m.TransferCreateComponent),
        canActivate: [inventoryGuard]
      },
      {
        path: 'inventory-transfers/:id',
        loadComponent: () => import('./features/admin/inventory-transfers/transfer-detail/transfer-detail.component')
          .then(m => m.TransferDetailComponent),
        canActivate: [inventoryGuard]
      },
      {
        path: 'sync-status',
        loadComponent: () => import('./features/admin/sync-status/sync-status-page.component')
          .then(m => m.SyncStatusPageComponent)
      },
      {
        path: 'shop-details',
        loadComponent: () => import('./features/admin/shop-details/shop-details-form.component')
          .then(m => m.ShopDetailsFormComponent),
        canActivate: [dashboardGuard]
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login.component')
          .then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./features/error/access-denied-page/access-denied-page.component')
      .then(m => m.AccessDeniedPageComponent)
  },
  {
    path: 'error',
    loadComponent: () => import('./features/error/error-page/error-page.component')
      .then(m => m.ErrorPageComponent)
  },
  {
    path: 'offline',
    loadComponent: () => import('./features/error/offline-page/offline-page.component')
      .then(m => m.OfflinePageComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/public/public-layout/public-layout.component')
      .then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/error/not-found-page/not-found-page.component')
          .then(m => m.NotFoundPageComponent)
      }
    ]
  }
];
