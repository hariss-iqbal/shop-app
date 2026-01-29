/**
 * Spam Prevention Service
 * Multi-layered spam prevention for the contact form
 * Owner Module: M-14 Security
 *
 * Layers:
 * 1. Honeypot field validation - rejects submissions with hidden field filled
 * 2. Server-side rate limiting - tracks submissions by IP
 * 3. Optional reCAPTCHA v3 token verification
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface SpamCheckRequest {
  honeypot?: string;
  recaptchaToken?: string;
  clientIp?: string;
}

interface SpamCheckResult {
  allowed: boolean;
  reason?: string;
  silent?: boolean;
}

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

export class SpamPreventionService {
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly maxSubmissions: number;
  private readonly windowMs: number;
  private readonly recaptchaSecretKey: string;
  private readonly recaptchaEnabled: boolean;
  private readonly recaptchaScoreThreshold: number;

  constructor(config?: {
    maxSubmissions?: number;
    windowMs?: number;
    recaptchaSecretKey?: string;
    recaptchaEnabled?: boolean;
    recaptchaScoreThreshold?: number;
  }) {
    this.maxSubmissions = config?.maxSubmissions ?? 3;
    this.windowMs = config?.windowMs ?? 5 * 60 * 1000;
    this.recaptchaSecretKey = config?.recaptchaSecretKey ?? '';
    this.recaptchaEnabled = config?.recaptchaEnabled ?? false;
    this.recaptchaScoreThreshold = config?.recaptchaScoreThreshold ?? 0.5;
  }

  async checkSpam(request: SpamCheckRequest): Promise<SpamCheckResult> {
    const honeypotResult = this.checkHoneypot(request.honeypot);
    if (!honeypotResult.allowed) {
      return honeypotResult;
    }

    if (request.clientIp) {
      const rateLimitResult = this.checkRateLimit(request.clientIp);
      if (!rateLimitResult.allowed) {
        return rateLimitResult;
      }
    }

    if (this.recaptchaEnabled && request.recaptchaToken) {
      const recaptchaResult = await this.verifyRecaptcha(request.recaptchaToken);
      if (!recaptchaResult.allowed) {
        return recaptchaResult;
      }
    }

    return { allowed: true };
  }

  checkHoneypot(honeypotValue?: string): SpamCheckResult {
    if (honeypotValue && honeypotValue.trim().length > 0) {
      return {
        allowed: false,
        reason: 'spam_detected',
        silent: true
      };
    }
    return { allowed: true };
  }

  checkRateLimit(clientIp: string): SpamCheckResult {
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientIp);

    if (!entry) {
      this.rateLimitMap.set(clientIp, { timestamps: [now] });
      return { allowed: true };
    }

    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < this.windowMs
    );

    if (entry.timestamps.length >= this.maxSubmissions) {
      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        silent: false
      };
    }

    entry.timestamps.push(now);
    return { allowed: true };
  }

  async verifyRecaptcha(token: string): Promise<SpamCheckResult> {
    if (!this.recaptchaSecretKey) {
      return { allowed: true };
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(this.recaptchaSecretKey)}&response=${encodeURIComponent(token)}`
      });

      const data: RecaptchaVerifyResponse = await response.json();

      if (!data.success) {
        return {
          allowed: false,
          reason: 'recaptcha_failed',
          silent: true
        };
      }

      if (data.score !== undefined && data.score < this.recaptchaScoreThreshold) {
        return {
          allowed: false,
          reason: 'recaptcha_low_score',
          silent: true
        };
      }

      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  recordSubmission(clientIp: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientIp);
    if (entry) {
      entry.timestamps.push(now);
    } else {
      this.rateLimitMap.set(clientIp, { timestamps: [now] });
    }
  }

  clearExpiredEntries(): void {
    const now = Date.now();
    for (const [ip, entry] of this.rateLimitMap.entries()) {
      entry.timestamps = entry.timestamps.filter(
        (ts) => now - ts < this.windowMs
      );
      if (entry.timestamps.length === 0) {
        this.rateLimitMap.delete(ip);
      }
    }
  }
}
