import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { routes } from './app.routes';

describe('Application Routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks()
      ]
    });
  });

  describe('Route Configuration', () => {
    it('should have routes defined', () => {
      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should configure root path with public layout', () => {
      const rootRoute = routes.find(r => r.path === '');
      expect(rootRoute).toBeDefined();
      expect(rootRoute?.loadComponent).toBeDefined();
    });

    it('should configure admin routes under /admin path', () => {
      const adminRoute = routes.find(r => r.path === 'admin');
      expect(adminRoute).toBeDefined();
      expect(adminRoute?.children).toBeDefined();
    });

    it('should configure auth routes under /auth path', () => {
      const authRoute = routes.find(r => r.path === 'auth');
      expect(authRoute).toBeDefined();
      expect(authRoute?.children).toBeDefined();
    });

    it('should configure wildcard route for 404 handling', () => {
      const wildcardRoute = routes.find(r => r.path === '**');
      expect(wildcardRoute).toBeDefined();
    });
  });

  describe('Public Routes', () => {
    it('should have catalog route at root', () => {
      const rootRoute = routes.find(r => r.path === '');
      const catalogRoute = rootRoute?.children?.find(r => r.path === '');
      expect(catalogRoute).toBeDefined();
      expect(catalogRoute?.loadComponent).toBeDefined();
    });

    it('should have product detail route with :id parameter', () => {
      const rootRoute = routes.find(r => r.path === '');
      const productDetailRoute = rootRoute?.children?.find(r => r.path === 'product/:id');
      expect(productDetailRoute).toBeDefined();
      expect(productDetailRoute?.loadComponent).toBeDefined();
    });

    it('should have contact route', () => {
      const rootRoute = routes.find(r => r.path === '');
      const contactRoute = rootRoute?.children?.find(r => r.path === 'contact');
      expect(contactRoute).toBeDefined();
      expect(contactRoute?.loadComponent).toBeDefined();
    });

    it('should have about route', () => {
      const rootRoute = routes.find(r => r.path === '');
      const aboutRoute = rootRoute?.children?.find(r => r.path === 'about');
      expect(aboutRoute).toBeDefined();
      expect(aboutRoute?.loadComponent).toBeDefined();
    });
  });

  describe('Auth Routes', () => {
    it('should have login route at /auth/login', () => {
      const authRoute = routes.find(r => r.path === 'auth');
      const loginRoute = authRoute?.children?.find(r => r.path === 'login');
      expect(loginRoute).toBeDefined();
      expect(loginRoute?.loadComponent).toBeDefined();
    });

    it('should have guest guard on login route', () => {
      const authRoute = routes.find(r => r.path === 'auth');
      const loginRoute = authRoute?.children?.find(r => r.path === 'login');
      expect(loginRoute?.canActivate).toBeDefined();
      expect(loginRoute?.canActivate?.length).toBe(1);
    });
  });

  describe('Admin Routes', () => {
    let adminRoute: Routes[0] | undefined;

    beforeEach(() => {
      adminRoute = routes.find(r => r.path === 'admin');
    });

    it('should have auth guard applied to admin route', () => {
      expect(adminRoute?.canActivate).toBeDefined();
      expect(adminRoute?.canActivate?.length).toBe(1);
    });

    it('should redirect /admin to /admin/dashboard', () => {
      const redirectRoute = adminRoute?.children?.find(r => r.path === '' && r.redirectTo === 'dashboard');
      expect(redirectRoute).toBeDefined();
      expect(redirectRoute?.pathMatch).toBe('full');
    });

    it('should have dashboard route', () => {
      const dashboardRoute = adminRoute?.children?.find(r => r.path === 'dashboard');
      expect(dashboardRoute).toBeDefined();
      expect(dashboardRoute?.loadComponent).toBeDefined();
    });

    it('should have inventory list route', () => {
      const inventoryRoute = adminRoute?.children?.find(r => r.path === 'inventory');
      expect(inventoryRoute).toBeDefined();
      expect(inventoryRoute?.loadComponent).toBeDefined();
    });

    it('should have inventory new route', () => {
      const newRoute = adminRoute?.children?.find(r => r.path === 'inventory/new');
      expect(newRoute).toBeDefined();
      expect(newRoute?.loadComponent).toBeDefined();
    });

    it('should have inventory edit route with :id parameter', () => {
      const editRoute = adminRoute?.children?.find(r => r.path === 'inventory/:id/edit');
      expect(editRoute).toBeDefined();
      expect(editRoute?.loadComponent).toBeDefined();
    });

    it('should have purchase orders list route', () => {
      const poListRoute = adminRoute?.children?.find(r => r.path === 'purchase-orders');
      expect(poListRoute).toBeDefined();
      expect(poListRoute?.loadComponent).toBeDefined();
    });

    it('should have purchase orders new route', () => {
      const poNewRoute = adminRoute?.children?.find(r => r.path === 'purchase-orders/new');
      expect(poNewRoute).toBeDefined();
      expect(poNewRoute?.loadComponent).toBeDefined();
    });

    it('should have purchase order detail route with :id parameter', () => {
      const poDetailRoute = adminRoute?.children?.find(r => r.path === 'purchase-orders/:id');
      expect(poDetailRoute).toBeDefined();
      expect(poDetailRoute?.loadComponent).toBeDefined();
    });

    it('should have suppliers list route', () => {
      const suppliersRoute = adminRoute?.children?.find(r => r.path === 'suppliers');
      expect(suppliersRoute).toBeDefined();
      expect(suppliersRoute?.loadComponent).toBeDefined();
    });

    it('should have suppliers new route', () => {
      const suppliersNewRoute = adminRoute?.children?.find(r => r.path === 'suppliers/new');
      expect(suppliersNewRoute).toBeDefined();
      expect(suppliersNewRoute?.loadComponent).toBeDefined();
    });

    it('should have suppliers edit route with :id parameter', () => {
      const suppliersEditRoute = adminRoute?.children?.find(r => r.path === 'suppliers/:id/edit');
      expect(suppliersEditRoute).toBeDefined();
      expect(suppliersEditRoute?.loadComponent).toBeDefined();
    });

    it('should have sales route', () => {
      const salesRoute = adminRoute?.children?.find(r => r.path === 'sales');
      expect(salesRoute).toBeDefined();
      expect(salesRoute?.loadComponent).toBeDefined();
    });

    it('should have messages route', () => {
      const messagesRoute = adminRoute?.children?.find(r => r.path === 'messages');
      expect(messagesRoute).toBeDefined();
      expect(messagesRoute?.loadComponent).toBeDefined();
    });
  });

  describe('Lazy Loading', () => {
    it('should use lazy loading for public layout', () => {
      const rootRoute = routes.find(r => r.path === '');
      expect(rootRoute?.loadComponent).toBeDefined();
      expect(typeof rootRoute?.loadComponent).toBe('function');
    });

    it('should use lazy loading for admin layout', () => {
      const adminRoute = routes.find(r => r.path === 'admin');
      expect(adminRoute?.loadComponent).toBeDefined();
      expect(typeof adminRoute?.loadComponent).toBe('function');
    });

    it('should use lazy loading for all admin child routes', () => {
      const adminRoute = routes.find(r => r.path === 'admin');
      const childRoutes = adminRoute?.children?.filter(r => r.path !== '' || r.redirectTo === undefined) || [];

      childRoutes.forEach(route => {
        if (!route.redirectTo) {
          expect(route.loadComponent).toBeDefined();
          expect(typeof route.loadComponent).toBe('function');
        }
      });
    });

    it('should use lazy loading for login component', () => {
      const authRoute = routes.find(r => r.path === 'auth');
      const loginRoute = authRoute?.children?.find(r => r.path === 'login');
      expect(loginRoute?.loadComponent).toBeDefined();
      expect(typeof loginRoute?.loadComponent).toBe('function');
    });
  });

  describe('Error Routes', () => {
    it('should have error page route', () => {
      const errorRoute = routes.find(r => r.path === 'error');
      expect(errorRoute).toBeDefined();
      expect(errorRoute?.loadComponent).toBeDefined();
    });

    it('should have offline page route', () => {
      const offlineRoute = routes.find(r => r.path === 'offline');
      expect(offlineRoute).toBeDefined();
      expect(offlineRoute?.loadComponent).toBeDefined();
    });

    it('should have 404 handling with wildcard route', () => {
      const wildcardRoute = routes.find(r => r.path === '**');
      expect(wildcardRoute).toBeDefined();
      expect(wildcardRoute?.loadComponent).toBeDefined();
      expect(wildcardRoute?.children).toBeDefined();
    });
  });

  describe('Acceptance Criteria Verification', () => {
    it('AC: Given route configuration, navigating to "/" should load CatalogComponent', () => {
      const rootRoute = routes.find(r => r.path === '');
      const catalogRoute = rootRoute?.children?.find(r => r.path === '');
      expect(catalogRoute?.loadComponent).toBeDefined();
    });

    it('AC: Given route configuration, navigating to "/product/:id" should load ProductDetailComponent', () => {
      const rootRoute = routes.find(r => r.path === '');
      const productDetailRoute = rootRoute?.children?.find(r => r.path === 'product/:id');
      expect(productDetailRoute?.loadComponent).toBeDefined();
    });

    it('AC: Given /admin route, navigating should redirect to /admin/dashboard', () => {
      const adminRoute = routes.find(r => r.path === 'admin');
      const redirectRoute = adminRoute?.children?.find(r => r.path === '' && r.redirectTo === 'dashboard');
      expect(redirectRoute).toBeDefined();
      expect(redirectRoute?.pathMatch).toBe('full');
    });

    it('AC: Given all admin routes, each should have auth guard applied', () => {
      const adminRoute = routes.find(r => r.path === 'admin');
      expect(adminRoute?.canActivate).toBeDefined();
      expect(adminRoute?.canActivate?.length).toBeGreaterThan(0);
    });

    it('AC: Given admin module routes, they should be lazy-loaded', () => {
      const adminRoute = routes.find(r => r.path === 'admin');
      expect(adminRoute?.loadComponent).toBeDefined();

      adminRoute?.children?.forEach(child => {
        if (!child.redirectTo) {
          expect(child.loadComponent).toBeDefined();
        }
      });
    });

    it('AC: Given unknown route, wildcard should handle 404', () => {
      const wildcardRoute = routes.find(r => r.path === '**');
      expect(wildcardRoute).toBeDefined();
    });

    it('AC: F-059 - 404 page should use public layout (header and footer)', () => {
      const wildcardRoute = routes.find(r => r.path === '**');
      expect(wildcardRoute).toBeDefined();
      // Verify the wildcard route loads the public layout component
      expect(wildcardRoute?.loadComponent).toBeDefined();
      // Verify it has children (which includes the NotFoundPageComponent)
      expect(wildcardRoute?.children).toBeDefined();
      expect(wildcardRoute?.children?.length).toBeGreaterThan(0);
      // The child route at path '' loads the NotFoundPageComponent
      const notFoundChildRoute = wildcardRoute?.children?.find(r => r.path === '');
      expect(notFoundChildRoute).toBeDefined();
      expect(notFoundChildRoute?.loadComponent).toBeDefined();
    });
  });
});
