import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';
import HistoryList from './components/HistoryList';
import Toast from './components/Toast';
import DiffText from './components/DiffText';
import ThemeToggle from './components/ThemeToggle';

function Label({ children }) {
  return <div className="text-xs uppercase tracking-wide mb-1" style={{ color: `rgb(var(--muted))` }}>{children}</div>;
}
function Chip({ children }) {
  return <span className="text-xs px-2 py-1 rounded border" style={{ borderColor: `rgb(var(--panel-border))` }}>{children}</span>;
}
function Panel({ title, children, footer }) {
  return (
    <div className="border rounded p-4 shadow-sm card">
      <div className="font-semibold text-lg mb-2">{title}</div>
      {children}
      {footer && <div className="mt-3 pt-3 border-t text-xs" style={{ color: `rgb(var(--muted))`, borderColor: `rgb(var(--panel-border))` }}>{footer}</div>}
    </div>
  );
}

const PRESETS = ['B07H65KP63', 'B0B3CPQ5PF', 'B08N5WRWNW'];

export default function App() {
  const [asin, setAsin] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ kind: 'info', text: '' });

  const validAsin = /^[A-Z0-9]{8,12}$/i.test(asin.trim());

  async function optimizeFor(currentAsin) {
    setToast({ kind: 'info', text: '' });
    setLoading(true);
    setData(null);
    try {
      const res = await axios.post(`${API_BASE}/api/asin/optimize`, { asin: currentAsin.trim() });
      setData(res.data);
      if (res.data.mock) {
        setToast({ kind: 'info', text: 'Using mock scrape due to Amazon blocking. Optimization still applied.' });
      } else {
        setToast({ kind: 'success', text: 'Optimization completed' });
      }
    } catch (e2) {
      const code = e2?.response?.data?.code;
      const msg =
        code === 'INVALID_ASIN'
          ? 'Invalid ASIN. Use 8–12 alphanumeric characters.'
          : code === 'SCRAPE_FAIL'
          ? 'Failed to fetch product details. Try again or a different locale.'
          : code === 'AI_FAIL'
          ? 'AI optimization failed. Please retry.'
          : e2?.response?.data?.error || 'Request failed';
      setToast({ kind: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }

  const handleOptimize = (e) => {
    e.preventDefault();
    if (!validAsin) {
      setToast({ kind: 'error', text: 'Please enter a valid ASIN (8–12 letters/digits).' });
      return;
    }
    optimizeFor(asin);
  };

  const copy = async (txt) => {
    await navigator.clipboard.writeText(txt || '');
    setToast({ kind: 'success', text: 'Copied to clipboard' });
  };

  const downloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.asin}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Toast {...toast} onClose={() => setToast({ text: '' })} />
      <header className="sticky top-0 border-b z-40 card">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">SalesDuo Listing Optimizer</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden md:inline text-xs" style={{ color: `rgb(var(--muted))` }}>API: {API_BASE}</span>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <form onSubmit={handleOptimize} className="mb-4 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Enter ASIN (e.g., B07H65KP63)"
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            className="border px-3 py-2 rounded w-80 input"
            aria-invalid={!validAsin && asin ? 'true' : 'false'}
          />
          <button disabled={loading} className="px-4 py-2 rounded btn-primary disabled:opacity-60">
            {loading ? 'Optimizing…' : 'Optimize'}
          </button>
          <div className="flex items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAsin(p);
                  optimizeFor(p);
                }}
                className="px-2 py-1 border rounded text-xs btn-ghost hover:opacity-80"
              >
                {p}
              </button>
            ))}
          </div>
        </form>
        {!validAsin && asin && <div className="text-xs text-red-500 mb-4">ASIN must be 8–12 alphanumeric characters.</div>}

        {data && (
          <div className="grid md:grid-cols-2 gap-4">
            <Panel
              title="Original"
              footer={`Scraped from ${data.source || 'n/a'} • ${data.mock ? 'mock' : 'live'} • ${new Date().toLocaleTimeString()}`}
            >
              <div className="flex gap-2 mb-2">
                <Chip>ASIN {data.asin}</Chip>
                <Chip>Source {data.source || 'n/a'}</Chip>
                {data.mock && <Chip>Mock scrape</Chip>}
              </div>
              <Label>Title</Label>
              <div className="mb-2">{data.original.title}</div>
              <Label>Bullets</Label>
              <ul className="list-disc pl-5 mb-2">
                {data.original.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <Label>Description</Label>
              <div className="text-sm whitespace-pre-wrap">{data.original.description}</div>
            </Panel>

            <Panel title="Optimized" footer={`Model: ${data.model} • ${data.durationMs} ms`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label>Title</Label>
                  <DiffText original={data.original.title} optimized={data.optimized.title} />
                </div>
                <button
                  type="button"
                  onClick={() => copy(data.optimized.title)}
                  className="ml-2 text-xs border rounded px-2 py-1 btn-ghost hover:opacity-80"
                >
                  Copy
                </button>
              </div>

              <Label>Bullets</Label>
              <ul className="list-disc pl-5 mb-2">
                {data.optimized.bullets?.map((b, i) => (
                  <li key={i}><DiffText original={data.original.bullets[i] || ''} optimized={b} /></li>
                ))}
              </ul>

              <Label>Description</Label>
              <div className="text-sm whitespace-pre-wrap mb-2">{data.optimized.description}</div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Keywords</Label>
                  <div className="text-sm">{(data.optimized.keywords || []).join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => copy((data.optimized.keywords || []).join(', '))} className="text-xs border rounded px-2 py-1 btn-ghost hover:opacity-80">Copy keywords</button>
                  <button type="button" onClick={downloadJson} className="text-xs border rounded px-2 py-1 btn-ghost hover:opacity-80">Download JSON</button>
                </div>
              </div>

              {data.summary && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip>Title +{data.summary.title?.added || 0} / -{data.summary.title?.removed || 0} words</Chip>
                  <Chip>Bullets +{data.summary.bullets?.added || 0} / -{data.summary.bullets?.removed || 0} words</Chip>
                </div>
              )}
            </Panel>
          </div>
        )}

        <HistoryList
          asinFilter={asin || undefined}
          onLoadRun={(run) => setData(run)}
        />
      </main>
    </div>
  );
}
