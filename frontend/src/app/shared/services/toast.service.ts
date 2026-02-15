import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastSeverity = 'success' | 'error' | 'warn' | 'info';

export interface ToastOptions {
  summary: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
  key?: string;
}

export const TOAST_DEFAULTS = {
  life: {
    success: 3000,
    error: 5000,
    warn: 4000,
    info: 3000
  },
  position: 'top-right',
  closable: true
} as const;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private messageService: MessageService) { }

  success(summary: string, detail?: string, life?: number): void {
    this.show('success', { summary, detail, life });
  }

  error(summary: string, detail?: string, life?: number): void {
    this.show('error', { summary, detail, life });
  }

  warn(summary: string, detail?: string, life?: number): void {
    this.show('warn', { summary, detail, life });
  }

  info(summary: string, detail?: string, life?: number): void {
    this.show('info', { summary, detail, life });
  }

  show(severity: ToastSeverity, options: ToastOptions): void {
    this.messageService.add({
      severity,
      summary: options.summary,
      detail: options.detail,
      life: options.sticky ? undefined : (options.life ?? TOAST_DEFAULTS.life[severity]),
      sticky: options.sticky ?? false,
      closable: options.closable ?? TOAST_DEFAULTS.closable,
      key: options.key
    });
  }

  clear(key?: string): void {
    this.messageService.clear(key);
  }
}
