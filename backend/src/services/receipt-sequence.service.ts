import { ReceiptSequenceRepository } from '../repositories/receipt-sequence.repository';
import {
  ReceiptSequence,
  ReceiptSequenceInsert,
  ReceiptSequenceUpdate
} from '../entities/receipt-sequence.entity';
import {
  CreateReceiptSequenceDto,
  UpdateReceiptSequenceDto,
  ReceiptSequenceResponseDto,
  ReceiptSequenceListResponseDto,
  GenerateReceiptNumberResponseDto,
  PreviewReceiptNumberRequestDto,
  PreviewReceiptNumberResponseDto,
  PreviewNextReceiptNumberResponseDto,
  ReceiptNumberLogResponseDto,
  ReceiptNumberLogListResponseDto,
  ReceiptNumberLogFilterDto,
  AvailableDateFormatsResponseDto,
  FormatPatternPlaceholdersResponseDto
} from '../dto/receipt-sequence.dto';

/**
 * Receipt Sequence Service
 * Business logic for Receipt Sequence entity
 * Feature: F-011 Receipt Number Generation and Sequencing
 */
export class ReceiptSequenceService {
  constructor(private readonly repository: ReceiptSequenceRepository) {}

  async findAll(isActive?: boolean): Promise<ReceiptSequenceListResponseDto> {
    const sequences = await this.repository.findAll({ isActive });
    const total = await this.repository.count({ isActive });

    return {
      data: sequences.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<ReceiptSequenceResponseDto | null> {
    const sequence = await this.repository.findById(id);
    return sequence ? this.toResponseDto(sequence) : null;
  }

  async findByRegisterId(registerId: string): Promise<ReceiptSequenceResponseDto | null> {
    const sequence = await this.repository.findByRegisterId(registerId);
    return sequence ? this.toResponseDto(sequence) : null;
  }

  async create(dto: CreateReceiptSequenceDto): Promise<ReceiptSequenceResponseDto> {
    const existing = await this.repository.findByRegisterId(dto.registerId);
    if (existing) {
      throw new Error(`Sequence with register ID "${dto.registerId}" already exists`);
    }

    const sequenceInsert: ReceiptSequenceInsert = {
      register_id: dto.registerId.trim().toUpperCase(),
      register_name: dto.registerName.trim(),
      prefix: dto.prefix?.trim() || '',
      current_sequence: (dto.startingSequence ?? 1000) - 1,
      sequence_padding: dto.sequencePadding ?? 4,
      format_pattern: dto.formatPattern || '{PREFIX}{SEP}{DATE}{SEP}{SEQ}',
      include_date: dto.includeDate ?? true,
      date_format: dto.dateFormat || 'YY-MM',
      separator: dto.separator || '-',
      is_active: dto.isActive ?? true
    };

    const sequence = await this.repository.create(sequenceInsert);
    return this.toResponseDto(sequence);
  }

  async update(id: string, dto: UpdateReceiptSequenceDto): Promise<ReceiptSequenceResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Sequence with id "${id}" not found`);
    }

    const sequenceUpdate: ReceiptSequenceUpdate = {
      ...(dto.registerName !== undefined && { register_name: dto.registerName.trim() }),
      ...(dto.prefix !== undefined && { prefix: dto.prefix.trim() }),
      ...(dto.sequencePadding !== undefined && { sequence_padding: dto.sequencePadding }),
      ...(dto.formatPattern !== undefined && { format_pattern: dto.formatPattern }),
      ...(dto.includeDate !== undefined && { include_date: dto.includeDate }),
      ...(dto.dateFormat !== undefined && { date_format: dto.dateFormat }),
      ...(dto.separator !== undefined && { separator: dto.separator }),
      ...(dto.isActive !== undefined && { is_active: dto.isActive })
    };

    await this.repository.update(id, sequenceUpdate);
    const updated = await this.repository.findById(id);
    return this.toResponseDto(updated!);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Sequence with id "${id}" not found`);
    }

    if (existing.register_id === 'DEFAULT') {
      throw new Error('Cannot delete the default sequence');
    }

