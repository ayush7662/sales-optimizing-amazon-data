// backend/routes/history.js
const express = require('express');
const router = express.Router();
const { ListingRun } = require('../config/db');

router.get('/', async (req, res) => {
  const { asin, page = 1, pageSize = 10 } = req.query;
  const where = {};
  if (asin) where.asin = asin;
  const limit = Math.min(parseInt(pageSize, 10) || 10, 100);
  const offset = (parseInt(page, 10) - 1) * limit;
  const { rows, count } = await ListingRun.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  res.json({ items: rows, total: count, page: Number(page), pageSize: limit });
});

router.get('/:id', async (req, res) => {
  const row = await ListingRun.findByPk(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

module.exports = router;
