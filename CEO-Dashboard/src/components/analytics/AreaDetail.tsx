// AreaDetail.tsx — COMPLETE REWRITE to match original exactly:
// Title with [calls] [WhatsApp] [images] badges
// 6 KPI cards: TOTAL | AI HANDLED | HUMAN | WHATSAPP | SATISFACTION | ESCALATION
// Two charts: Hourly Distribution (green) + 7-Day Trend (blue)
// Two stat panels: Top Category + Response Time
// "Calls from [Area]" recent call list (clickable → NLP Analysis)
import { useParams, useNavigate } from 'react-router-dom';
import { getDistrictById, districts } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

// Per-area realistic call lists with SP-LAH ticket format
const AREA_CALLS: Record<string, {
  time: string; caller: string; ticket: string; category: string;
  handler: 'AI' | 'WA' | 'Hum'; status: 'Resolved' | 'Escalated'; callId: string;
}[]> = {
  'Anarkali': [
    { time: '11:44', caller: 'Asad Iqbal', ticket: 'SP-LAH-08914', category: 'Drain Blockage', handler: 'AI', status: 'Escalated', callId: 'CALL-3000' },
    { time: '13:40', caller: 'Waqar Younis', ticket: 'SP-LAH-53223', category: 'Noise Complaint', handler: 'WA', status: 'Escalated', callId: 'CALL-2999' },
    { time: '08:12', caller: 'Zainab Noor', ticket: 'SP-LAH-53221', category: 'Missed Collection', handler: 'AI', status: 'Resolved', callId: 'CALL-2998' },
    { time: '13:14', caller: 'Amna Siddiqui', ticket: 'SP-LAH-01100', category: 'Dead Animal', handler: 'WA', status: 'Resolved', callId: 'CALL-2997' },
    { time: '16:17', caller: 'Zainab Noor', ticket: 'SP-LAH-77183', category: 'Noise Complaint', handler: 'Hum', status: 'Resolved', callId: 'CALL-2996' },
  ],
  'Cantt': [
    { time: '09:20', caller: 'Ayesha Malik', ticket: 'SP-LAH-55630', category: 'Construction Debris', handler: 'WA', status: 'Resolved', callId: 'CALL-2985' },
    { time: '11:45', caller: 'Bilal Hussain', ticket: 'SP-LAH-99083', category: 'Overflowing Bin', handler: 'AI', status: 'Resolved', callId: 'CALL-2984' },
    { time: '14:33', caller: 'Mehreen Zahra', ticket: 'SP-LAH-33410', category: 'Street Sweeping', handler: 'AI', status: 'Escalated', callId: 'CALL-2983' },
    { time: '17:11', caller: 'Ahmed Khan', ticket: 'SP-LAH-21882', category: 'Missed Collection', handler: 'WA', status: 'Resolved', callId: 'CALL-2982' },
  ],
};

function generateAreaCalls(_areaName: string, distId: string) {
  const donors = [
    { time: '09:15', caller: 'Ahmed Khan', ticket: `SP-${distId.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`, category: 'Missed Collection', handler: 'AI' as const, status: 'Resolved' as const, callId: 'CALL-3000' },
    { time: '11:30', caller: 'Sana Bibi', ticket: `SP-${distId.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`, category: 'Noise Complaint', handler: 'WA' as const, status: 'Escalated' as const, callId: 'CALL-2999' },
    { time: '14:22', caller: 'Tariq Javed', ticket: `SP-${distId.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`, category: 'Overflowing Bin', handler: 'AI' as const, status: 'Resolved' as const, callId: 'CALL-2998' },
    { time: '16:40', caller: 'Zainab Noor', ticket: `SP-${distId.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`, category: 'Dead Animal', handler: 'Hum' as const, status: 'Resolved' as const, callId: 'CALL-2997' },
    { time: '18:55', caller: 'Asad Iqbal', ticket: `SP-${distId.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 89999)}`, category: 'Street Sweeping', handler: 'WA' as const, status: 'Resolved' as const, callId: 'CALL-2996' },
  ];
  return donors;
}

// Generate 24-hour distribution skewed toward business hours
function generateHourlyData(totalCalls: number) {
  const weights = [0.01, 0.01, 0.01, 0.01, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.06, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01];
  return weights.map((w, h) => ({
    hour: h,
    calls: Math.max(0, Math.round(totalCalls * w + (Math.random() - 0.5) * 1)),
  }));
}

function HandlerBadge({ handler }: { handler: 'AI' | 'WA' | 'Hum' }) {
  const cfg = {
    AI: { bg: '#10b981', text: 'AI' },
    WA: { bg: '#16a34a', text: 'WA →' },
    Hum: { bg: '#3b82f6', text: 'Hum' },
  };
  const c = cfg[handler];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-sm" style={{ backgroundColor: c.bg, color: '#fff' }}>
      {c.text}
    </span>
  );
}

