import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { MultiSelectModule } from 'primeng/multiselect';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ChipModule } from 'primeng/chip';

import { AuditLogService } from '../../../core/services/audit-log.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  AuditLog,
  AuditLogFilter,
  AuditLogSummary,
  AuditEventType,
  EVENT_TYPE_GROUPS,
  getEventTypeLabel,
  getEventTypeSeverity,
  getEventTypeIcon
} from '../../../models/audit-log.model';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-audit-log-list',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    DatePickerModule,
    SkeletonModule,
    SelectModule,
    InputTextModule,
    DialogModule,
    DividerModule,
    MultiSelectModule,
    IconFieldModule,
    InputIconModule,
    ChipModule,
    DatePipe,
    JsonPipe,
    AppCurrencyPipe
  ],
  templateUrl: './audit-log-list.component.html'
})
export class AuditLogListComponent implements OnInit {
  constructor(
    private auditLogService: AuditLogService,
    private toastService: ToastService
  ) { }

  auditLogs = signal<AuditLog[]>([]);
  summary = signal<AuditLogSummary | null>(null);
  loading = signal(false);
  readonly skeletonRows = Array(10).fill({});

  startDate: Date | null = null;
  endDate: Date | null = null;
  searchText = '';
  selectedEventTypes: AuditEventType[] = [];

  showDetailDialog = signal(false);
  selectedLog = signal<AuditLog | null>(null);

  eventTypeGroups = EVENT_TYPE_GROUPS;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  eventTypeOptions = computed(() => this.auditLogService.getEventTypes());

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      const filter = this.buildFilter();
      const [logsResponse, summaryResponse] = await Promise.all([
        this.auditLogService.getAuditLogs(filter, { page: 1, limit: 1000 }),
        this.auditLogService.getSummary(filter)
      ]);
      this.auditLogs.set(logsResponse.data);
      this.summary.set(summaryResponse);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load audit logs');
      console.error('Failed to load audit logs:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange(): void {
    this.loadData();
  }

  onSearchDebounce(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadData();
    }, 300);
  }

  hasActiveFilters(): boolean {
    return this.startDate !== null ||
      this.endDate !== null ||
      this.searchText.trim() !== '' ||
      this.selectedEventTypes.length > 0;
  }

  clearFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.searchText = '';
    this.selectedEventTypes = [];
    this.loadData();
  }

  isGroupSelected(category: string): boolean {
    const group = this.eventTypeGroups.find(g => g.category === category);
    if (!group) return false;
    return group.eventTypes.every(et => this.selectedEventTypes.includes(et));
  }

  toggleGroup(category: string): void {
    const group = this.eventTypeGroups.find(g => g.category === category);
    if (!group) return;

    if (this.isGroupSelected(category)) {
      this.selectedEventTypes = this.selectedEventTypes.filter(
        et => !group.eventTypes.includes(et)
      );
    } else {
      const newTypes = group.eventTypes.filter(
        et => !this.selectedEventTypes.includes(et)
      );
      this.selectedEventTypes = [...this.selectedEventTypes, ...newTypes];
    }
    this.loadData();
  }

  onViewDetails(log: AuditLog): void {
    this.selectedLog.set(log);
    this.showDetailDialog.set(true);
  }

  async onExportCsv(): Promise<void> {
    try {
      await this.auditLogService.downloadCsv(this.buildFilter());
      this.toastService.success('Export Complete', 'Audit logs exported to CSV');
    } catch (error) {
      this.toastService.error('Export Failed', 'Failed to export audit logs');
    }
  }

  getEventLabel(eventType: AuditEventType): string {
    return getEventTypeLabel(eventType);
  }

  getEventSeverity(eventType: AuditEventType): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return getEventTypeSeverity(eventType);
  }

  getEventIcon(eventType: AuditEventType): string {
    return getEventTypeIcon(eventType);
  }

  truncateDescription(description: string | undefined): string {
    if (!description) return '';
    return description.length > 60 ? description.slice(0, 60) + '...' : description;
  }

  getSalesEventCount(): number {
    const summary = this.summary();
    if (!summary?.eventsByType) return 0;
    return (summary.eventsByType['sale_created'] || 0) +
      (summary.eventsByType['sale_updated'] || 0) +
      (summary.eventsByType['sale_deleted'] || 0) +
      (summary.eventsByType['batch_sale_completed'] || 0);
  }

  getRefundEventCount(): number {
    const summary = this.summary();
    if (!summary?.eventsByType) return 0;
    return (summary.eventsByType['refund_initiated'] || 0) +
      (summary.eventsByType['refund_completed'] || 0) +
      (summary.eventsByType['refund_cancelled'] || 0) +
      (summary.eventsByType['partial_refund_completed'] || 0);
  }

  getPermissionEventCount(): number {
    const summary = this.summary();
    if (!summary?.eventsByType) return 0;
    return (summary.eventsByType['user_role_assigned'] || 0) +
      (summary.eventsByType['user_role_changed'] || 0) +
      (summary.eventsByType['user_role_revoked'] || 0);
  }

  getInventoryEventCount(): number {
    const summary = this.summary();
    if (!summary?.eventsByType) return 0;
    return (summary.eventsByType['inventory_deducted'] || 0) +
      (summary.eventsByType['inventory_restored'] || 0) +
      (summary.eventsByType['product_status_changed'] || 0) +
      (summary.eventsByType['product_created'] || 0) +
      (summary.eventsByType['product_updated'] || 0) +
      (summary.eventsByType['product_deleted'] || 0);
  }

  getAuthEventCount(): number {
    const summary = this.summary();
    if (!summary?.eventsByType) return 0;
    return (summary.eventsByType['user_logged_in'] || 0) +
      (summary.eventsByType['user_logged_out'] || 0);
  }

  getSystemEventCount(): number {
    const summary = this.summary();
    if (!summary?.eventsByType) return 0;
    return (summary.eventsByType['settings_changed'] || 0) +
      (summary.eventsByType['stock_alert_triggered'] || 0) +
      (summary.eventsByType['system_config_changed'] || 0) +
      (summary.eventsByType['receipt_created'] || 0) +
      (summary.eventsByType['receipt_sent'] || 0) +
      (summary.eventsByType['receipt_resent'] || 0);
  }

  private buildFilter(): AuditLogFilter {
    const filter: AuditLogFilter = {};

    if (this.startDate) {
      filter.startDate = this.formatDate(this.startDate);
    }

    if (this.endDate) {
      filter.endDate = this.formatDate(this.endDate);
    }

    if (this.searchText.trim()) {
      filter.searchText = this.searchText.trim();
    }

    if (this.selectedEventTypes.length > 0) {
      filter.eventTypes = this.selectedEventTypes;
    }

    return filter;
  }

  private formatDate(date: Date): string {
    return date.toISOString();
  }
}
