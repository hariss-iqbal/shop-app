import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';

import { ContactMessageService } from '../../../../core/services/contact-message.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { MessageCountService } from '../../../../shared/services/message-count.service';
import { ContactMessage } from '../../../../models/contact-message.model';

@Component({
  selector: 'app-message-list',
  imports: [
    DatePipe,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    SkeletonModule
  ],
  templateUrl: './message-list.component.html'
})
export class MessageListComponent implements OnInit {
  private contactMessageService = inject(ContactMessageService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private messageCountService = inject(MessageCountService);

  messages = signal<ContactMessage[]>([]);
  loading = signal(false);
  unreadCount = signal(0);
  togglingId = signal<string | null>(null);
  expandedRows: Record<string, boolean> = {};
  readonly skeletonRows = Array(5).fill({});

  ngOnInit(): void {
    this.loadMessages();
  }

  async loadMessages(): Promise<void> {
    this.loading.set(true);

    try {
      const response = await this.contactMessageService.getMessages();
      this.messages.set(response.data);
      this.unreadCount.set(response.unreadCount);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load messages');
      console.error('Failed to load messages:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async onToggleReadStatus(message: ContactMessage): Promise<void> {
    this.togglingId.set(message.id);

    try {
      const newReadStatus = !message.isRead;
      await this.contactMessageService.toggleReadStatus(message.id, newReadStatus);

      this.messages.update(msgs =>
        msgs.map(m => m.id === message.id ? { ...m, isRead: newReadStatus } : m)
      );

      if (newReadStatus) {
        this.unreadCount.update(count => Math.max(0, count - 1));
      } else {
        this.unreadCount.update(count => count + 1);
      }

      this.messageCountService.loadUnreadCount();

      this.toastService.success(
        'Updated',
        `Message marked as ${newReadStatus ? 'read' : 'unread'}`
      );
    } catch (error) {
      this.toastService.error('Error', 'Failed to update message status');
      console.error('Failed to toggle read status:', error);
    } finally {
      this.togglingId.set(null);
    }
  }

  async onDelete(message: ContactMessage): Promise<void> {
    const itemDetails = `Message from ${message.name} (${message.email})`;
    const confirmed = await this.confirmDialogService.confirmDelete('message', itemDetails);

    if (confirmed) {
      try {
        await this.contactMessageService.deleteMessage(message.id);

        this.messages.update(msgs => msgs.filter(m => m.id !== message.id));

        if (!message.isRead) {
          this.unreadCount.update(count => Math.max(0, count - 1));
        }

        this.messageCountService.loadUnreadCount();

        this.toastService.success('Deleted', 'Message has been deleted');
      } catch (error) {
        this.toastService.error('Error', 'Failed to delete message');
        console.error('Failed to delete message:', error);
      }
    }
  }
}
