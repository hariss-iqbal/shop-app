import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

const SESSION_STORAGE_KEY = 'pv_session_id';

@Injectable({
  providedIn: 'root'
})
export class ProductViewTrackerService {
  private readonly trackedThisSession = new Set<string>();

  constructor(private supabase: SupabaseService) { }

  trackView(productId: string): void {
    if (!productId || this.trackedThisSession.has(productId)) {
      return;
    }
    this.trackedThisSession.add(productId);

    const sessionId = this.getOrCreateSessionId();
    if (!sessionId) {
      return;
    }

    // Fire and forget — tracking must never surface errors to the UI.
    this.supabase
      .from('product_views')
      .insert({ product_id: productId, session_id: sessionId })
      .then(({ error }) => {
        if (error) {
          this.trackedThisSession.delete(productId);
        }
      }, () => {
        this.trackedThisSession.delete(productId);
      });
  }

  private getOrCreateSessionId(): string | null {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(SESSION_STORAGE_KEY, id);
      }
      return id;
    } catch {
      return null;
    }
  }
}
