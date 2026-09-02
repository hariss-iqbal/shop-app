/**
 * WhatsApp Cloud API client
 *
 * Thin wrapper over Meta's Graph API for:
 *  - verifying inbound webhook signatures (X-Hub-Signature-256)
 *  - sending text / image replies
 *
 * No secrets are hard-coded — everything comes from env vars that YOU set in
 * Vercel. See ./README.md for the full list.
 */

import axios from 'axios';
import crypto from 'crypto';

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';

export interface CloudApiConfig {
  accessToken: string;     // WHATSAPP_ACCESS_TOKEN (permanent system-user token)
  phoneNumberId: string;   // WHATSAPP_PHONE_NUMBER_ID
  appSecret: string;       // WHATSAPP_APP_SECRET (for signature verification)
}

export class WhatsAppCloudApiClient {
  constructor(private readonly config: CloudApiConfig) {}

  /**
   * Build a client from environment variables. Returns null if required vars
   * are missing, so callers can degrade gracefully (e.g. log-only mode) instead
   * of crashing the function on a cold start with no credentials yet.
   */
  static fromEnv(): WhatsAppCloudApiClient | null {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!accessToken || !phoneNumberId || !appSecret) {
      return null;
    }
    return new WhatsAppCloudApiClient({ accessToken, phoneNumberId, appSecret });
  }

  /**
   * Verify the X-Hub-Signature-256 header against the raw request body.
   * Meta signs the body with HMAC-SHA256 using the app secret.
   * @param rawBody  The exact raw bytes Express received (see api/index.ts setup).
   * @param signatureHeader  Value of the 'x-hub-signature-256' header (e.g. "sha256=...").
   */
  verifySignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
    if (!signatureHeader) return false;
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', this.config.appSecret).update(rawBody).digest('hex');
    // Constant-time compare to avoid timing leaks.
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  private get baseUrl(): string {
    return `https://graph.facebook.com/${GRAPH_VERSION}/${this.config.phoneNumberId}/messages`;
  }

  private get authHeaders() {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /** Send a plain text reply to a recipient (international format, no '+'). */
  async sendText(to: string, body: string): Promise<void> {
    await axios.post(
      this.baseUrl,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body },
      },
      { headers: this.authHeaders },
    );
  }

  /** Send an image (by public URL) with an optional caption. */
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<void> {
    await axios.post(
      this.baseUrl,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: { link: imageUrl, caption },
      },
      { headers: this.authHeaders },
    );
  }
}
