import { ReceiptSequenceService } from '../services/receipt-sequence.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateReceiptSequenceDto,
  UpdateReceiptSequenceDto,
  ReceiptSequenceResponseDto,
  ReceiptSequenceListResponseDto,
  GenerateReceiptNumberResponseDto,
  PreviewReceiptNumberRequestDto,
  PreviewReceiptNumberResponseDto,
  PreviewNextReceiptNumberResponseDto,
  ReceiptNumberLogListResponseDto,
  ReceiptNumberLogFilterDto,
  ResetSequenceDto,
  AvailableDateFormatsResponseDto,
  FormatPatternPlaceholdersResponseDto
} from '../dto/receipt-sequence.dto';

/**
 * Receipt Sequence Constraints
 */
const RECEIPT_SEQUENCE_CONSTRAINTS = {
  REGISTER_ID_MAX: 50,
  REGISTER_NAME_MAX: 100,
  PREFIX_MAX: 20,
  FORMAT_PATTERN_MAX: 100,
  DATE_FORMAT_MAX: 20,
  SEPARATOR_MAX: 5,
  SEQUENCE_PADDING_MIN: 1,
  SEQUENCE_PADDING_MAX: 10
} as const;

/**
 * Receipt Sequence Controller
 * HTTP request handling for Receipt Sequence entity
 * Routes: /api/receipt-sequences
 * Feature: F-011 Receipt Number Generation and Sequencing
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 */
export class ReceiptSequenceController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly service: ReceiptSequenceService) {}

  async getAll(isActive?: boolean): Promise<ReceiptSequenceListResponseDto> {
    return this.service.findAll(isActive);
  }

  async getById(id: string): Promise<ReceiptSequenceResponseDto> {
    const sequence = await this.service.findById(id);
    if (!sequence) {
      throw new Error('Sequence not found');
    }
    return sequence;
  }

  async getByRegisterId(registerId: string): Promise<ReceiptSequenceResponseDto> {
    const sequence = await this.service.findByRegisterId(registerId);
    if (!sequence) {
      throw new Error('Sequence not found');
    }
    return sequence;
  }

  async create(dto: CreateReceiptSequenceDto): Promise<ReceiptSequenceResponseDto> {
    const sanitizedDto = this.sanitizeCreateDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.service.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateReceiptSequenceDto): Promise<ReceiptSequenceResponseDto> {
    const sanitizedDto = this.sanitizeUpdateDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.service.update(id, sanitizedDto);
  }

  async delete(id: string): Promise<void> {
    return this.service.delete(id);
  }

  async generateNextReceiptNumber(registerId: string = 'DEFAULT'): Promise<GenerateReceiptNumberResponseDto> {
    return this.service.generateNextReceiptNumber(registerId);
  }

  async previewReceiptNumberFormat(dto: PreviewReceiptNumberRequestDto): Promise<PreviewReceiptNumberResponseDto> {
    this.validatePreviewDto(dto);
    return this.service.previewReceiptNumberFormat(dto);
  }

  async previewNextReceiptNumber(registerId: string = 'DEFAULT'): Promise<PreviewNextReceiptNumberResponseDto> {
    return this.service.previewNextReceiptNumber(registerId);
  }

  async linkReceiptNumberToReceipt(logId: string, receiptId: string): Promise<{ success: boolean }> {
    const result = await this.service.linkReceiptNumberToReceipt(logId, receiptId);
    return { success: result };
  }

  async resetSequence(id: string, dto: ResetSequenceDto): Promise<ReceiptSequenceResponseDto> {
    if (dto.newStartingValue < 1) {
      throw new Error('New starting value must be at least 1');
    }
    return this.service.resetSequence(id, dto.newStartingValue);
  }

  async getLogs(filter?: ReceiptNumberLogFilterDto): Promise<ReceiptNumberLogListResponseDto> {
    return this.service.getLogs(filter);
  }

  async receiptNumberExists(receiptNumber: string): Promise<{ exists: boolean }> {
    const exists = await this.service.receiptNumberExists(receiptNumber);
    return { exists };
  }

  getAvailableDateFormats(): AvailableDateFormatsResponseDto {
    return this.service.getAvailableDateFormats();
  }

  getFormatPatternPlaceholders(): FormatPatternPlaceholdersResponseDto {
    return this.service.getFormatPatternPlaceholders();
  }

  private sanitizeCreateDto(dto: CreateReceiptSequenceDto): CreateReceiptSequenceDto {
    return {
      ...dto,
      registerId: this.sanitizer.sanitizeString(dto.registerId),
      registerName: this.sanitizer.sanitizeString(dto.registerName),
      prefix: dto.prefix ? this.sanitizer.sanitizeString(dto.prefix) : dto.prefix,
      formatPattern: dto.formatPattern ? this.sanitizer.sanitizeString(dto.formatPattern) : dto.formatPattern,
      dateFormat: dto.dateFormat ? this.sanitizer.sanitizeString(dto.dateFormat) : dto.dateFormat,
      separator: dto.separator ? this.sanitizer.sanitizeString(dto.separator) : dto.separator
    };
  }

  private sanitizeUpdateDto(dto: UpdateReceiptSequenceDto): UpdateReceiptSequenceDto {
    return {
      ...dto,
      registerName: dto.registerName ? this.sanitizer.sanitizeString(dto.registerName) : dto.registerName,
      prefix: dto.prefix ? this.sanitizer.sanitizeString(dto.prefix) : dto.prefix,
      formatPattern: dto.formatPattern ? this.sanitizer.sanitizeString(dto.formatPattern) : dto.formatPattern,
      dateFormat: dto.dateFormat ? this.sanitizer.sanitizeString(dto.dateFormat) : dto.dateFormat,
      separator: dto.separator ? this.sanitizer.sanitizeString(dto.separator) : dto.separator
    };
  }

  private validateCreateDto(dto: CreateReceiptSequenceDto): void {
    if (!dto.registerId) {
      throw new Error('Register ID is required');
    }
    if (dto.registerId.length > RECEIPT_SEQUENCE_CONSTRAINTS.REGISTER_ID_MAX) {
      throw new Error(`Register ID must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.REGISTER_ID_MAX} characters`);
    }
    if (!dto.registerName) {
      throw new Error('Register name is required');
    }
    if (dto.registerName.length > RECEIPT_SEQUENCE_CONSTRAINTS.REGISTER_NAME_MAX) {
      throw new Error(`Register name must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.REGISTER_NAME_MAX} characters`);
    }
    if (dto.prefix && dto.prefix.length > RECEIPT_SEQUENCE_CONSTRAINTS.PREFIX_MAX) {
      throw new Error(`Prefix must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.PREFIX_MAX} characters`);
    }
    if (dto.formatPattern && dto.formatPattern.length > RECEIPT_SEQUENCE_CONSTRAINTS.FORMAT_PATTERN_MAX) {
      throw new Error(`Format pattern must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.FORMAT_PATTERN_MAX} characters`);
    }
    if (dto.dateFormat && dto.dateFormat.length > RECEIPT_SEQUENCE_CONSTRAINTS.DATE_FORMAT_MAX) {
      throw new Error(`Date format must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.DATE_FORMAT_MAX} characters`);
    }
    if (dto.separator && dto.separator.length > RECEIPT_SEQUENCE_CONSTRAINTS.SEPARATOR_MAX) {
      throw new Error(`Separator must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.SEPARATOR_MAX} characters`);
    }
    if (dto.sequencePadding !== undefined) {
      if (dto.sequencePadding < RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MIN ||
          dto.sequencePadding > RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MAX) {
        throw new Error(`Sequence padding must be between ${RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MIN} and ${RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MAX}`);
      }
    }
    if (dto.startingSequence !== undefined && dto.startingSequence < 1) {
      throw new Error('Starting sequence must be at least 1');
    }
  }

  private validateUpdateDto(dto: UpdateReceiptSequenceDto): void {
    if (dto.registerName && dto.registerName.length > RECEIPT_SEQUENCE_CONSTRAINTS.REGISTER_NAME_MAX) {
      throw new Error(`Register name must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.REGISTER_NAME_MAX} characters`);
    }
    if (dto.prefix && dto.prefix.length > RECEIPT_SEQUENCE_CONSTRAINTS.PREFIX_MAX) {
      throw new Error(`Prefix must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.PREFIX_MAX} characters`);
    }
    if (dto.formatPattern && dto.formatPattern.length > RECEIPT_SEQUENCE_CONSTRAINTS.FORMAT_PATTERN_MAX) {
      throw new Error(`Format pattern must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.FORMAT_PATTERN_MAX} characters`);
    }
    if (dto.dateFormat && dto.dateFormat.length > RECEIPT_SEQUENCE_CONSTRAINTS.DATE_FORMAT_MAX) {
      throw new Error(`Date format must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.DATE_FORMAT_MAX} characters`);
    }
    if (dto.separator && dto.separator.length > RECEIPT_SEQUENCE_CONSTRAINTS.SEPARATOR_MAX) {
      throw new Error(`Separator must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.SEPARATOR_MAX} characters`);
    }
    if (dto.sequencePadding !== undefined) {
      if (dto.sequencePadding < RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MIN ||
          dto.sequencePadding > RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MAX) {
        throw new Error(`Sequence padding must be between ${RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MIN} and ${RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MAX}`);
      }
    }
  }

  private validatePreviewDto(dto: PreviewReceiptNumberRequestDto): void {
    if (dto.prefix && dto.prefix.length > RECEIPT_SEQUENCE_CONSTRAINTS.PREFIX_MAX) {
      throw new Error(`Prefix must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.PREFIX_MAX} characters`);
    }
    if (dto.formatPattern && dto.formatPattern.length > RECEIPT_SEQUENCE_CONSTRAINTS.FORMAT_PATTERN_MAX) {
      throw new Error(`Format pattern must not exceed ${RECEIPT_SEQUENCE_CONSTRAINTS.FORMAT_PATTERN_MAX} characters`);
    }
    if (dto.sequencePadding !== undefined) {
      if (dto.sequencePadding < RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MIN ||
          dto.sequencePadding > RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MAX) {
        throw new Error(`Sequence padding must be between ${RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MIN} and ${RECEIPT_SEQUENCE_CONSTRAINTS.SEQUENCE_PADDING_MAX}`);
      }
    }
  }
}
