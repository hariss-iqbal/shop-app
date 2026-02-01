/**
 * Receipt Sequence DTOs
 * Data Transfer Objects for Receipt Sequence entity
 * Feature: F-011 Receipt Number Generation and Sequencing
 */

export interface CreateReceiptSequenceDto {
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

export interface UpdateReceiptSequenceDto {
  registerName?: string;
  prefix?: string;
  sequencePadding?: number;
  formatPattern?: string;
  includeDate?: boolean;
  dateFormat?: string;
  separator?: string;
  isActive?: boolean;
}

export interface ReceiptSequenceResponseDto {
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

export interface ReceiptSequenceListResponseDto {
  data: ReceiptSequenceResponseDto[];
  total: number;
}

export interface GenerateReceiptNumberRequestDto {
  registerId?: string;
}

export interface GenerateReceiptNumberResponseDto {
  success: boolean;
  receiptNumber: string | null;
  sequenceValue: number | null;
  registerId: string | null;
  logId: string | null;
  error?: string;
}

export interface PreviewReceiptNumberRequestDto {
  prefix?: string;
  sequencePadding?: number;
  formatPattern?: string;
  includeDate?: boolean;
  dateFormat?: string;
  separator?: string;
  sampleSequence?: number;
}

export interface PreviewReceiptNumberResponseDto {
  previewNumber: string;
}

export interface PreviewNextReceiptNumberRequestDto {
  registerId?: string;
}

export interface PreviewNextReceiptNumberResponseDto {
  success: boolean;
  nextSequence: number | null;
  previewNumber: string | null;
  registerId: string | null;
  registerName: string | null;
  error?: string;
}

export interface ReceiptNumberLogResponseDto {
  id: string;
  sequenceId: string;
  receiptNumber: string;
  sequenceValue: number;
  generatedAt: string;
  receiptId: string | null;
}

export interface ReceiptNumberLogListResponseDto {
  data: ReceiptNumberLogResponseDto[];
  total: number;
}

export interface ReceiptNumberLogFilterDto {
  sequenceId?: string;
  receiptNumber?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ResetSequenceDto {
  newStartingValue: number;
}

export interface AvailableDateFormatsResponseDto {
  formats: {
    value: string;
    label: string;
    example: string;
  }[];
}

export interface FormatPatternPlaceholdersResponseDto {
  placeholders: {
    value: string;
    description: string;
  }[];
}
