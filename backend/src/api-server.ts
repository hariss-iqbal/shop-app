/**
 * Simple Express API Server for Phone Specs Scraper
 *
 * This server provides a CORS-enabled proxy for the GSMArena scraper
 * so the frontend can fetch phone specifications without CORS errors.
 *
 * Usage:
 *   npm run api-server
 *   or: ts-node src/api-server.ts
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { PhoneSpecsScraperService } from './services/phone-specs-scraper.service';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Initialize scraper service
const scraperService = new PhoneSpecsScraperService();

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'phone-specs-api' });
});

/**
 * POST /api/phones/fetch-specs
 * Fetch phone specifications from GSMArena
 *
 * Request body:
 * {
 *   "brand": "Apple",
 *   "model": "iPhone 15 Pro"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "ram": [6, 8],
 *     "storage": [128, 256, 512],
 *     "colors": ["Black", "White", "Blue"]
 *   },
 *   "source": "gsmarena",
 *   "phoneUrl": "https://www.gsmarena.com/..."
 * }
 */
app.post('/api/phones/fetch-specs', async (req: Request, res: Response) => {
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
 * GET /api/phones/cache-stats
 * Get cache statistics
 */
app.get('/api/phones/cache-stats', (req: Request, res: Response) => {
  const stats = scraperService.getCacheStats();
  res.json({
    success: true,
    data: stats
  });
});

/**
 * POST /api/phones/clear-cache
 * Clear the cache
 */
app.post('/api/phones/clear-cache', (req: Request, res: Response) => {
  scraperService.clearCache();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

// Start server on all network interfaces (0.0.0.0) for mobile access
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║       Phone Specs API Server - Running                  ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server listening on all interfaces (0.0.0.0:${PORT})
📡 Local:   http://localhost:${PORT}
📱 Network: http://192.168.100.111:${PORT}

API Endpoint: POST /api/phones/fetch-specs
Health Check: GET /health

Example curl command:
curl -X POST http://192.168.100.111:${PORT}/api/phones/fetch-specs \\
  -H "Content-Type: application/json" \\
  -d '{"brand": "Apple", "model": "iPhone 15 Pro"}'
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
