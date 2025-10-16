import React, { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import axios from 'axios';

export default function HistoryList({ asinFilter, onLoadRun }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/history`, {
        params: { asin: asinFilter || undefined, page: p, pageSize: 5 },
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [asinFilter]);

  const pages = Math.ceil(total / 5);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Optimization History</h2>
        <button onClick={() => load(page)} className="text-sm underline">Refresh</button>
      </div>

      {loading && <div className="text-sm text-[rgb(var(--muted))] mb-2">Loading history…</div>}

      <div className="overflow-x-auto border rounded card">
        <table className="min-w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="text-left p-2">ASIN</th>
              <th className="text-left p-2">Title (optimized)</th>
              <th className="text-left p-2">Model</th>
              <th className="text-left p-2">Duration</th>
              <th className="text-left p-2">Source</th>
              <th className="text-left p-2">Created</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t" style={{ borderColor: `rgb(var(--panel-border))` }}>
                <td className="p-2 font-mono">{it.asin}</td>
                <td className="p-2">{it.optimized?.title?.slice(0, 80) || ''}</td>
                <td className="p-2">{it.model}</td>
                <td className="p-2">{it.durationMs} ms</td>
                <td className="p-2">{it.mock ? 'mock' : (it.source || '').split(':')[0]}</td>
                <td className="p-2">{new Date(it.createdAt).toLocaleString()}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => onLoadRun?.(it)}
                    className="px-2 py-1 border rounded hover:opacity-80 btn-ghost"
                  >
                    Compare
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="p-4 text-center" style={{ color: `rgb(var(--muted))` }}>
                  No runs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2 mt-3">
          <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-2 py-1 border rounded btn-ghost disabled:opacity-50">Prev</button>
          <span className="text-sm self-center">Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => load(page + 1)} className="px-2 py-1 border rounded btn-ghost disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
