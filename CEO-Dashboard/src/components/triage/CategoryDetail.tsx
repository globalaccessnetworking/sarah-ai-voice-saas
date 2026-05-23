// CategoryDetail.tsx — REWRITTEN to match original: 6 KPIs + AI vs Human bar + Subtypes panel
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoryById, categories } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';

// Per-category exact data
const CATEGORY_STATS: Record<string, {
  total: number; aiHandled: number; human: number;
  avgAI: number; avgHuman: number; resolution: number;
  aiPct: number; humanPct: number;
  satisfaction: number; escalationRate: number; costPerCall: number;
  trend: number[];
  subtypes: { name: string; id: string; calls: number; aiRate: number }[];
}> = {
  'missed-collection': {
    total: 335, aiHandled: 268, human: 67, avgAI: 74, avgHuman: 421, resolution: 93,
    aiPct: 80, humanPct: 20, satisfaction: 4.1, escalationRate: 3.7, costPerCall: 27,
    trend: [62, 52, 48, 55, 63, 44, 67],
    subtypes: [
      { name: 'School Zone', id: 'school-zone', calls: 99, aiRate: 91.0 },
      { name: 'Market', id: 'market', calls: 184, aiRate: 91.0 },
      { name: 'Hospital Zone', id: 'hospital-zone', calls: 88, aiRate: 86.0 },
    ],
  },
  'street-sweeping': {
    total: 410, aiHandled: 350, human: 60, avgAI: 82, avgHuman: 380, resolution: 94,
    aiPct: 85, humanPct: 15, satisfaction: 4.2, escalationRate: 3.2, costPerCall: 22,
    trend: [55, 62, 70, 65, 72, 68, 75],
    subtypes: [
      { name: 'Main Road', id: 'main-road', calls: 196, aiRate: 92.0 },
      { name: 'Side Street', id: 'side-street', calls: 115, aiRate: 88.0 },
      { name: 'Market Area', id: 'market-area', calls: 57, aiRate: 81.0 },
      { name: 'Residential Lane', id: 'residential-lane', calls: 41, aiRate: 78.0 },
    ],
  },
  'dead-animal': {
    total: 466, aiHandled: 420, human: 46, avgAI: 90, avgHuman: 350, resolution: 98,
    aiPct: 90, humanPct: 10, satisfaction: 4.5, escalationRate: 2.1, costPerCall: 19,
    trend: [70, 75, 80, 72, 85, 78, 90],
    subtypes: [
      { name: 'Stray Dog', id: 'stray-dog', calls: 210, aiRate: 95.0 },
      { name: 'Cat', id: 'cat', calls: 116, aiRate: 91.0 },
      { name: 'Livestock', id: 'livestock', calls: 93, aiRate: 88.0 },
      { name: 'Other', id: 'other', calls: 47, aiRate: 82.0 },
    ],
  },
  'illegal-dumping': {
    total: 225, aiHandled: 175, human: 50, avgAI: 104, avgHuman: 460, resolution: 88,
    aiPct: 78, humanPct: 22, satisfaction: 3.8, escalationRate: 6.3, costPerCall: 31,
    trend: [38, 40, 42, 36, 44, 42, 48],
    subtypes: [
      { name: 'Construction Site', id: 'construction-site', calls: 90, aiRate: 82.0 },
      { name: 'Industrial Area', id: 'industrial-area', calls: 68, aiRate: 78.0 },
      { name: 'Residential', id: 'residential', calls: 45, aiRate: 74.0 },
      { name: 'Roadside', id: 'roadside', calls: 22, aiRate: 70.0 },
    ],
  },
  'overflowing-bin': {
    total: 460, aiHandled: 405, human: 55, avgAI: 68, avgHuman: 310, resolution: 91,
    aiPct: 88, humanPct: 12, satisfaction: 4.3, escalationRate: 3.8, costPerCall: 20,
    trend: [75, 80, 72, 85, 82, 78, 88],
    subtypes: [
      { name: 'Street Bin', id: 'street-bin', calls: 253, aiRate: 92.0 },
      { name: 'Commercial Area', id: 'commercial-area', calls: 115, aiRate: 89.0 },
      { name: 'Residential', id: 'residential', calls: 69, aiRate: 85.0 },
      { name: 'Industrial', id: 'industrial', calls: 23, aiRate: 80.0 },
    ],
  },
  'drain-blockage': {
    total: 331, aiHandled: 292, human: 39, avgAI: 61, avgHuman: 430, resolution: 94,
    aiPct: 88, humanPct: 12, satisfaction: 4.0, escalationRate: 2.8, costPerCall: 18,
    trend: [48, 52, 58, 54, 62, 58, 65],
    subtypes: [
      { name: 'Street Drain', id: 'street-drain', calls: 165, aiRate: 91.0 },
      { name: 'Nala / Canal', id: 'nala-canal', calls: 99, aiRate: 88.0 },
      { name: 'Residential', id: 'residential', calls: 50, aiRate: 84.0 },
      { name: 'Industrial', id: 'industrial', calls: 17, aiRate: 76.0 },
    ],
  },
  'construction-debris': {
    total: 378, aiHandled: 335, human: 43, avgAI: 100, avgHuman: 400, resolution: 93,
    aiPct: 89, humanPct: 11, satisfaction: 4.1, escalationRate: 3.5, costPerCall: 21,
    trend: [58, 62, 65, 70, 68, 72, 78],
    subtypes: [
      { name: 'Roadside', id: 'roadside', calls: 207, aiRate: 92.0 },
      { name: 'Private Property', id: 'private-property', calls: 95, aiRate: 88.0 },
      { name: 'Industrial Zone', id: 'industrial-zone', calls: 45, aiRate: 84.0 },
      { name: 'Other', id: 'other', calls: 31, aiRate: 79.0 },
    ],
  },
  'hazardous-waste': {
    total: 450, aiHandled: 390, human: 60, avgAI: 139, avgHuman: 520, resolution: 84,
    aiPct: 87, humanPct: 13, satisfaction: 3.7, escalationRate: 5.2, costPerCall: 35,
    trend: [65, 72, 68, 75, 80, 76, 85],
    subtypes: [
      { name: 'Chemical Dump', id: 'chemical-dump', calls: 158, aiRate: 88.0 },
      { name: 'Medical Waste', id: 'medical-waste', calls: 135, aiRate: 85.0 },
      { name: 'Electronic Waste', id: 'electronic-waste', calls: 99, aiRate: 82.0 },
      { name: 'Other', id: 'other', calls: 58, aiRate: 78.0 },
    ],
  },
  'noise-complaint': {
    total: 483, aiHandled: 420, human: 63, avgAI: 105, avgHuman: 390, resolution: 83,
    aiPct: 87, humanPct: 13, satisfaction: 3.9, escalationRate: 4.1, costPerCall: 23,
    trend: [72, 78, 82, 75, 88, 84, 92],
    subtypes: [
      { name: 'Construction Noise', id: 'construction-noise', calls: 193, aiRate: 90.0 },
      { name: 'Loudspeaker', id: 'loudspeaker', calls: 145, aiRate: 88.0 },
      { name: 'Vehicle Noise', id: 'vehicle-noise', calls: 97, aiRate: 84.0 },
      { name: 'Other', id: 'other', calls: 48, aiRate: 78.0 },
    ],
  },
  'water-logging': {
    total: 384, aiHandled: 340, human: 44, avgAI: 131, avgHuman: 480, resolution: 86,
    aiPct: 89, humanPct: 11, satisfaction: 3.8, escalationRate: 2.8, costPerCall: 24,
    trend: [55, 60, 65, 70, 68, 72, 80],
    subtypes: [
      { name: 'Road Flooding', id: 'road-flooding', calls: 192, aiRate: 91.0 },
      { name: 'Residential Area', id: 'residential-area', calls: 115, aiRate: 88.0 },
      { name: 'Drain Overflow', id: 'drain-overflow', calls: 58, aiRate: 84.0 },
      { name: 'Other', id: 'other', calls: 19, aiRate: 78.0 },
    ],
  },
};

