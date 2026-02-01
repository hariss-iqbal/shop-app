import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TabsModule } from 'primeng/tabs';
import { ReceiptSequenceService } from '../../../core/services/receipt-sequence.service';
import { StoreLocationService } from '../../../core/services/store-location.service';
import { ToastService } from '../../../shared';
import {
  ReceiptSequence,
  CreateReceiptSequenceRequest,
  UpdateReceiptSequenceRequest,
  ReceiptNumberLog,
  DATE_FORMAT_OPTIONS,
  FORMAT_PATTERN_PLACEHOLDERS,
  FORMAT_PATTERN_TEMPLATES,
  RECEIPT_SEQUENCE_CONSTRAINTS
} from '../../../models/receipt-sequence.model';
import { StoreLocation } from '../../../models/store-location.model';

@Component({
  selector: 'app-receipt-sequence-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    DialogModule,
    TooltipModule,
    TagModule,
    CardModule,
    DividerModule,
    ConfirmDialogModule,
    PaginatorModule,
    TabsModule
  ],
  providers: [ConfirmationService],
  templateUrl: './receipt-sequence-config.component.html',
  styleUrls: ['./receipt-sequence-config.component.scss']
})
export class ReceiptSequenceConfigComponent implements OnInit {
  private readonly receiptSequenceService = inject(ReceiptSequenceService);
  private readonly storeLocationService = inject(StoreLocationService);
  private readonly toastService = inject(ToastService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  sequences = signal<ReceiptSequence[]>([]);
  storeLocations = signal<StoreLocation[]>([]);
  loading = signal(false);
  saving = signal(false);
  generating = signal(false);
  dialogVisible = false;
  resetDialogVisible = false;
  locationSelectDialogVisible = false;
  editingSequence = signal<ReceiptSequence | null>(null);
  resettingSequence = signal<ReceiptSequence | null>(null);
  newStartingValue = 1;
  selectedPreviewRegisterId = '';
  previewNumber = signal<string | null>(null);
  nextSequence = signal<number | null>(null);
  selectedLocationForRegister: StoreLocation | null = null;

  // Logs state
  logs = signal<ReceiptNumberLog[]>([]);
  logsLoading = signal(false);
  logsTotal = signal(0);
  logsPage = signal(1);
  logsPageSize = 20;
  logsFilter: { sequenceId?: string; receiptNumber?: string } = {};

  dateFormatOptions = DATE_FORMAT_OPTIONS;
  formatPatternPlaceholders = FORMAT_PATTERN_PLACEHOLDERS;
  formatPatternTemplates = FORMAT_PATTERN_TEMPLATES;
  constraints = RECEIPT_SEQUENCE_CONSTRAINTS;

  sequenceForm: FormGroup = this.fb.group({
    registerId: ['', [Validators.required, Validators.maxLength(this.constraints.REGISTER_ID_MAX)]],
    registerName: ['', [Validators.required, Validators.maxLength(this.constraints.REGISTER_NAME_MAX)]],
    prefix: ['RCP', [Validators.maxLength(this.constraints.PREFIX_MAX)]],
    separator: ['-', [Validators.maxLength(this.constraints.SEPARATOR_MAX)]],
    sequencePadding: [4, [Validators.min(this.constraints.SEQUENCE_PADDING_MIN), Validators.max(this.constraints.SEQUENCE_PADDING_MAX)]],
    startingSequence: [1000, [Validators.min(1)]],
    formatPattern: ['{PREFIX}{SEP}{DATE}{SEP}{SEQ}', [Validators.maxLength(this.constraints.FORMAT_PATTERN_MAX)]],
    includeDate: [true],
    dateFormat: ['YY-MM'],
    isActive: [true]
  });

  activeSequences = computed(() => this.sequences().filter(s => s.isActive));

  sequenceOptionsForLogs = computed(() => [
    { id: '', registerName: 'All Registers' },
    ...this.sequences()
  ]);

  availableLocationsForRegister = computed(() => {
    const existingRegisterIds = this.sequences().map(s => s.registerId);
    return this.storeLocations().filter(loc => !existingRegisterIds.includes(loc.code));
  });

  formPreview = computed(() => {
    const values = this.sequenceForm.value;
    return this.buildPreview(
      values.prefix,
      values.separator,
      values.sequencePadding,
      values.formatPattern,
      values.includeDate,
      values.dateFormat,
      values.startingSequence || 1
    );
  });

  ngOnInit(): void {
    this.loadSequences();
    this.loadStoreLocations();
  }

  async loadSequences(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.receiptSequenceService.findAll();
      this.sequences.set(response.data);

      if (response.data.length > 0 && !this.selectedPreviewRegisterId) {
        const activeSeq = response.data.find(s => s.isActive);
        if (activeSeq) {
          this.selectedPreviewRegisterId = activeSeq.registerId;
          await this.loadPreview();
        }
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to load sequences');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadStoreLocations(): Promise<void> {
    try {
      const locations = await this.storeLocationService.getActiveLocations();
      this.storeLocations.set(locations);
    } catch (error) {
      console.error('Failed to load store locations:', error);
    }
  }

  async loadPreview(): Promise<void> {
    if (!this.selectedPreviewRegisterId) {
      this.previewNumber.set(null);
      this.nextSequence.set(null);
      return;
    }

    try {
      const response = await this.receiptSequenceService.previewNextReceiptNumber(this.selectedPreviewRegisterId);
      if (response.success) {
        this.previewNumber.set(response.previewNumber);
        this.nextSequence.set(response.nextSequence);
      } else {
        this.previewNumber.set(null);
        this.nextSequence.set(null);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async loadLogs(): Promise<void> {
    this.logsLoading.set(true);
    try {
      const response = await this.receiptSequenceService.getLogs({
        sequenceId: this.logsFilter.sequenceId || undefined,
        receiptNumber: this.logsFilter.receiptNumber || undefined,
        page: this.logsPage(),
        limit: this.logsPageSize
      });
      this.logs.set(response.data);
      this.logsTotal.set(response.total);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load generation logs');
      console.error(error);
    } finally {
      this.logsLoading.set(false);
    }
  }

  clearLogsFilter(): void {
    this.logsFilter = {};
    this.logsPage.set(1);
    this.loadLogs();
  }

  onLogsPageChange(event: PaginatorState): void {
    this.logsPage.set((event.page ?? 0) + 1);
    this.loadLogs();
  }

  viewLogsForSequence(seq: ReceiptSequence): void {
    this.logsFilter = { sequenceId: seq.id };
    this.logsPage.set(1);
    this.loadLogs();
  }

  getSequenceNameById(id: string): string {
    const seq = this.sequences().find(s => s.id === id);
    return seq ? `${seq.registerName} (${seq.registerId})` : 'Unknown';
  }

  async generateReceiptNumber(): Promise<void> {
    if (!this.selectedPreviewRegisterId) return;

    this.generating.set(true);
    try {
      const response = await this.receiptSequenceService.generateNextReceiptNumber(this.selectedPreviewRegisterId);
      if (response.success) {
        this.toastService.success('Generated', `Receipt number: ${response.receiptNumber}`);
        await this.loadSequences();
        await this.loadPreview();
      } else {
        this.toastService.error('Error', response.error || 'Failed to generate receipt number');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to generate receipt number');
      console.error(error);
    } finally {
      this.generating.set(false);
    }
  }

  openCreateDialog(): void {
    this.editingSequence.set(null);
    this.sequenceForm.reset({
      registerId: '',
      registerName: '',
      prefix: 'RCP',
      separator: '-',
      sequencePadding: 4,
      startingSequence: 1000,
      formatPattern: '{PREFIX}{SEP}{DATE}{SEP}{SEQ}',
      includeDate: true,
      dateFormat: 'YY-MM',
      isActive: true
    });
    this.sequenceForm.get('registerId')?.enable();
    this.dialogVisible = true;
  }

  openEditDialog(sequence: ReceiptSequence): void {
    this.editingSequence.set(sequence);
    this.sequenceForm.patchValue({
      registerId: sequence.registerId,
      registerName: sequence.registerName,
      prefix: sequence.prefix,
      separator: sequence.separator,
      sequencePadding: sequence.sequencePadding,
      formatPattern: sequence.formatPattern,
      includeDate: sequence.includeDate,
      dateFormat: sequence.dateFormat,
      isActive: sequence.isActive
    });
    this.sequenceForm.get('registerId')?.disable();
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.editingSequence.set(null);
  }

  openLocationSelectDialog(): void {
    this.selectedLocationForRegister = null;
    this.locationSelectDialogVisible = true;
  }

  closeLocationSelectDialog(): void {
    this.locationSelectDialogVisible = false;
    this.selectedLocationForRegister = null;
  }

  async createFromLocation(): Promise<void> {
    if (!this.selectedLocationForRegister) return;

    const location = this.selectedLocationForRegister;
    this.closeLocationSelectDialog();

    // Pre-fill the create dialog with location data
    this.editingSequence.set(null);
    this.sequenceForm.reset({
      registerId: location.code,
      registerName: location.name,
      prefix: 'RCP',
      separator: '-',
      sequencePadding: 4,
      startingSequence: 1000,
      formatPattern: '{PREFIX}{SEP}{DATE}{SEP}{REGISTER}{SEP}{SEQ}',
      includeDate: true,
      dateFormat: 'YY-MM',
      isActive: true
    });
    this.sequenceForm.get('registerId')?.enable();
    this.dialogVisible = true;
  }

  async saveSequence(): Promise<void> {
    if (this.sequenceForm.invalid) return;

    this.saving.set(true);
    try {
      const values = this.sequenceForm.getRawValue();

      if (this.editingSequence()) {
        const request: UpdateReceiptSequenceRequest = {
          registerName: values.registerName,
          prefix: values.prefix,
          sequencePadding: values.sequencePadding,
          formatPattern: values.formatPattern,
          includeDate: values.includeDate,
          dateFormat: values.dateFormat,
          separator: values.separator,
          isActive: values.isActive
        };
        await this.receiptSequenceService.update(this.editingSequence()!.id, request);
        this.toastService.success('Updated', 'Register updated successfully');
      } else {
        const request: CreateReceiptSequenceRequest = {
          registerId: values.registerId,
          registerName: values.registerName,
          prefix: values.prefix,
          startingSequence: values.startingSequence,
          sequencePadding: values.sequencePadding,
          formatPattern: values.formatPattern,
          includeDate: values.includeDate,
          dateFormat: values.dateFormat,
          separator: values.separator,
          isActive: values.isActive
        };
        await this.receiptSequenceService.create(request);
        this.toastService.success('Created', 'Register created successfully');
      }

      this.closeDialog();
      await this.loadSequences();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save register';
      this.toastService.error('Error', message);
      console.error(error);
    } finally {
      this.saving.set(false);
    }
  }

  openResetDialog(sequence: ReceiptSequence): void {
    this.resettingSequence.set(sequence);
    this.newStartingValue = sequence.currentSequence + 1;
    this.resetDialogVisible = true;
  }

  closeResetDialog(): void {
    this.resetDialogVisible = false;
    this.resettingSequence.set(null);
  }

  async resetSequence(): Promise<void> {
    if (!this.resettingSequence() || !this.newStartingValue) return;

    this.saving.set(true);
    try {
      await this.receiptSequenceService.resetSequence(this.resettingSequence()!.id, {
        newStartingValue: this.newStartingValue
      });
      this.toastService.success('Reset', 'Sequence reset successfully');
      this.closeResetDialog();
      await this.loadSequences();
      await this.loadPreview();
    } catch (error) {
      this.toastService.error('Error', 'Failed to reset sequence');
      console.error(error);
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(sequence: ReceiptSequence): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the register "${sequence.registerName}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteSequence(sequence)
    });
  }

  async deleteSequence(sequence: ReceiptSequence): Promise<void> {
    try {
      await this.receiptSequenceService.delete(sequence.id);
      this.toastService.success('Deleted', 'Register deleted successfully');
      await this.loadSequences();
    } catch (error) {
      this.toastService.error('Error', 'Failed to delete register');
      console.error(error);
    }
  }

  applyTemplate(template: { name: string; pattern: string; example: string }): void {
    if (template) {
      this.sequenceForm.patchValue({ formatPattern: template.pattern });
    }
  }

  getFormatPreview(sequence: ReceiptSequence): string {
    return this.buildPreview(
      sequence.prefix,
      sequence.separator,
      sequence.sequencePadding,
      sequence.formatPattern,
      sequence.includeDate,
      sequence.dateFormat,
      sequence.currentSequence + 1
    );
  }

  private buildPreview(
    prefix: string,
    separator: string,
    padding: number,
    pattern: string,
    includeDate: boolean,
    dateFormat: string,
    sequence: number
  ): string {
    const now = new Date();
    let dateStr = '';

    if (includeDate) {
      const yy = now.getFullYear().toString().slice(-2);
      const yyyy = now.getFullYear().toString();
      const mm = (now.getMonth() + 1).toString().padStart(2, '0');
      const dd = now.getDate().toString().padStart(2, '0');

      switch (dateFormat) {
        case 'YY-MM':
          dateStr = `${yy}-${mm}`;
          break;
        case 'YYYY-MM':
          dateStr = `${yyyy}-${mm}`;
          break;
        case 'YY-MM-DD':
          dateStr = `${yy}-${mm}-${dd}`;
          break;
        case 'YYYYMMDD':
          dateStr = `${yyyy}${mm}${dd}`;
          break;
        case 'YYMM':
          dateStr = `${yy}${mm}`;
          break;
        case 'MMYY':
          dateStr = `${mm}${yy}`;
          break;
        default:
          dateStr = `${yy}-${mm}`;
      }
    }

    const paddedSeq = sequence.toString().padStart(padding, '0');

    let result = pattern;
    result = result.replace(/{PREFIX}/g, prefix);
    result = result.replace(/{SEQ}/g, paddedSeq);
    result = result.replace(/{DATE}/g, dateStr);
    result = result.replace(/{REGISTER}/g, 'REG');
    result = result.replace(/{SEP}/g, separator);

    // Clean up double separators
    const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`${escapedSep}+`, 'g'), separator);
    result = result.replace(new RegExp(`^${escapedSep}|${escapedSep}$`, 'g'), '');

    return result;
  }
}
