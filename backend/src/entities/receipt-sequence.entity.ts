/**
 * Receipt Sequence Entity
 * Configuration for receipt number sequences per register/location
 * Database table: receipt_sequences
 * Owner Module: M-07 Sales (Receipt Number Generation and Sequencing - F-011)
 */
export interface ReceiptSequence {
  id: string;
  register_id: string;
  register_name: string;
  prefix: string;
  current_sequence: number;
  sequence_padding: number;
  format_pattern: string;
  include_date: boolean;
  date_format: string;
  separator: string;
  is_active: boolean;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReceiptSequenceInsert {
  id?: string;
  register_id: string;
  register_name: string;
  prefix?: string;
  current_sequence?: number;
  sequence_padding?: number;
  format_pattern?: string;
  include_date?: boolean;
  date_format?: string;
  separator?: string;
  is_active?: boolean;
  last_generated_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface ReceiptSequenceUpdate {
  register_name?: string;
  prefix?: string;
  current_sequence?: number;
  sequence_padding?: number;
  format_pattern?: string;
  include_date?: boolean;
  date_format?: string;
  separator?: string;
  is_active?: boolean;
  updated_at?: string | null;
}

/**
 * Receipt Number Log Entity
 * Audit log of all generated receipt numbers
 * Database table: receipt_number_logs
 */
export interface ReceiptNumberLog {
  id: string;
  sequence_id: string;
  receipt_number: string;
  sequence_value: number;
  generated_at: string;
  receipt_id: string | null;
}

export interface ReceiptNumberLogInsert {
  id?: string;
  sequence_id: string;
  receipt_number: string;
  sequence_value: number;
  generated_at?: string;
  receipt_id?: string | null;
}

/**
 * Response types for RPC functions
 */
export interface GenerateReceiptNumberResult {
  success: boolean;
  receiptNumber: string | null;
  sequenceValue: number | null;
  registerId: string | null;
  logId: string | null;
  error?: string;
}

export interface PreviewSequenceResult {
  success: boolean;
  nextSequence: number | null;
  previewNumber: string | null;
  registerId: string | null;
  registerName: string | null;
  error?: string;
}

/**
 * Available date formats for receipt numbers
 */
export type ReceiptDateFormat =
  | 'YY-MM'      // 26-01
  | 'YYYY-MM'    // 2026-01
  | 'YY-MM-DD'   // 26-01-30
  | 'YYYYMMDD'   // 20260130
  | 'YYMM'       // 2601
  | 'MMYY';      // 0126

/**
 * Format pattern placeholders
 * {PREFIX} - The prefix string (e.g., 'RCP', 'INV')
 * {SEQ} - The padded sequence number
 * {DATE} - The formatted date (if include_date is true)
 * {REGISTER} - The register ID
 * {SEP} - The separator character
 *
 * Example patterns:
 * '{PREFIX}{SEP}{DATE}{SEP}{SEQ}' => 'RCP-26-01-0001'
 * '{PREFIX}{SEQ}' => 'RCP0001'
 * '{DATE}{SEP}{REGISTER}{SEP}{SEQ}' => '26-01-A-0001'
 */
export const FORMAT_PATTERN_PLACEHOLDERS = [
  '{PREFIX}',
  '{SEQ}',
  '{DATE}',
  '{REGISTER}',
  '{SEP}'
] as const;

export type FormatPatternPlaceholder = typeof FORMAT_PATTERN_PLACEHOLDERS[number];
