require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const asinRoutes = require('./routes/asin');
const historyRoutes = require('./routes/history');
const { sequelize } = require('./config/db');

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: false,
  })
);
app.use(bodyParser.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.send('Backend running...'));

app.use('/api/asin', asinRoutes);
app.use('/api/history', historyRoutes);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ DB init error:', err);
    process.exit(1);
  }
})();
