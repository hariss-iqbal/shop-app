import { Injectable } from '@angular/core';

/**
 * Spam Prevention Service
 * Client-side rate limiting for contact form submissions
 * Owner Module: M-14 Security
 *
 * Implements:
 * - Client-side rate limiting (max 3 submissions per 5 minutes)
 * - Honeypot field validation
 * - Submission tracking via localStorage for persistence across page navigations
 */

const RATE_LIMIT_STORAGE_KEY = 'contact_form_submissions';
const MAX_SUBMISSIONS = 3;
const WINDOW_MS = 5 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class SpamPreventionService {

  isRateLimited(): boolean {
    const timestamps = this.getSubmissionTimestamps();
    const now = Date.now();
    const recentTimestamps = timestamps.filter(ts => now - ts < WINDOW_MS);
    return recentTimestamps.length >= MAX_SUBMISSIONS;
  }

  recordSubmission(): void {
    const timestamps = this.getSubmissionTimestamps();
    const now = Date.now();
    const recentTimestamps = timestamps.filter(ts => now - ts < WINDOW_MS);
    recentTimestamps.push(now);

    try {
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(recentTimestamps));
    } catch {
      // localStorage not available; rate limiting will be session-only
    }
  }

  isHoneypotFilled(value: string | null | undefined): boolean {
    return !!value && value.trim().length > 0;
  }

  getRemainingWaitSeconds(): number {
    const timestamps = this.getSubmissionTimestamps();
    const now = Date.now();
    const recentTimestamps = timestamps.filter(ts => now - ts < WINDOW_MS);

    if (recentTimestamps.length < MAX_SUBMISSIONS) {
      return 0;
    }

    const oldestRelevant = Math.min(...recentTimestamps);
    const expiresAt = oldestRelevant + WINDOW_MS;
    return Math.max(0, Math.ceil((expiresAt - now) / 1000));
  }

  private getSubmissionTimestamps(): number[] {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const timestamps = JSON.parse(stored);
      if (!Array.isArray(timestamps)) {
        return [];
      }
      const now = Date.now();
      return timestamps.filter(
        (ts: unknown): ts is number => typeof ts === 'number' && now - ts < WINDOW_MS
      );
    } catch {
      return [];
    }
  }
}
