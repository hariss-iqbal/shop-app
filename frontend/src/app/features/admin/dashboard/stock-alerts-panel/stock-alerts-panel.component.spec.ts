import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StockAlertsPanelComponent } from './stock-alerts-panel.component';
import { StockAlert, StockAlertConfig } from '../../../../models/stock-alert-config.model';

describe('StockAlertsPanelComponent', () => {
  let component: StockAlertsPanelComponent;
  let fixture: ComponentFixture<StockAlertsPanelComponent>;

  const mockConfig: StockAlertConfig = {
    id: 'config-1',
    lowStockThreshold: 5,
    enableBrandZeroAlert: true,
    allowOversell: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null
  };

  const mockLowStockAlert: StockAlert = {
    type: 'low_stock',
    currentStock: 3,
    threshold: 5,
    message: 'Total stock (3) is below threshold (5)'
  };

  const mockBrandZeroAlert: StockAlert = {
    type: 'brand_zero',
    brandId: 'brand-1',
    brandName: 'Apple',
    currentStock: 0,
    threshold: 0,
    message: 'Apple has zero available stock'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StockAlertsPanelComponent,
        NoopAnimationsModule,
        RouterTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StockAlertsPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('rendering', () => {
    it('should not render anything when no alerts', () => {
      fixture.componentRef.setInput('alerts', []);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const alerts = fixture.nativeElement.querySelectorAll('p-message');
      expect(alerts.length).toBe(0);
    });

    it('should show loading skeleton when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('p-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should display alerts when present', () => {
      fixture.componentRef.setInput('alerts', [mockLowStockAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Total stock (3) is below threshold (5)');
    });

    it('should display alert count', () => {
      fixture.componentRef.setInput('alerts', [mockLowStockAlert, mockBrandZeroAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('(2)');
    });

    it('should display header with Stock Alerts title', () => {
      fixture.componentRef.setInput('alerts', [mockLowStockAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Stock Alerts');
    });
  });

  describe('alert severity', () => {
    it('should use warn severity for low_stock alerts', () => {
      fixture.componentRef.setInput('alerts', [mockLowStockAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('p-message');
      expect(message).toBeTruthy();
    });

    it('should use error severity for brand_zero alerts', () => {
      fixture.componentRef.setInput('alerts', [mockBrandZeroAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('p-message');
      expect(message).toBeTruthy();
    });
  });

  describe('configure button', () => {
    it('should emit configureClicked when configure button is clicked', () => {
      fixture.componentRef.setInput('alerts', [mockLowStockAlert]);
      fixture.componentRef.setInput('config', mockConfig);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      spyOn(component.configureClicked, 'emit');

      // PrimeNG p-button wraps the actual button element - need to click the inner button
      const configButtonWrapper = fixture.nativeElement.querySelector('p-button[icon="pi pi-cog"]');
      expect(configButtonWrapper).toBeTruthy();

      const innerButton = configButtonWrapper.querySelector('button');
      expect(innerButton).toBeTruthy();
      innerButton.click();

      expect(component.configureClicked.emit).toHaveBeenCalled();
    });

    it('should have tooltip for configure button', () => {
      fixture.componentRef.setInput('alerts', [mockLowStockAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const configButton = fixture.nativeElement.querySelector('[pTooltip]');
      expect(configButton).toBeTruthy();
    });
  });

  describe('Create Order link', () => {
    it('should have link to create new purchase order', () => {
      fixture.componentRef.setInput('alerts', [mockLowStockAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const link = fixture.nativeElement.querySelector('a[routerLink="/admin/purchase-orders/new"]');
      expect(link).toBeTruthy();
      expect(link.textContent).toContain('Create Order');
    });

    it('should have aria-label for accessibility on brand zero alert', () => {
      fixture.componentRef.setInput('alerts', [mockBrandZeroAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const link = fixture.nativeElement.querySelector('a[routerLink="/admin/purchase-orders/new"]');
      expect(link).toBeTruthy();
      expect(link.getAttribute('aria-label')).toContain('Apple');
    });
  });

  describe('icon display', () => {
    it('should display warning triangle icon for low stock', () => {
      fixture.componentRef.setInput('alerts', [mockLowStockAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.pi-exclamation-triangle');
      expect(icon).toBeTruthy();
    });

    it('should display times-circle icon for brand zero', () => {
      fixture.componentRef.setInput('alerts', [mockBrandZeroAlert]);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.pi-times-circle');
      expect(icon).toBeTruthy();
    });
  });
});
