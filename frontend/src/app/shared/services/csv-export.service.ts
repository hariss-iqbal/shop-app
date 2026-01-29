import { Injectable } from '@angular/core';

export interface CsvColumn<T> {
  header: string;
  field: keyof T | ((item: T) => string | number | null | undefined);
}

@Injectable({
  providedIn: 'root'
})
export class CsvExportService {

  exportToCsv<T>(data: T[], columns: CsvColumn<T>[], filenamePrefix: string): void {
    const headerRow = columns.map(col => this.escapeCsvField(col.header)).join(',');

    const dataRows = data.map(item =>
      columns.map(col => {
        const value = typeof col.field === 'function'
          ? col.field(item)
          : item[col.field];
        return this.escapeCsvField(value as string | number | null | undefined);
      }).join(',')
    );

    const csvContent = [headerRow, ...dataRows].join('\n');
    const timestamp = this.formatTimestamp(new Date());
    const filename = `${filenamePrefix}_${timestamp}.csv`;

    this.downloadCsv(csvContent, filename);
  }

  private escapeCsvField(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
