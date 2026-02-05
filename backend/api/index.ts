/**
 * Vercel Serverless Function for Phone Specs API
 *
 * This wraps the Express app for deployment on Vercel's serverless platform.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { PhoneSpecsScraperService } from '../src/services/phone-specs-scraper.service';

const app = express();

// Middleware
app.use(cors());
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
 * GET /api/health (alternative path)
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'phone-specs-api' });
});

/**
 * POST /api/phones/fetch-specs
 * Fetch phone specifications from GSMArena
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
 */
app.post('/api/phones/clear-cache', (req: Request, res: Response) => {
  scraperService.clearCache();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

// Export the Express app as a Vercel serverless function
export default app;