const TOP_CATEGORIES: Record<string, string> = {
  'Anarkali': 'Hazardous Waste', 'Cantt': 'Construction Debris',
  'Shadman': 'Noise Complaint', 'DHA Phase 5': 'Dead Animal',
  'Township Sector C2': 'Overflowing Bin', 'Faisal Town': 'Missed Collection',
  'Model Town Link Road': 'Street Sweeping', 'Johar Town Block D': 'Water Logging',
  'Ichra': 'Overflowing Bin', 'Garden Town': 'Noise Complaint',
  'Cavalry Ground': 'Missed Collection', 'Allama Iqbal Town': 'Street Sweeping',
};

export default function AreaDetail() {
  const { district: distId, area: areaName } = useParams();
  const navigate = useNavigate();
  const dist = distId ? getDistrictById(distId) : districts[0];
  const decoded = areaName ? decodeURIComponent(areaName) : '';
  const area = dist?.areas.find(a => a.name === decoded) || dist?.areas[0];

  if (!dist || !area) return <div className="text-gray-500 p-8">Area not found</div>;

  const human = Math.max(0, area.calls - area.ai - area.wa);
  const topCategory = TOP_CATEGORIES[area.name] || dist.topCategory;
  const responseTime = `${Math.floor(1 + (area.escRate / 10))} min`;

  const hourlyData = generateHourlyData(area.calls);
  const peakHour = hourlyData.reduce((max, d) => d.calls > max.calls ? d : max, hourlyData[0]);

  const weeklyData = [
    { day: 'D1', calls: Math.round(area.calls * 0.85) },
    { day: 'D2', calls: Math.round(area.calls * 1.1) },
    { day: 'D3', calls: Math.round(area.calls * 0.9) },
    { day: 'D4', calls: Math.round(area.calls * 1.2) },
    { day: 'D5', calls: Math.round(area.calls * 0.95) },
    { day: 'D6', calls: Math.round(area.calls * 1.05) },
    { day: 'D7', calls: area.calls },
  ];

  const callList = AREA_CALLS[area.name] || generateAreaCalls(area.name, distId || 'lah');

  return (
    <div className="space-y-4">
      <BackButton label={`← ${dist.name}`} to={`/analytics/${dist.id}`} />

      {/* Title with 3 badges — matches "Anarkali [34 calls] [6 WhatsApp] [5 —]" */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-white">{area.name}</h2>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
          {area.calls} calls
        </span>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#16a34a', color: '#fff' }}>
          {area.wa} WhatsApp
        </span>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#374151', color: '#d1d5db' }}>
          {area.images} —
        </span>
      </div>

      {/* 6-Card KPI — matches TOTAL | AI HANDLED | HUMAN | WHATSAPP | SATISFACTION | ESCALATION */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total', value: area.calls, color: '#a855f7' },
          { label: 'AI Handled', value: area.ai, color: '#a855f7' },
          { label: 'Human', value: human, color: '#f97316' },
          { label: 'WhatsApp', value: area.wa, color: '#16a34a' },
          { label: 'Satisfaction', value: `${area.rating}/5`, color: '#f97316' },
          { label: 'Escalation', value: `${area.escRate}%`, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280', fontSize: 10 }}>{k.label}</p>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Two charts side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT: Hourly Distribution — GREEN bars */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-1">Hourly Distribution — {area.name}</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={hourlyData} barSize={8} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 9 }}
                interval={3}
                tickFormatter={h => `${h}`}
              />
              
              <Bar dataKey="calls" radius={[2, 2, 0, 0]}>
                {hourlyData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.hour === peakHour.hour ? '#10b981' : '#1f7a5c'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
            Peak: {String(peakHour.hour).padStart(2, '0')}:00 ({peakHour.calls} calls)
          </p>
        </div>

        {/* RIGHT: 7-Day Trend — BLUE bars */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-1">7-Day Trend</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={weeklyData} barSize={32} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
              
              <Bar dataKey="calls" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two stat panels — Top Category + Response Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-sm font-semibold text-white mb-2">Top Category</p>
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{topCategory}</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Most common complaint type in this area</p>
        </div>
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-sm font-semibold text-white mb-2">Response Time</p>
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{responseTime}</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Avg response for this area</p>
        </div>
      </div>

      {/* Calls from [Area] list */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f2937' }}>
          <h3 className="text-sm font-semibold text-white">Calls from {area.name}</h3>
        </div>
        <div>
          {callList.map((call, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all"
              style={{ borderBottom: '1px solid #1a2030' }}
              
              
              onClick={() => navigate(`/analytics/${distId}/${encodeURIComponent(area.name)}/${call.callId}/nlp`)}
            >
              {/* Time */}
              <span className="text-xs font-mono w-10 flex-shrink-0" style={{ color: '#6b7280' }}>{call.time}</span>
              {/* Name + ticket + category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{call.caller}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>{call.ticket} • {call.category}</p>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <HandlerBadge handler={call.handler} />
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-sm"
                  style={{ backgroundColor: call.status === 'Resolved' ? '#10b981' : '#ef4444', color: '#fff' }}
                >
                  {call.status}
                </span>
                <span className="text-xs" style={{ color: '#374151' }}>—</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
