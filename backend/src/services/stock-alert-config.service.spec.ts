import { StockAlertConfigService } from './stock-alert-config.service';
import { StockAlertConfigRepository } from '../repositories/stock-alert-config.repository';
import { PhoneRepository } from '../repositories/phone.repository';
import { BrandRepository } from '../repositories/brand.repository';
import { PhoneStatus } from '../enums';

/**
 * StockAlertConfig Service Tests
 * Verifies alert computation logic, config management, and edge cases
 */

function createMockStockAlertConfigRepo(overrides: Partial<StockAlertConfigRepository> = {}): StockAlertConfigRepository {
  return {
    get: async () => null,
    create: async (config) => ({
      id: 'config-1',
      low_stock_threshold: config.low_stock_threshold ?? 5,
      enable_brand_zero_alert: config.enable_brand_zero_alert ?? true,
      created_at: new Date().toISOString(),
      updated_at: null
    }),
    update: async (id, config) => ({
      id,
      low_stock_threshold: config.low_stock_threshold ?? 5,
      enable_brand_zero_alert: config.enable_brand_zero_alert ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    getOrCreate: async () => ({
      id: 'config-1',
      low_stock_threshold: 5,
      enable_brand_zero_alert: true,
      created_at: new Date().toISOString(),
      updated_at: null
    }),
    ...overrides
  } as StockAlertConfigRepository;
}

function createMockPhoneRepo(overrides: Partial<PhoneRepository> = {}): PhoneRepository {
  return {
    count: async () => 10,
    countByBrand: async () => 3,
    ...overrides
  } as PhoneRepository;
}

function createMockBrandRepo(overrides: Partial<BrandRepository> = {}): BrandRepository {
  return {
    findAll: async () => [
      { id: 'brand-1', name: 'Apple', logo_url: null, created_at: '', updated_at: null },
      { id: 'brand-2', name: 'Samsung', logo_url: null, created_at: '', updated_at: null },
    ],
    ...overrides
  } as BrandRepository;
}

async function runTests(): Promise<void> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string): void {
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL: ${testName}`);
      failed++;
    }
  }

  console.log('StockAlertConfigService Tests');
  console.log('=============================\n');

  // get() Tests
  console.log('get():');
  {
    const configRepo = createMockStockAlertConfigRepo();
    const service = new StockAlertConfigService(configRepo, createMockPhoneRepo(), createMockBrandRepo());

    const result = await service.get();
    assert(result.id === 'config-1', 'returns config id');
    assert(result.lowStockThreshold === 5, 'returns default threshold');
    assert(result.enableBrandZeroAlert === true, 'returns default brand zero alert enabled');
    assert(result.createdAt !== undefined, 'returns createdAt');
  }

  // update() Tests
  console.log('\nupdate():');
  {
    const configRepo = createMockStockAlertConfigRepo({
      update: async (id, config) => ({
        id,
        low_stock_threshold: config.low_stock_threshold ?? 5,
        enable_brand_zero_alert: config.enable_brand_zero_alert ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    const service = new StockAlertConfigService(configRepo, createMockPhoneRepo(), createMockBrandRepo());

    const result = await service.update({ lowStockThreshold: 10 });
    assert(result.lowStockThreshold === 10, 'updates threshold to 10');

    const result2 = await service.update({ enableBrandZeroAlert: false });
    assert(result2.enableBrandZeroAlert === false, 'updates brand zero alert to false');
  }

  // getAlerts() Tests - No alerts when stock is above threshold
  console.log('\ngetAlerts() - No alerts:');
  {
    const phoneRepo = createMockPhoneRepo({
      count: async () => 10,
      countByBrand: async () => 5,
    });
    const service = new StockAlertConfigService(
      createMockStockAlertConfigRepo(),
      phoneRepo,
      createMockBrandRepo()
    );

    const result = await service.getAlerts();
    assert(result.alerts.length === 0, 'no alerts when stock is above threshold');
    assert(result.config.lowStockThreshold === 5, 'returns config with alerts');
  }

  // getAlerts() Tests - Low stock alert triggered
  console.log('\ngetAlerts() - Low stock alert:');
  {
    const phoneRepo = createMockPhoneRepo({
      count: async (status?: string) => {
        if (status === PhoneStatus.AVAILABLE) return 3;
        return 10;
      },
      countByBrand: async () => 2,
    });
    const service = new StockAlertConfigService(
      createMockStockAlertConfigRepo(),
      phoneRepo,
      createMockBrandRepo()
    );

    const result = await service.getAlerts();
    const lowStockAlerts = result.alerts.filter(a => a.type === 'low_stock');
    assert(lowStockAlerts.length === 1, 'generates low stock alert');
    assert(lowStockAlerts[0].currentStock === 3, 'alert shows current stock count');
    assert(lowStockAlerts[0].threshold === 5, 'alert shows threshold');
    assert(lowStockAlerts[0].message.includes('3'), 'alert message includes stock count');
    assert(lowStockAlerts[0].message.includes('5'), 'alert message includes threshold');
  }

  // getAlerts() Tests - Brand zero stock alert
  console.log('\ngetAlerts() - Brand zero stock alert:');
  {
    const phoneRepo = createMockPhoneRepo({
      count: async () => 10,
      countByBrand: async (brandId: string) => {
        if (brandId === 'brand-1') return 0;
        return 5;
      },
    });
    const service = new StockAlertConfigService(
      createMockStockAlertConfigRepo(),
      phoneRepo,
      createMockBrandRepo()
    );

    const result = await service.getAlerts();
    const brandAlerts = result.alerts.filter(a => a.type === 'brand_zero');
    assert(brandAlerts.length === 1, 'generates one brand zero alert');
    assert(brandAlerts[0].brandId === 'brand-1', 'alert references correct brand');
    assert(brandAlerts[0].brandName === 'Apple', 'alert includes brand name');
    assert(brandAlerts[0].currentStock === 0, 'alert shows zero stock');
    assert(brandAlerts[0].message.includes('Apple'), 'alert message includes brand name');
  }

  // getAlerts() Tests - Brand zero alert disabled
  console.log('\ngetAlerts() - Brand zero alert disabled:');
  {
    const configRepo = createMockStockAlertConfigRepo({
      getOrCreate: async () => ({
        id: 'config-1',
        low_stock_threshold: 5,
        enable_brand_zero_alert: false,
        created_at: new Date().toISOString(),
        updated_at: null
      })
    });
    const phoneRepo = createMockPhoneRepo({
      count: async () => 10,
      countByBrand: async () => 0,
    });
    const service = new StockAlertConfigService(
      configRepo,
      phoneRepo,
      createMockBrandRepo()
    );

    const result = await service.getAlerts();
    const brandAlerts = result.alerts.filter(a => a.type === 'brand_zero');
    assert(brandAlerts.length === 0, 'no brand alerts when disabled');
  }

  // getAlerts() Tests - Both low stock and brand zero alerts
  console.log('\ngetAlerts() - Multiple alerts:');
  {
    const phoneRepo = createMockPhoneRepo({
      count: async () => 2,
      countByBrand: async (brandId: string) => {
        if (brandId === 'brand-1') return 0;
        if (brandId === 'brand-2') return 2;
        return 0;
      },
    });
    const service = new StockAlertConfigService(
      createMockStockAlertConfigRepo(),
      phoneRepo,
      createMockBrandRepo()
    );

    const result = await service.getAlerts();
    assert(result.alerts.length === 2, 'generates both low stock and brand zero alerts');
    assert(result.alerts.some(a => a.type === 'low_stock'), 'includes low stock alert');
    assert(result.alerts.some(a => a.type === 'brand_zero'), 'includes brand zero alert');
  }

  // getAlerts() Tests - Zero threshold means alert only at exactly 0
  console.log('\ngetAlerts() - Zero threshold:');
  {
    const configRepo = createMockStockAlertConfigRepo({
      getOrCreate: async () => ({
        id: 'config-1',
        low_stock_threshold: 0,
        enable_brand_zero_alert: true,
        created_at: new Date().toISOString(),
        updated_at: null
      })
    });
    const phoneRepo = createMockPhoneRepo({
      count: async () => 0,
      countByBrand: async () => 0,
    });
    const service = new StockAlertConfigService(
      configRepo,
      phoneRepo,
      createMockBrandRepo()
    );

    const result = await service.getAlerts();
    const lowStockAlerts = result.alerts.filter(a => a.type === 'low_stock');
    assert(lowStockAlerts.length === 0, 'no low stock alert when threshold is 0 (0 < 0 is false)');
  }

  // getAlerts() Tests - Exactly at threshold means no alert
  console.log('\ngetAlerts() - Stock equals threshold:');
  {
    const phoneRepo = createMockPhoneRepo({
      count: async () => 5,
      countByBrand: async () => 3,
    });
    const service = new StockAlertConfigService(
      createMockStockAlertConfigRepo(),
      phoneRepo,
      createMockBrandRepo()
    );

    const result = await service.getAlerts();
    const lowStockAlerts = result.alerts.filter(a => a.type === 'low_stock');
    assert(lowStockAlerts.length === 0, 'no alert when stock equals threshold');
  }

  console.log(`\n=============================`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
