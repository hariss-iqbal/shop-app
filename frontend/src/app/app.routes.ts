import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core';

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
          .then(m => m.DashboardComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/admin/inventory/inventory-list/inventory-list.component')
          .then(m => m.InventoryListComponent)
      },
      {
        path: 'inventory/new',
        loadComponent: () => import('./features/admin/inventory/inventory-form/inventory-form.component')
          .then(m => m.InventoryFormComponent)
      },
      {
        path: 'inventory/:id/edit',
        loadComponent: () => import('./features/admin/inventory/inventory-form/inventory-form.component')
          .then(m => m.InventoryFormComponent)
      },
      {
        path: 'brands',
        loadComponent: () => import('./features/admin/brands/brand-list/brand-list.component')
          .then(m => m.BrandListComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/admin/suppliers/supplier-list/supplier-list.component')
          .then(m => m.SupplierListComponent)
      },
      {
        path: 'suppliers/new',
        loadComponent: () => import('./features/admin/suppliers/supplier-form/supplier-form.component')
          .then(m => m.SupplierFormComponent)
      },
      {
        path: 'suppliers/:id/edit',
        loadComponent: () => import('./features/admin/suppliers/supplier-form/supplier-form.component')
          .then(m => m.SupplierFormComponent)
      },
      {
        path: 'purchase-orders',
        loadComponent: () => import('./features/admin/purchase-orders/purchase-order-list/purchase-order-list.component')
          .then(m => m.PurchaseOrderListComponent)
      },
      {
        path: 'purchase-orders/new',
        loadComponent: () => import('./features/admin/purchase-orders/purchase-order-form/purchase-order-form.component')
          .then(m => m.PurchaseOrderFormComponent)
      },
      {
        path: 'purchase-orders/:id',
        loadComponent: () => import('./features/admin/purchase-orders/purchase-order-detail/purchase-order-detail.component')
          .then(m => m.PurchaseOrderDetailComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/admin/sales/sales-list/sales-list.component')
          .then(m => m.SalesListComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/admin/messages/message-list/message-list.component')
          .then(m => m.MessageListComponent)
      },
      {
        path: 'storage',
        loadComponent: () => import('./features/admin/storage-config/storage-config.component')
          .then(m => m.StorageConfigComponent)
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