export default function CategoryDetail() {
  const { category: catId } = useParams();
  const navigate = useNavigate();
  const cat = catId ? getCategoryById(catId) : categories[0];
  const stats = catId ? CATEGORY_STATS[catId] : CATEGORY_STATS['missed-collection'];

  if (!cat || !stats) return <div className="text-gray-500 p-8">Category not found</div>;

  const maxSubtypeCalls = Math.max(...stats.subtypes.map(s => s.calls));

  return (
    <div className="space-y-4">
      {/* Back */}
      <BackButton label="← All Categories" to="/triage" />

      {/* Title Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-white">{cat.name}</h2>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#7c3aed', color: '#fff' }}>
          {stats.total} calls/day
        </span>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#f97316', color: '#fff' }}>
          AI: {stats.aiPct}%
        </span>
      </div>

      {/* 6-Card KPI Ribbon */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '#a855f7' },
          { label: 'AI Handled', value: stats.aiHandled, color: '#3b82f6' },
          { label: 'Human', value: stats.human, color: '#f97316' },
          { label: 'Avg AI Time', value: `${stats.avgAI}s`, color: '#10b981' },
          { label: 'Avg Human', value: `${stats.avgHuman}s`, color: '#f97316' },
          { label: 'Resolution', value: `${stats.resolution}%`, color: '#10b981' },
        ].map(k => (
          <div key={k.label} className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Two-Column Body */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: AI vs Human Handling */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">AI vs Human Handling</h3>

          {/* Stacked bar */}
          <div className="flex rounded-lg overflow-hidden h-8 mb-4">
            <div
              className="flex items-center justify-center text-xs font-bold text-white transition-all"
              style={{ width: `${stats.aiPct}%`, backgroundColor: '#7c3aed' }}
            >
              {stats.aiPct}%
            </div>
            <div
              className="flex items-center justify-center text-xs font-bold text-white transition-all"
              style={{ width: `${stats.humanPct}%`, backgroundColor: '#f97316' }}
            >
              {stats.humanPct}.0%
            </div>
          </div>

          {/* Stats */}
          {[
            { label: 'Satisfaction', value: `${stats.satisfaction}/5` },
            { label: 'Escalation Rate', value: `${stats.escalationRate}%` },
            { label: 'Cost/Call', value: `PKR ${stats.costPerCall}` },
            {
              label: '7-day Trend',
              value: stats.trend.join(' → '),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: '#d1d5db', maxWidth: 220, textAlign: 'right', fontSize: label === '7-day Trend' ? 11 : undefined }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Subtypes */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Subtypes</h3>
          <div className="space-y-3">
            {stats.subtypes.map(sub => (
              <div
                key={sub.id}
                className="flex items-center gap-3 cursor-pointer group py-1"
                onClick={() => navigate(`/triage/${catId}/${sub.id}`)}
              >
                {/* Name + calls */}
                <div style={{ width: 140, flexShrink: 0 }}>
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {sub.name}
                  </p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{sub.calls} calls</p>
                </div>
                {/* Bar */}
                <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: '#1f2937' }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${(sub.calls / maxSubtypeCalls) * 100}%`, backgroundColor: '#a855f7' }}
                  />
                </div>
                {/* AI Rate */}
                <span className="text-sm font-bold w-12 text-right flex-shrink-0" style={{ color: '#a855f7' }}>
                  {sub.aiRate}%
                </span>
                {/* Arrow */}
                <span style={{ color: '#374151' }} className="group-hover:text-emerald-400 transition-colors">→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
