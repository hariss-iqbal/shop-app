import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class MessageCountService implements OnDestroy {
  private supabaseService = inject(SupabaseService);
  private authService = inject(SupabaseAuthService);
  private realtimeChannel: RealtimeChannel | null = null;
  private authUnsubscribe: (() => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isSubscribed = false;

  private readonly _unreadCount = signal<number>(0);
  private readonly _loading = signal<boolean>(false);

  readonly unreadCount = this._unreadCount.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadUnreadCount(): Promise<void> {
    this._loading.set(true);
    try {
      const { count, error } = await this.supabaseService
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      this._unreadCount.set(count || 0);
    } catch {
      this._unreadCount.set(0);
    } finally {
      this._loading.set(false);
    }
  }

  initAuthAwareSubscription(): void {
    if (this.authUnsubscribe) {
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.loadUnreadCount();
      this.subscribeToChanges();
    }

    const { data } = this.supabaseService.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.loadUnreadCount();
        this.subscribeToChanges();
      } else if (event === 'SIGNED_OUT') {
        this.unsubscribeFromChanges();
        this._unreadCount.set(0);
      }
    });

    this.authUnsubscribe = () => data.subscription.unsubscribe();
  }

  destroyAuthAwareSubscription(): void {
    this.authUnsubscribe?.();
    this.authUnsubscribe = null;
    this.unsubscribeFromChanges();
  }

  subscribeToChanges(): void {
    if (this.isSubscribed) {
      return;
    }

    this.isSubscribed = true;
    this.createChannel();
  }

  unsubscribeFromChanges(): void {
    this.isSubscribed = false;
    this.clearReconnectTimer();
    this.removeChannel();
  }

  ngOnDestroy(): void {
    this.destroyAuthAwareSubscription();
  }

  private createChannel(): void {
    this.removeChannel();

    this.realtimeChannel = this.supabaseService
      .channel('contact_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages'
        },
        () => {
          this.loadUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_messages'
        },
        () => {
          this.loadUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'contact_messages'
        },
        () => {
          this.loadUnreadCount();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.handleReconnection();
        }
      });
  }

  private removeChannel(): void {
    if (this.realtimeChannel) {
      this.supabaseService.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  private handleReconnection(): void {
    if (!this.isSubscribed) {
      return;
    }

    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      if (this.isSubscribed) {
        this.createChannel();
      }
    }, 3000);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
