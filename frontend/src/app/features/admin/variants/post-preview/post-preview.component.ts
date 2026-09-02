import { Component, computed, input, model, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';

import {
  FbPostTemplateService,
  PostTemplateContext,
  DEFAULT_POST_TEMPLATE,
} from '../../../../core/services/fb-post-template.service';
import { ToastService } from '../../../../shared/services/toast.service';

/**
 * Preview dialog for a Facebook post built from a variant.
 *
 * Shows the caption rendered from the template plus the variant's existing
 * catalogue image. The caption is editable before copying — the template can't
 * fill RAM (no column backs it), so it's typed here when needed.
 */
@Component({
  selector: 'app-post-preview',
  imports: [FormsModule, DialogModule, ButtonModule, TextareaModule, TooltipModule, MessageModule],
  templateUrl: './post-preview.component.html',
})
export class PostPreviewComponent {
  constructor(
    private templateService: FbPostTemplateService,
    private toastService: ToastService
  ) {
    // Re-render whenever a different variant is opened. Edits to `caption` are
    // intentionally discarded on reopen — the template is the source of truth.
    effect(() => {
      const ctx = this.context();
      if (ctx) this.caption.set(this.templateService.render(DEFAULT_POST_TEMPLATE, ctx));
    });
  }

  /** Null when no variant is selected; the dialog is hidden in that case. */
  readonly context = input<PostTemplateContext | null>(null);
  readonly imageUrl = input<string | null>(null);
  readonly visible = model(false);
  readonly closed = output<void>();

  readonly caption = signal('');
  readonly copied = signal(false);

  readonly placeholders = this.templateService.placeholders;
  readonly unavailablePlaceholders = computed(() =>
    this.placeholders.filter(p => !p.available)
  );

  onHide(): void {
    this.copied.set(false);
    this.closed.emit();
  }

  async copyCaption(): Promise<void> {
    const text = this.caption();
    if (!text.trim()) {
      this.toastService.warn('Nothing to copy', 'The caption is empty');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(true);
      this.toastService.success('Copied', 'Caption copied — paste it into Facebook');
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard API needs a secure context and permission; it can fail on
      // plain http:// origins. Tell the user rather than failing silently.
      this.toastService.error('Copy failed', 'Select the text and copy it manually');
    }
  }

  openImage(): void {
    const url = this.imageUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }
}