    await this.repository.delete(id);
  }

  async generateNextReceiptNumber(registerId: string = 'DEFAULT'): Promise<GenerateReceiptNumberResponseDto> {
    const result = await this.repository.generateNextReceiptNumber(registerId);
    return {
      success: result.success,
      receiptNumber: result.receiptNumber,
      sequenceValue: result.sequenceValue,
      registerId: result.registerId,
      logId: result.logId,
      error: result.error
    };
  }

  async previewReceiptNumberFormat(dto: PreviewReceiptNumberRequestDto): Promise<PreviewReceiptNumberResponseDto> {
    const previewNumber = await this.repository.previewReceiptNumberFormat({
      prefix: dto.prefix,
      sequencePadding: dto.sequencePadding,
      formatPattern: dto.formatPattern,
      includeDate: dto.includeDate,
      dateFormat: dto.dateFormat,
      separator: dto.separator,
      sampleSequence: dto.sampleSequence
    });

    return { previewNumber };
  }

  async previewNextReceiptNumber(registerId: string = 'DEFAULT'): Promise<PreviewNextReceiptNumberResponseDto> {
    const result = await this.repository.getNextSequencePreview(registerId);
    return {
      success: result.success,
      nextSequence: result.nextSequence,
      previewNumber: result.previewNumber,
      registerId: result.registerId,
      registerName: result.registerName,
      error: result.error
    };
  }

  async linkReceiptNumberToReceipt(logId: string, receiptId: string): Promise<boolean> {
    return this.repository.linkReceiptNumberToReceipt(logId, receiptId);
  }

  async resetSequence(id: string, newStartingValue: number): Promise<ReceiptSequenceResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Sequence with id "${id}" not found`);
    }

    if (newStartingValue < 1) {
      throw new Error('Starting value must be at least 1');
    }

    const sequence = await this.repository.resetSequence(id, newStartingValue);
    return this.toResponseDto(sequence);
  }

  async getLogs(filter?: ReceiptNumberLogFilterDto): Promise<ReceiptNumberLogListResponseDto> {
    const limit = filter?.limit || 20;
    const page = filter?.page || 1;
    const offset = (page - 1) * limit;

    const logs = await this.repository.getLogs({
      sequenceId: filter?.sequenceId,
      receiptNumber: filter?.receiptNumber,
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      limit,
      offset
    });

    const total = await this.repository.countLogs({
      sequenceId: filter?.sequenceId,
      receiptNumber: filter?.receiptNumber,
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    return {
      data: logs.map(this.toLogResponseDto),
      total
    };
  }

  async receiptNumberExists(receiptNumber: string): Promise<boolean> {
    return this.repository.receiptNumberExists(receiptNumber);
  }

  getAvailableDateFormats(): AvailableDateFormatsResponseDto {
    return {
      formats: [
        { value: 'DDMMYYYY', label: 'DDMMYYYY', example: '05022026' },
        { value: 'YY-MM', label: 'YY-MM', example: '26-01' },
        { value: 'YYYY-MM', label: 'YYYY-MM', example: '2026-01' },
        { value: 'YY-MM-DD', label: 'YY-MM-DD', example: '26-01-30' },
        { value: 'YYYYMMDD', label: 'YYYYMMDD', example: '20260130' },
        { value: 'YYMM', label: 'YYMM', example: '2601' },
        { value: 'MMYY', label: 'MMYY', example: '0126' }
      ]
    };
  }

  getFormatPatternPlaceholders(): FormatPatternPlaceholdersResponseDto {
    return {
      placeholders: [
        { value: '{PREFIX}', description: 'The prefix string (e.g., RCP, INV)' },
        { value: '{SEQ}', description: 'The padded sequence number' },
        { value: '{DATE}', description: 'The formatted date (if include_date is true)' },
        { value: '{REGISTER}', description: 'The register ID' },
        { value: '{SEP}', description: 'The separator character' }
      ]
    };
  }

  private toResponseDto(sequence: ReceiptSequence): ReceiptSequenceResponseDto {
    return {
      id: sequence.id,
      registerId: sequence.register_id,
      registerName: sequence.register_name,
      prefix: sequence.prefix,
      currentSequence: sequence.current_sequence,
      sequencePadding: sequence.sequence_padding,
      formatPattern: sequence.format_pattern,
      includeDate: sequence.include_date,
      dateFormat: sequence.date_format,
      separator: sequence.separator,
      isActive: sequence.is_active,
      lastGeneratedAt: sequence.last_generated_at,
      createdAt: sequence.created_at,
      updatedAt: sequence.updated_at
    };
  }

  private toLogResponseDto(log: any): ReceiptNumberLogResponseDto {
    return {
      id: log.id,
      sequenceId: log.sequence_id,
      receiptNumber: log.receipt_number,
      sequenceValue: log.sequence_value,
      generatedAt: log.generated_at,
      receiptId: log.receipt_id
    };
  }
}
