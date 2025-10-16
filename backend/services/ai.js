// backend/services/ai.js
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

function hashPrompt(p) {
  return crypto.createHash('sha256').update(p).digest('hex').slice(0, 16);
}

function stripEmoji(str = '') {
  // Basic unicode symbol/emoji removal to stay Amazon-compliant
  return str.replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '');
}

function clamp(str = '', max = 200) {
  if (!str) return '';
  const s = str.trim();
  return s.length <= max ? s : s.slice(0, max - 1).trim();
}

function enforceOutputShape(out) {
  const bullets = Array.isArray(out.bullets) ? out.bullets : [];
  const keywords = Array.isArray(out.keywords) ? out.keywords : [];

  const cleanBullets = bullets
    .map((b) => clamp(stripEmoji(b || ''), 200))
    .filter(Boolean)
    .slice(0, 5);

  const cleanKeywords = Array.from(
    new Set(
      keywords
        .map((k) => stripEmoji(k || '').toLowerCase().trim())
        .filter(Boolean)
    )
  ).slice(3, 8); // keep 3–5 final keywords

  return {
    title: clamp(stripEmoji(out.title || ''), 200),
    bullets: cleanBullets,
    description: clamp(stripEmoji(out.description || ''), 2000),
    keywords: cleanKeywords.length >= 3 ? cleanKeywords : (keywords.slice(0, 5) || []),
  };
}

function buildPrompt({ asin, title, bullets, description }) {
  return `
You are an Amazon Listings SEO & Compliance expert.

Strict rules (must follow):
- Do not include HTML, emojis, discount language, or unverifiable claims.
- Title: <= 200 chars, brand-neutral, keyword-rich, readable, no ALL CAPS, no emojis.
- Bullets: 5 items max, each <= 200 chars, benefits-first, no prohibited terms like "best ever", "guaranteed", "FDA approved".
- Description: 2–3 short paragraphs, persuasive but compliant, no medical or unsupported claims.
- Provide 3–5 keyword suggestions: short phrases, no competitor brand hijacking or ASINs.

Input:
ASIN: ${asin}
Title: ${title}
Bullets: ${bullets.join(' | ')}
Description: ${description}

Output:
Return ONLY strict JSON with keys:
{
  "title": "string",
  "bullets": ["string", "string", "string", "string", "string"],
  "description": "string",
  "keywords": ["string", "string", "string"]
}
`;
}

async function optimizeListing(input) {
  const prompt = buildPrompt(input);
  const promptHash = hashPrompt(prompt);
  const model = genAI.getGenerativeModel({ model: MODEL_ID });
  const started = Date.now();
  const resp = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    safetySettings: [],
  });
  let text = resp.response.text().trim();
  text = text.replace(/``````/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    parsed = JSON.parse(text.slice(first, last + 1));
  }
  const post = enforceOutputShape(parsed);
  const durationMs = Date.now() - started;
  return { optimized: post, model: MODEL_ID, promptHash, durationMs, raw: text };
}

module.exports = { optimizeListing };
