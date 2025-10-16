// backend/routes/asin.js
const express = require('express');
const router = express.Router();
const z = require('zod');
const { ListingRun } = require('../config/db');
const { scrapeProduct } = require('../services/scraper');
const { optimizeListing } = require('../services/ai');
const { summarizeImprovement } = require('../utils/diff');

const asinSchema = z.object({
  asin: z.string().trim().regex(/^[A-Z0-9]{8,12}$/i, 'Invalid ASIN'),
});

router.post('/optimize', async (req, res) => {
  const parsed = asinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ code: 'INVALID_ASIN', error: parsed.error.errors[0].message });
  }
  const { asin } = parsed.data;

  try {
    const scraped = await scrapeProduct(asin);
    if (!scraped?.title || !scraped?.bullets?.length) {
      return res.status(422).json({ code: 'SCRAPE_FAIL', error: 'Could not fetch product details' });
    }

    const original = { title: scraped.title, bullets: scraped.bullets, description: scraped.description };
    const { optimized, model, promptHash, durationMs } = await optimizeListing({
      asin,
      ...original,
    });

    const summary = summarizeImprovement(original, optimized);

    const row = await ListingRun.create({
      asin,
      original,
      optimized,
      model,
      promptHash,
      durationMs,
      source: scraped.source || null,
      mock: !!scraped.mock,
      summary,
    });

    res.json({
      id: row.id,
      asin,
      original,
      optimized,
      model,
      durationMs,
      source: row.source,
      mock: row.mock,
      summary,
    });
  } catch (err) {
    console.error('Optimize error:', err);
    return res.status(422).json({ code: 'AI_FAIL', error: 'AI optimization failed' });
  }
});

module.exports = router;
