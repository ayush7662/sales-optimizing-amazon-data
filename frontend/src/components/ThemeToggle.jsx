import React, { useEffect, useState } from 'react';
import { toggleTheme, getTheme, watchSystemChanges } from '../theme';

export default function ThemeToggle() {
  const [mode, setMode] = useState(getTheme());

  useEffect(() => {
    const off = watchSystemChanges();
    return off;
  }, []);

  return (
    <button
      type="button"
      onClick={() => setMode(toggleTheme())}
      className="btn-ghost border px-3 py-1.5 rounded text-sm"
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
