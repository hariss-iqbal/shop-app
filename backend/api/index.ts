/**
 * Vercel Serverless Function for Phone Specs API
 *
 * This wraps the Express app for deployment on Vercel's serverless platform.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { PhoneSpecsScraperService } from '../src/services/phone-specs-scraper.service';
import { WhatsAppBotService } from '../src/services/whatsapp/whatsapp-bot.service';
import { WhatsAppCloudApiClient } from '../src/services/whatsapp/cloud-api.client';
import { InboundMessage } from '../src/services/whatsapp/types';

const app = express();

// Middleware
app.use(cors());
// Capture the raw body so we can verify Meta's X-Hub-Signature-256 on webhooks.
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// Initialize services
const scraperService = new PhoneSpecsScraperService();

// Lazily construct the WhatsApp bot on first webhook hit, so a missing env var
// can never crash the whole API at import time.
let _whatsappBot: WhatsAppBotService | null = null;
function getWhatsappBot(): WhatsAppBotService {
  if (!_whatsappBot) _whatsappBot = new WhatsAppBotService();
  return _whatsappBot;
}

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'phone-specs-api' });
});

/**
 * GET /api/health (alternative path)
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'phone-specs-api' });
});

/**
 * POST /api/products/fetch-specs
 * Fetch product specifications from GSMArena
 */
app.post('/api/products/fetch-specs', async (req: Request, res: Response) => {
  try {
    const { brand, model } = req.body;

    // Validation
    if (!brand || typeof brand !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Brand is required and must be a string'
      });
    }

    if (!model || typeof model !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Model is required and must be a string'
      });
    }

    // Fetch specs
    const result = await scraperService.fetchSpecs(brand.trim(), model.trim());

    // Return result
    res.json(result);
  } catch (error) {
    console.error('[API] Error fetching phone specs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/products/search-models
 * Search GSMArena for phone models matching a query
 */
app.post('/api/products/search-models', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be at least 2 characters'
      });
    }

    const results = await scraperService.searchModels(query.trim());

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('[API] Error searching models:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/products/cache-stats
 */
app.get('/api/products/cache-stats', (req: Request, res: Response) => {
  const stats = scraperService.getCacheStats();
  res.json({
    success: true,
    data: stats
  });
});

/**
 * POST /api/products/clear-cache
 */
app.post('/api/products/clear-cache', (req: Request, res: Response) => {
  scraperService.clearCache();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

/**
 * GET /api/whatsapp/webhook
 * Meta webhook verification handshake. Meta calls this once with hub.challenge
 * when you register the webhook URL. We echo the challenge if the verify token
 * matches WHATSAPP_VERIFY_TOKEN.
 */
app.get('/api/whatsapp/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * POST /api/whatsapp/webhook
 * Receives inbound WhatsApp messages. We verify the signature, ACK fast (Meta
 * retries on non-200), then process messages. Replies are sent asynchronously.
 */
app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
  // Verify Meta's signature when credentials are configured.
  const client = WhatsAppCloudApiClient.fromEnv();
  if (client) {
    const raw = (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body));
    const ok = client.verifySignature(raw, req.header('x-hub-signature-256'));
    if (!ok) {
      console.warn('[whatsapp] invalid webhook signature');
      return res.sendStatus(401);
    }
  }

  // Process BEFORE responding. On serverless (Vercel), async work left running
  // after res.send() can be frozen until the next invocation — that is what
  // made replies arrive batched/delayed. Our handling is fast (one Supabase
  // read + one Cloud API send), comfortably within Meta's ~5s ACK window.
  try {
    const entries = req.body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const contacts = value.contacts ?? [];
        const profileName = contacts[0]?.profile?.name as string | undefined;
        for (const m of value.messages ?? []) {
          if (m.type !== 'text') continue; // first version handles text only
          const msg: InboundMessage = {
            from: m.from,
            messageId: m.id,
            text: m.text?.body ?? '',
            profileName,
            timestamp: m.timestamp,
          };
          await getWhatsappBot().handleMessage(msg);
        }
      }
    }
  } catch (err) {
    console.error('[whatsapp] webhook processing error:', err);
  }

  // ACK after processing so the reply is guaranteed to be sent this invocation.
  res.sendStatus(200);
});

// Export the Express app as a Vercel serverless function
export default app;
