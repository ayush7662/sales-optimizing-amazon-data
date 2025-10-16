import React from 'react';

function diffWords(a = '', b = '') {
  const aa = a.split(' ');
  const bb = b.split(' ');
  const dp = Array(aa.length + 1)
    .fill(null)
    .map(() => Array(bb.length + 1).fill(0));
  for (let i = 1; i <= aa.length; i++) {
    for (let j = 1; j <= bb.length; j++) {
      dp[i][j] = aa[i - 1] === bb[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const out = [];
  let i = aa.length,
    j = bb.length;
  while (i > 0 && j > 0) {
    if (aa[i - 1] === bb[j - 1]) {
      out.unshift({ t: 'eq', w: aa[i - 1] });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      out.unshift({ t: 'del', w: aa[i - 1] });
      i--;
    } else {
      out.unshift({ t: 'add', w: bb[j - 1] });
      j--;
    }
  }
  while (i > 0) { out.unshift({ t: 'del', w: aa[i - 1] }); i--; }
  while (j > 0) { out.unshift({ t: 'add', w: bb[j - 1] }); j--; }
  return out;
}

export default function DiffText({ original = '', optimized = '' }) {
  const parts = diffWords(original, optimized);
  return (
    <div className="text-sm leading-6">
      {parts.map((p, idx) => {
        if (p.t === 'eq') return <span key={idx}>{p.w} </span>;
        if (p.t === 'add') return <span key={idx} className="bg-green-100 text-green-800 px-1 rounded">{p.w} </span>;
        return <span key={idx} className="bg-red-100 text-red-800 line-through px-1 rounded">{p.w} </span>;
      })}
    </div>
  );
}
