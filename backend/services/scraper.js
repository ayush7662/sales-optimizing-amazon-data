// backend/services/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const locales = [
  (asin) => `https://www.amazon.com/dp/${asin}`,
  (asin) => `https://www.amazon.in/dp/${asin}`,
  (asin) => `https://www.amazon.co.uk/dp/${asin}`,
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sanitize(s) {
  return (s || '').replace(/\s+/g, ' ').replace(/[^\x20-\x7E]/g, '').trim();
}

function extractWithCheerio(html) {
  const $ = cheerio.load(html);

  const title = sanitize($('#productTitle').text());

  const bullets = $('#feature-bullets ul li')
    .map((_, el) => sanitize($(el).text()))
    .get()
    .filter(Boolean);

  // Description fallbacks: standard desc, A+ modules, and generic selectors
  let description =
    sanitize($('#productDescription p').first().text()) ||
    sanitize($('#productDescription').first().text()) ||
    sanitize($('#aplus_feature_div').text()) ||
    sanitize($('div[id*="aplus"]').text()) ||
    sanitize($('div.a-expander-content').first().text());

  return { title, bullets, description };
}

async function tryAxios(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    timeout: 15000,
    validateStatus: (s) => s >= 200 && s < 400,
  });
  const data = extractWithCheerio(res.data);
  return data;
}

async function tryPuppeteer(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const html = await page.content();
    const data = extractWithCheerio(html);
    return data;
  } finally {
    await browser.close();
  }
}

async function fetchOnce(url) {
  try {
    const viaAxios = await tryAxios(url);
    if (viaAxios.title && viaAxios.bullets.length) return { ...viaAxios, source: `axios:${url}` };
  } catch (_) {}
  try {
    const viaPptr = await tryPuppeteer(url);
    if (viaPptr.title && viaPptr.bullets.length) return { ...viaPptr, source: `puppeteer:${url}` };
  } catch (_) {}
  return null;
}

async function scrapeProduct(asin) {
  const urls = locales.map((fn) => fn(asin));

  // 2 passes with backoff
  for (let pass = 0; pass < 2; pass++) {
    for (const url of urls) {
      const out = await fetchOnce(url);
      if (out) return { ...out, mock: false };
      await sleep(500 + pass * 500);
    }
  }

  // Fallback mock to keep the flow working
  return {
    title: 'Sample Bluetooth Headphones, Wireless Over-Ear Headset',
    bullets: [
      'High-quality stereo sound',
      'Long battery life up to 30 hours',
      'Comfortable and foldable design',
      'Built-in microphone for calls',
      'Fast Bluetooth 5.0 connectivity',
    ],
    description:
      'These wireless Bluetooth headphones provide premium sound and comfort for long listening sessions.',
    source: 'mock:fallback',
    mock: true,
  };
}

module.exports = { scrapeProduct };
