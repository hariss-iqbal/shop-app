import { TestBed } from '@angular/core/testing';
import { PhoneComparisonService } from './phone-comparison.service';
import { Phone } from '../../models/phone.model';
import { PhoneStatus, PhoneCondition } from '../../enums';

describe('PhoneComparisonService', () => {
  let service: PhoneComparisonService;

  const mockPhones: Phone[] = [
    {
      id: 'phone-1',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: 'https://example.com/apple.png',
      model: 'iPhone 14 Pro',
      description: 'Latest iPhone',
      storageGb: 256,
      ramGb: 6,
      color: 'Space Black',
      condition: PhoneCondition.NEW,
      batteryHealth: null,
      imei: '123456789012345',
      costPrice: 800,
      sellingPrice: 999,
      profitMargin: 19.92,
      status: PhoneStatus.AVAILABLE,
      purchaseDate: '2024-01-15',
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: 'https://example.com/iphone.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: null
    },
    {
      id: 'phone-2',
      brandId: 'brand-2',
      brandName: 'Samsung',
      brandLogoUrl: 'https://example.com/samsung.png',
      model: 'Galaxy S24',
      description: 'Latest Samsung flagship',
      storageGb: 128,
      ramGb: 8,
      color: 'Phantom Black',
      condition: PhoneCondition.USED,
      batteryHealth: 92,
      imei: '987654321098765',
      costPrice: 600,
      sellingPrice: 799,
      profitMargin: 24.91,
      status: PhoneStatus.AVAILABLE,
      purchaseDate: '2024-02-01',
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: null
    },
    {
      id: 'phone-3',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: 'https://example.com/apple.png',
      model: 'iPhone 13',
      description: 'Previous generation iPhone',
      storageGb: 128,
      ramGb: 4,
      color: 'Blue',
      condition: PhoneCondition.REFURBISHED,
      batteryHealth: 85,
      imei: '111222333444555',
      costPrice: 500,
      sellingPrice: 699,
      profitMargin: 28.47,
      status: PhoneStatus.AVAILABLE,
      purchaseDate: '2024-01-20',
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: 'https://example.com/iphone13.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: null
    },
    {
      id: 'phone-4',
      brandId: 'brand-3',
      brandName: 'Google',
      brandLogoUrl: 'https://example.com/google.png',
      model: 'Pixel 8',
      description: 'Google flagship',
      storageGb: 128,
      ramGb: 8,
      color: 'Obsidian',
      condition: PhoneCondition.NEW,
      batteryHealth: null,
      imei: '444555666777888',
      costPrice: 550,
      sellingPrice: 699,
      profitMargin: 21.32,
      status: PhoneStatus.AVAILABLE,
      purchaseDate: '2024-03-01',
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: 'https://example.com/pixel.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: null
    }
  ];

  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(PhoneComparisonService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with empty phones list', () => {
      expect(service.phones().length).toBe(0);
    });

    it('should start with count of 0', () => {
      expect(service.count()).toBe(0);
    });

    it('should not be full initially', () => {
      expect(service.isFull()).toBe(false);
    });

    it('should not have phones initially', () => {
      expect(service.hasPhones()).toBe(false);
    });

    it('should not be able to compare initially', () => {
      expect(service.canCompare()).toBe(false);
    });
  });

  describe('AC1: Compare checkbox/button on phone card', () => {
    it('should add phone when toggling unselected phone', () => {
      const result = service.toggle(mockPhones[0]);

      expect(result).toBe('added');
      expect(service.phones().length).toBe(1);
      expect(service.phones()[0].id).toBe('phone-1');
    });

    it('should remove phone when toggling selected phone', () => {
      service.toggle(mockPhones[0]);
      const result = service.toggle(mockPhones[0]);

      expect(result).toBe('removed');
      expect(service.phones().length).toBe(0);
    });

    it('should correctly check if phone is selected', () => {
      service.toggle(mockPhones[0]);

      expect(service.isSelected('phone-1')).toBe(true);
      expect(service.isSelected('phone-2')).toBe(false);
    });
  });

  describe('AC2: Floating comparison bar with up to 3 phones', () => {
    it('should allow up to 3 phones', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);
      service.toggle(mockPhones[2]);

      expect(service.phones().length).toBe(3);
      expect(service.isFull()).toBe(true);
    });

    it('should report hasPhones when at least one phone selected', () => {
      expect(service.hasPhones()).toBe(false);

      service.toggle(mockPhones[0]);
      expect(service.hasPhones()).toBe(true);
    });

    it('should update count correctly', () => {
      expect(service.count()).toBe(0);

      service.toggle(mockPhones[0]);
      expect(service.count()).toBe(1);

      service.toggle(mockPhones[1]);
      expect(service.count()).toBe(2);

      service.toggle(mockPhones[2]);
      expect(service.count()).toBe(3);
    });
  });

  describe('AC3: Compare button navigates to comparison page', () => {
    it('should allow compare when 2 phones selected', () => {
      service.toggle(mockPhones[0]);
      expect(service.canCompare()).toBe(false);

      service.toggle(mockPhones[1]);
      expect(service.canCompare()).toBe(true);
    });

    it('should allow compare when 3 phones selected', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);
      service.toggle(mockPhones[2]);

      expect(service.canCompare()).toBe(true);
    });

    it('should return phone IDs for URL navigation', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);

      const ids = service.getPhoneIds();
      expect(ids).toEqual(['phone-1', 'phone-2']);
    });
  });

  describe('AC5: Maximum 3 phones limit with user notification', () => {
    it('should return "full" when trying to add 4th phone', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);
      service.toggle(mockPhones[2]);

      const result = service.toggle(mockPhones[3]);
      expect(result).toBe('full');
    });

    it('should not add 4th phone when full', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);
      service.toggle(mockPhones[2]);
      service.toggle(mockPhones[3]);

      expect(service.phones().length).toBe(3);
      expect(service.phones().some(p => p.id === 'phone-4')).toBe(false);
    });

    it('should allow adding again after removal', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);
      service.toggle(mockPhones[2]);

      // Remove one
      service.remove('phone-1');
      expect(service.isFull()).toBe(false);

      // Add new one
      const result = service.toggle(mockPhones[3]);
      expect(result).toBe('added');
      expect(service.phones().length).toBe(3);
    });
  });

  describe('Remove Phone', () => {
    it('should remove specific phone by ID', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);
      service.toggle(mockPhones[2]);

      service.remove('phone-2');

      expect(service.phones().length).toBe(2);
      expect(service.isSelected('phone-2')).toBe(false);
      expect(service.isSelected('phone-1')).toBe(true);
      expect(service.isSelected('phone-3')).toBe(true);
    });

    it('should do nothing when removing non-existent phone', () => {
      service.toggle(mockPhones[0]);
      service.remove('non-existent-id');

      expect(service.phones().length).toBe(1);
    });
  });

  describe('Clear All', () => {
    it('should remove all phones', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);
      service.toggle(mockPhones[2]);

      service.clear();

      expect(service.phones().length).toBe(0);
      expect(service.count()).toBe(0);
      expect(service.hasPhones()).toBe(false);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(false);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update computed signals when phones change', () => {
      expect(service.count()).toBe(0);
      expect(service.hasPhones()).toBe(false);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(false);

      service.toggle(mockPhones[0]);
      expect(service.count()).toBe(1);
      expect(service.hasPhones()).toBe(true);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(false);

      service.toggle(mockPhones[1]);
      expect(service.count()).toBe(2);
      expect(service.hasPhones()).toBe(true);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(true);

      service.toggle(mockPhones[2]);
      expect(service.count()).toBe(3);
      expect(service.hasPhones()).toBe(true);
      expect(service.isFull()).toBe(true);
      expect(service.canCompare()).toBe(true);

      service.clear();
      expect(service.count()).toBe(0);
      expect(service.hasPhones()).toBe(false);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(false);
    });
  });

  describe('Readonly phones signal', () => {
    it('should return readonly version of phones', () => {
      service.toggle(mockPhones[0]);
      const phones = service.phones;

      // Verify it returns the signal function, not a writable signal
      expect(typeof phones).toBe('function');
      expect(phones().length).toBe(1);
    });
  });

  describe('Session Storage Persistence', () => {
    it('should save phones to sessionStorage when adding', () => {
      service.toggle(mockPhones[0]);

      const stored = sessionStorage.getItem('phone_comparison_selection');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe('phone-1');
    });

    it('should update sessionStorage when removing', () => {
      service.toggle(mockPhones[0]);
      service.toggle(mockPhones[1]);
      service.remove('phone-1');

      const stored = sessionStorage.getItem('phone_comparison_selection');
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe('phone-2');
    });

    it('should clear sessionStorage when clearing all', () => {
      service.toggle(mockPhones[0]);
      service.clear();

      const stored = sessionStorage.getItem('phone_comparison_selection');
      expect(stored).toBeNull();
    });

    it('should load phones from sessionStorage on init', () => {
      // Set up sessionStorage before creating a new TestBed service instance
      sessionStorage.setItem('phone_comparison_selection', JSON.stringify([mockPhones[0], mockPhones[1]]));

      // Need to reset TestBed and get a fresh service to test loading
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(PhoneComparisonService);

      expect(newService.phones().length).toBe(2);
      expect(newService.phones()[0].id).toBe('phone-1');
      expect(newService.phones()[1].id).toBe('phone-2');
    });

    it('should handle corrupted sessionStorage gracefully', () => {
      sessionStorage.setItem('phone_comparison_selection', 'invalid-json');

      // Need to reset TestBed and get a fresh service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(PhoneComparisonService);

      // Should not throw and start with empty list
      expect(newService.phones().length).toBe(0);
    });

    it('should ignore empty array in sessionStorage', () => {
      sessionStorage.setItem('phone_comparison_selection', '[]');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(PhoneComparisonService);

      expect(newService.phones().length).toBe(0);
    });

    it('should ignore array with more than 3 phones in sessionStorage', () => {
      sessionStorage.setItem('phone_comparison_selection', JSON.stringify([
        mockPhones[0], mockPhones[1], mockPhones[2], mockPhones[3]
      ]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(PhoneComparisonService);

      expect(newService.phones().length).toBe(0);
    });
  });
});
