import React from 'react';

export default function Toast({ kind = 'info', text, onClose }) {
  if (!text) return null;
  const cls =
    kind === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : kind === 'success'
      ? 'bg-green-50 border-green-200 text-green-700'
      : 'bg-blue-50 border-blue-200 text-blue-700';
  return (
    <div className={`fixed top-4 right-4 z-50 border rounded px-4 py-2 shadow ${cls}`}>
      <div className="flex items-center gap-3">
        <span className="text-sm">{text}</span>
        <button onClick={onClose} className="text-xs underline">Close</button>
      </div>
    </div>
  );
}
