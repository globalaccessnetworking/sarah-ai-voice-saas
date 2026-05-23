// TopBar.tsx — Header with title and LIVE sync indicator
import { useEffect, useState } from 'react';

export default function TopBar() {
  const [syncSeconds, setSyncSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncSeconds(prev => (prev >= 30 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{ backgroundColor: 'var(--color-app-bg)', borderBottom: '1px solid #1f2937' }}
    >
      <div>
        <h1 className="text-base font-semibold text-white">AI Voice Call Center</h1>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          3,000 calls/day • 150→20 agents • AI triage
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#10b981' }} />
        <span className="text-sm font-semibold" style={{ color: '#10b981' }}>LIVE</span>
        <span className="text-xs ml-2" style={{ color: '#6b7280' }}>
          Sync: {syncSeconds}s ago
        </span>
      </div>
    </header>
  );
}
