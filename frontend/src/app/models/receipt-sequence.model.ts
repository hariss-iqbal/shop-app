/**
 * Receipt Sequence Model
 * TypeScript interfaces for Receipt Sequence feature
 * Feature: F-011 Receipt Number Generation and Sequencing
 */

export interface ReceiptSequence {
  id: string;
  registerId: string;
  registerName: string;
  prefix: string;
  currentSequence: number;
  sequencePadding: number;
  formatPattern: string;
  includeDate: boolean;
  dateFormat: string;
  separator: string;
  isActive: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateReceiptSequenceRequest {
  registerId: string;
  registerName: string;
  prefix?: string;
  startingSequence?: number;
  sequencePadding?: number;
  formatPattern?: string;
  includeDate?: boolean;
  dateFormat?: string;
  separator?: string;
  isActive?: boolean;
}

export interface UpdateReceiptSequenceRequest {
  registerName?: string;
  prefix?: string;
  sequencePadding?: number;
  formatPattern?: string;
  includeDate?: boolean;
  dateFormat?: string;
  separator?: string;
  isActive?: boolean;
}

export interface ReceiptSequenceListResponse {
  data: ReceiptSequence[];
  total: number;
}

export interface GenerateReceiptNumberResponse {
  success: boolean;
  receiptNumber: string | null;
  sequenceValue: number | null;
  registerId: string | null;
  logId: string | null;
  error?: string;
}

export interface PreviewReceiptNumberRequest {
  prefix?: string;
  sequencePadding?: number;
  formatPattern?: string;
  includeDate?: boolean;
  dateFormat?: string;
  separator?: string;
  sampleSequence?: number;
}

export interface PreviewReceiptNumberResponse {
  previewNumber: string;
}

export interface PreviewNextReceiptNumberResponse {
  success: boolean;
  nextSequence: number | null;
  previewNumber: string | null;
  registerId: string | null;
  registerName: string | null;
  error?: string;
}

export interface ReceiptNumberLog {
  id: string;
  sequenceId: string;
  receiptNumber: string;
  sequenceValue: number;
  generatedAt: string;
  receiptId: string | null;
}

export interface ReceiptNumberLogListResponse {
  data: ReceiptNumberLog[];
  total: number;
}

export interface ReceiptNumberLogFilter {
  sequenceId?: string;
  receiptNumber?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ResetSequenceRequest {
  newStartingValue: number;
}

export interface DateFormatOption {
  value: string;
  label: string;
  example: string;
}

export interface FormatPatternPlaceholder {
  value: string;
  description: string;
}

export interface AvailableDateFormatsResponse {
  formats: DateFormatOption[];
}

export interface FormatPatternPlaceholdersResponse {
  placeholders: FormatPatternPlaceholder[];
}

/**
 * Default date format options
 */
export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { value: 'DDMMYYYY', label: 'DDMMYYYY', example: '05022026' },
  { value: 'YY-MM', label: 'YY-MM', example: '26-01' },
  { value: 'YYYY-MM', label: 'YYYY-MM', example: '2026-01' },
  { value: 'YY-MM-DD', label: 'YY-MM-DD', example: '26-01-30' },
  { value: 'YYYYMMDD', label: 'YYYYMMDD', example: '20260130' },
  { value: 'YYMM', label: 'YYMM', example: '2601' },
  { value: 'MMYY', label: 'MMYY', example: '0126' }
];

/**
 * Format pattern placeholders
 */
export const FORMAT_PATTERN_PLACEHOLDERS: FormatPatternPlaceholder[] = [
  { value: '{PREFIX}', description: 'The prefix string (e.g., RCP, INV)' },
  { value: '{SEQ}', description: 'The padded sequence number' },
  { value: '{DATE}', description: 'The formatted date (if include_date is true)' },
  { value: '{REGISTER}', description: 'The register ID' },
  { value: '{SEP}', description: 'The separator character' }
];

/**
 * Predefined format pattern templates
 */
export const FORMAT_PATTERN_TEMPLATES = [
  { name: 'Daily (Default)', pattern: '{DATE}{SEP}{SEQ}', example: '05022026-03' },
  { name: 'Standard', pattern: '{PREFIX}{SEP}{DATE}{SEP}{SEQ}', example: 'RCP-26-01-0001' },
  { name: 'Simple', pattern: '{PREFIX}{SEQ}', example: 'RCP0001' },
  { name: 'With Register', pattern: '{DATE}{SEP}{REGISTER}{SEP}{SEQ}', example: '26-01-A-0001' },
  { name: 'Date First', pattern: '{DATE}{SEP}{PREFIX}{SEP}{SEQ}', example: '26-01-RCP-0001' },
  { name: 'Compact', pattern: '{PREFIX}{DATE}{SEQ}', example: 'RCP26010001' }
];

/**
 * Validation constraints
 */
export const RECEIPT_SEQUENCE_CONSTRAINTS = {
  REGISTER_ID_MAX: 50,
  REGISTER_NAME_MAX: 100,
  PREFIX_MAX: 20,
  FORMAT_PATTERN_MAX: 100,
  DATE_FORMAT_MAX: 20,
  SEPARATOR_MAX: 5,
  SEQUENCE_PADDING_MIN: 1,
  SEQUENCE_PADDING_MAX: 10
} as const;
