// LiveCallMonitor.tsx — Tab 1: Live Feed + KPI ribbon + 3-col bottom panels
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calls } from '../../data/mockData';
import KpiCard from '../shared/KpiCard';

const FILTERS = ['All', 'AI', 'WhatsApp', 'Human'];

function PriorityBadge({ p }: { p: string }) {
  const colors: Record<string, string> = { P1: '#ef4444', P2: '#f97316', P3: '#3b82f6', P4: '#6b7280' };
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors[p] + '22', color: colors[p], border: `1px solid ${colors[p]}44` }}>
      {p}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-sm"
      style={{
        backgroundColor: status === 'Resolved' ? '#10b981' : '#ef4444',
        color: '#fff',
      }}
    >
      {status}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  if (channel === 'WhatsApp') {
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-sm" style={{ backgroundColor: '#16a34a', color: '#fff' }}>
        WA →
      </span>
    );
  }
  return (
    <span className="text-xs font-bold px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: '#2563eb', color: '#fff' }}>
      📞
    </span>
  );
}

export default function LiveCallMonitor() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [activeCount, setActiveCount] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredCalls = calls.filter(c => {
    if (filter === 'All') return true;
    if (filter === 'AI') return c.status !== 'In Progress';
    if (filter === 'WhatsApp') return c.channel === 'WhatsApp';
    if (filter === 'Human') return c.status === 'Escalated';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-6 gap-3">
        <KpiCard label="Active Calls" value={activeCount} valueColor="#10b981" />
        <KpiCard label="AI Handling" value="88.5%" valueColor="#a855f7" />
        <KpiCard label="WhatsApp" value="69" valueColor="#a855f7" />
        <KpiCard label="Avg AI Time" value="114s" valueColor="#3b82f6" />
        <KpiCard label="Escalation Rate" value="19.5%" valueColor="#ef4444" />
        <KpiCard label="Images Today" value="46" valueColor="#f97316" />
      </div>

      {/* Live Feed */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1f2937' }}>
          <div className="flex items-center gap-2">
            <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#10b981' }} />
            <span className="text-sm font-semibold text-white">Live Feed</span>
          </div>
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-3 py-1 rounded transition-all"
                style={{
                  backgroundColor: filter === f ? '#10b981' : '#1f2937',
                  color: filter === f ? '#fff' : '#6b7280',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Call Rows */}
        <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
          {filteredCalls.map((call, i) => (
            <div
              key={call.id}
              className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all"
              style={{ borderBottom: '1px solid #1a2030' }}
              
              
              onClick={() => navigate(`/call/${call.callId}`)}
            >
              {/* Pulse dot */}
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#a855f7' }} />
              {/* Time */}
              <span className="text-xs w-10 flex-shrink-0" style={{ color: '#6b7280' }}>{call.timestamp}</span>
              {/* Name + Category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {call.caller} — {call.category}
                </p>
                <p className="text-xs truncate" style={{ color: '#6b7280' }}>
                  {call.area} • {call.duration} • {call.language}
                </p>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ChannelBadge channel={call.channel} />
                <PriorityBadge p={call.priority} />
                <StatusBadge status={call.status} />
                <span style={{ color: '#374151' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 3-Column Panels */}
      <div className="grid grid-cols-3 gap-4">
        {/* AI Performance */}
        <div className="rounded-lg p-4 space-y-3 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold" style={{ color: '#10b981' }}>🤖 AI Performance</h3>
          {[
            ['Calls Handled', '177'],
            ['Avg Duration', '106s'],
            ['Resolution Rate', '81.0%'],
            ['Avg Confidence', '95.8%'],
            ['Cost Saved', 'PKR 29.3K'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: '#6b7280' }}>{label}</span>
              <span style={{ color: '#d1d5db' }}>{val}</span>
            </div>
          ))}
        </div>
        {/* WhatsApp */}
        <div className="rounded-lg p-4 space-y-3 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold" style={{ color: '#10b981' }}>💬 WhatsApp Channel</h3>
          {[
            ['Total Messages', '69'],
            ['With Photos 📎', '42'],
            ['Auto-Classified', '100%'],
            ['Avg Response', '12s'],
            ['Photo AI Accuracy', '94.0%'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: '#6b7280' }}>{label}</span>
              <span style={{ color: '#d1d5db' }}>{val}</span>
            </div>
          ))}
        </div>
        {/* Human Agents */}
        <div className="rounded-lg p-4 space-y-3 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold" style={{ color: '#10b981' }}>👤 Human Agents (20)</h3>
          {[
            ['Calls Handled', '23'],
            ['Avg Duration', '310s'],
            ['Escalations Received', '44'],
            ['Active Now', '14'],
            ['Available', '1'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: '#6b7280' }}>{label}</span>
              <span style={{ color: '#d1d5db' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
