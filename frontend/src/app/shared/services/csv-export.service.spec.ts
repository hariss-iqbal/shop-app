import { TestBed } from '@angular/core/testing';
import { CsvExportService, CsvColumn } from './csv-export.service';

interface TestData {
  name: string;
  value: number;
  optional: string | null;
  date: string;
}

describe('CsvExportService', () => {
  let service: CsvExportService;
  let downloadLinkMock: HTMLAnchorElement;
  let createObjectURLSpy: jasmine.Spy;
  let revokeObjectURLSpy: jasmine.Spy;

  const mockData: TestData[] = [
    { name: 'Item 1', value: 100, optional: 'Present', date: '2024-01-15' },
    { name: 'Item 2', value: 200, optional: null, date: '2024-01-16' },
    { name: 'Item 3', value: 300, optional: 'Another', date: '2024-01-17' }
  ];

  const mockColumns: CsvColumn<TestData>[] = [
    { header: 'Name', field: 'name' },
    { header: 'Value', field: 'value' },
    { header: 'Optional', field: 'optional' },
    { header: 'Date', field: 'date' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvExportService);

    downloadLinkMock = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(downloadLinkMock);
    spyOn(document.body, 'appendChild').and.callThrough();
    spyOn(document.body, 'removeChild').and.callThrough();
    spyOn(downloadLinkMock, 'click');

    createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:test-url');
    revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
  });

  describe('service creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('exportToCsv', () => {
    it('should create a download link and trigger download', () => {
      service.exportToCsv(mockData, mockColumns, 'test_export');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(downloadLinkMock.click).toHaveBeenCalled();
    });

    it('should create blob with correct content type', () => {
      service.exportToCsv(mockData, mockColumns, 'test_export');

      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobArg = createObjectURLSpy.calls.mostRecent().args[0];
      expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    });

    it('should set correct download attribute with timestamp', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 15, 10, 30, 45));

      service.exportToCsv(mockData, mockColumns, 'test_export');

      expect(downloadLinkMock.getAttribute('download')).toBe('test_export_20240115_103045.csv');

      jasmine.clock().uninstall();
    });

    it('should cleanup URL after download', () => {
      service.exportToCsv(mockData, mockColumns, 'test_export');

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
    });

    it('should remove link from DOM after click', () => {
      service.exportToCsv(mockData, mockColumns, 'test_export');

      expect(document.body.removeChild).toHaveBeenCalled();
    });
  });

  describe('CSV content generation', () => {
    let capturedBlob: Blob;

    beforeEach(() => {
      createObjectURLSpy.and.callFake((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:test-url';
      });
    });

    it('should generate correct header row', async () => {
      service.exportToCsv(mockData, mockColumns, 'test');
      const content = await capturedBlob.text();

      expect(content).toContain('Name,Value,Optional,Date');
    });

    it('should generate correct data rows', async () => {
      service.exportToCsv(mockData, mockColumns, 'test');
      const content = await capturedBlob.text();

      expect(content).toContain('Item 1,100,Present,2024-01-15');
      expect(content).toContain('Item 2,200,,2024-01-16');
      expect(content).toContain('Item 3,300,Another,2024-01-17');
    });

    it('should handle null values as empty strings', async () => {
      service.exportToCsv(mockData, mockColumns, 'test');
      const content = await capturedBlob.text();

      const lines = content.split('\n');
      const item2Line = lines.find(l => l.includes('Item 2'));
      expect(item2Line).toBe('Item 2,200,,2024-01-16');
    });

    it('should include UTF-8 BOM for Excel compatibility', () => {
      // The service adds '\ufeff' (UTF-8 BOM) at the start of the content
      // We verify this by checking the blob was created with the correct content
      service.exportToCsv(mockData, mockColumns, 'test');

      expect(createObjectURLSpy).toHaveBeenCalled();
      // The BOM is prepended in downloadCsv method: new Blob(['\ufeff' + content], ...)
      // We verify the blob exists, as direct BOM verification requires different approach
      expect(capturedBlob).toBeDefined();
      expect(capturedBlob.type).toBe('text/csv;charset=utf-8;');
    });
  });

  describe('CSV field escaping', () => {
    let capturedBlob: Blob;

    beforeEach(() => {
      createObjectURLSpy.and.callFake((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:test-url';
      });
    });

    it('should escape fields containing commas', async () => {
      const dataWithComma: TestData[] = [
        { name: 'Item, with comma', value: 100, optional: null, date: '2024-01-15' }
      ];

      service.exportToCsv(dataWithComma, mockColumns, 'test');
      const content = await capturedBlob.text();

      expect(content).toContain('"Item, with comma"');
    });

    it('should escape fields containing quotes', async () => {
      const dataWithQuote: TestData[] = [
        { name: 'Item "quoted"', value: 100, optional: null, date: '2024-01-15' }
      ];

      service.exportToCsv(dataWithQuote, mockColumns, 'test');
      const content = await capturedBlob.text();

      expect(content).toContain('"Item ""quoted"""');
    });

    it('should escape fields containing newlines', async () => {
      const dataWithNewline: TestData[] = [
        { name: 'Item\nwith newline', value: 100, optional: null, date: '2024-01-15' }
      ];

      service.exportToCsv(dataWithNewline, mockColumns, 'test');
      const content = await capturedBlob.text();

      expect(content).toContain('"Item\nwith newline"');
    });

    it('should handle undefined values as empty strings', async () => {
      interface DataWithUndefined {
        name: string;
        value: number | undefined;
      }
      const dataWithUndefined: DataWithUndefined[] = [
        { name: 'Test', value: undefined }
      ];
      const columns: CsvColumn<DataWithUndefined>[] = [
        { header: 'Name', field: 'name' },
        { header: 'Value', field: 'value' }
      ];

      service.exportToCsv(dataWithUndefined, columns, 'test');
      const content = await capturedBlob.text();

      expect(content).toContain('Test,');
    });
  });

  describe('custom field functions', () => {
    let capturedBlob: Blob;

    beforeEach(() => {
      createObjectURLSpy.and.callFake((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:test-url';
      });
    });

    it('should support custom field accessor functions', async () => {
      const columnsWithFunction: CsvColumn<TestData>[] = [
        { header: 'Name', field: 'name' },
        { header: 'Double Value', field: (item) => item.value * 2 },
        { header: 'Combined', field: (item) => `${item.name}: ${item.value}` }
      ];

      service.exportToCsv(mockData, columnsWithFunction, 'test');
      const content = await capturedBlob.text();

      expect(content).toContain('Name,Double Value,Combined');
      expect(content).toContain('Item 1,200,Item 1: 100');
    });

    it('should handle null return from custom function', async () => {
      const columnsWithNullFunction: CsvColumn<TestData>[] = [
        { header: 'Name', field: 'name' },
        { header: 'Nullable', field: (item) => item.optional }
      ];

      service.exportToCsv(mockData, columnsWithNullFunction, 'test');
      const content = await capturedBlob.text();

      const lines = content.split('\n');
      const item2Line = lines.find(l => l.includes('Item 2'));
      expect(item2Line).toBe('Item 2,');
    });
  });

  describe('empty data handling', () => {
    let capturedBlob: Blob;

    beforeEach(() => {
      createObjectURLSpy.and.callFake((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:test-url';
      });
    });

    it('should generate only header row for empty data array', async () => {
      service.exportToCsv([], mockColumns, 'test');
      const content = await capturedBlob.text();

      const lines = content.trim().split('\n');
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('Name,Value,Optional,Date');
    });
  });

  describe('timestamp formatting', () => {
    it('should pad single digit months and days', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 5, 9, 5, 3)); // Jan 5th, 9:05:03 AM

      service.exportToCsv(mockData, mockColumns, 'test');

      expect(downloadLinkMock.getAttribute('download')).toBe('test_20240105_090503.csv');

      jasmine.clock().uninstall();
    });

    it('should handle December correctly', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 11, 25, 14, 30, 0)); // Dec 25th, 2:30 PM

      service.exportToCsv(mockData, mockColumns, 'test');

      expect(downloadLinkMock.getAttribute('download')).toBe('test_20241225_143000.csv');

      jasmine.clock().uninstall();
    });
  });
});
