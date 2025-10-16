// backend/utils/diff.js
function tokenize(s = '') {
  return s.toLowerCase().split(/\s+/).filter(Boolean);
}

function wordDelta(oldText = '', newText = '') {
  const a = new Set(tokenize(oldText));
  const b = new Set(tokenize(newText));
  let added = 0;
  let removed = 0;
  b.forEach((t) => { if (!a.has(t)) added++; });
  a.forEach((t) => { if (!b.has(t)) removed++; });
  return { added, removed };
}

function bulletsDelta(oldArr = [], newArr = []) {
  const len = Math.max(oldArr.length, newArr.length);
  let added = 0;
  let removed = 0;
  for (let i = 0; i < len; i++) {
    const { added: a, removed: r } = wordDelta(oldArr[i] || '', newArr[i] || '');
    added += a; removed += r;
  }
  return { added, removed };
}

function summarizeImprovement(original, optimized) {
  const title = wordDelta(original.title, optimized.title);
  const bullets = bulletsDelta(original.bullets || [], optimized.bullets || []);
  return { title, bullets };
}

module.exports = { summarizeImprovement };
