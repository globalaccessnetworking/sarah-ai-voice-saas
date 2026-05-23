// SubtypeDetail.tsx — Level 2 under Triage: shows recent call list for a subtype
import { useParams, useNavigate } from 'react-router-dom';

// Subtype → display data mapping
const SUBTYPE_DATA: Record<string, {
  name: string; category: string;
  totalCalls: number; aiHandled: number; aiRate: number; human: number;
  recentCalls: {
    time: string; caller: string; area: string; refNumber: string;
    handler: 'AI' | 'Human' | 'WA'; status: 'Resolved' | 'Escalated';
    callId: string; dotColor: string;
  }[];
}> = {
  'school-zone': {
    name: 'School Zone', category: 'Missed Collection',
    totalCalls: 99, aiHandled: 81, aiRate: 81.6, human: 18,
    recentCalls: [
      { time: '11:55', caller: 'Ahmed Khan', area: 'Wazir Taxi • SP-TAX-58843', refNumber: 'SP-TAX-58843', handler: 'AI', status: 'Escalated', callId: 'CALL-3000', dotColor: '#a855f7' },
      { time: '09:01', caller: 'Hina Rizwan', area: 'EME Society • SP-BAH-19131', refNumber: 'SP-BAH-19131', handler: 'AI', status: 'Resolved', callId: 'CALL-2989', dotColor: '#a855f7' },
      { time: '10:42', caller: 'Waqar Younis', area: 'Askari IV • SP-BAH-98181', refNumber: 'SP-BAH-98181', handler: 'Human', status: 'Resolved', callId: 'CALL-2999', dotColor: '#f97316' },
      { time: '13:19', caller: 'Nadia Perveen', area: 'Bagbanpura • SP-MIA-46224', refNumber: 'SP-MIA-46224', handler: 'WA', status: 'Resolved', callId: 'CALL-2991', dotColor: '#a855f7' },
      { time: '12:14', caller: 'Kashif Mehmood', area: 'PIA Housing • SP-KHU-33828', refNumber: 'SP-KHU-33828', handler: 'AI', status: 'Escalated', callId: 'CALL-2988', dotColor: '#f97316' },
      { time: '14:33', caller: 'Mehreen Zahra', area: 'Gulberg II • SP-MUZ-36450', refNumber: 'SP-MUZ-36450', handler: 'AI', status: 'Resolved', callId: 'CALL-2992', dotColor: '#a855f7' },
      { time: '09:19', caller: 'Kashif Mehmood', area: 'Chinewala • SP-BHK-F311', refNumber: 'SP-BHK-F311', handler: 'AI', status: 'Resolved', callId: 'CALL-2987', dotColor: '#a855f7' },
      { time: '17:17', caller: 'Usman Tariq', area: 'Wazir Town • SP-BHA-20603', refNumber: 'SP-BHA-20603', handler: 'WA', status: 'Resolved', callId: 'CALL-2986', dotColor: '#a855f7' },
      { time: '22:16', caller: 'Tahir Mahmood', area: 'Cavalry Ground • SP-CHA-33813', refNumber: 'SP-CHA-33813', handler: 'AI', status: 'Resolved', callId: 'CALL-2998', dotColor: '#a855f7' },
      { time: '08:45', caller: 'Asad Iqbal', area: 'EME Society • SP-WAZ-84582', refNumber: 'SP-WAZ-84582', handler: 'AI', status: 'Escalated', callId: 'CALL-2981', dotColor: '#a855f7' },
    ],
  },
  'market': {
    name: 'Market', category: 'Missed Collection',
    totalCalls: 184, aiHandled: 167, aiRate: 90.8, human: 17,
    recentCalls: [
      { time: '10:15', caller: 'Farooq Ahmad', area: 'Liberty Market • SP-LAH-44112', refNumber: 'SP-LAH-44112', handler: 'AI', status: 'Resolved', callId: 'CALL-2993', dotColor: '#a855f7' },
      { time: '11:30', caller: 'Samina Begum', area: 'Anarkali Bazaar • SP-LAH-88310', refNumber: 'SP-LAH-88310', handler: 'AI', status: 'Resolved', callId: 'CALL-2986', dotColor: '#a855f7' },
      { time: '14:22', caller: 'Bilal Hussain', area: 'Ichhra Market • SP-LAH-55210', refNumber: 'SP-LAH-55210', handler: 'WA', status: 'Resolved', callId: 'CALL-2983', dotColor: '#a855f7' },
      { time: '16:40', caller: 'Ahmed Khan', area: 'Raja Market • SP-LAH-21445', refNumber: 'SP-LAH-21445', handler: 'AI', status: 'Escalated', callId: 'CALL-2987', dotColor: '#f97316' },
      { time: '08:55', caller: 'Zainab Noor', area: 'Hafeez Centre • SP-LAH-72210', refNumber: 'SP-LAH-72210', handler: 'AI', status: 'Resolved', callId: 'CALL-2985', dotColor: '#a855f7' },
    ],
  },
  'hospital-zone': {
    name: 'Hospital Zone', category: 'Missed Collection',
    totalCalls: 88, aiHandled: 76, aiRate: 86.4, human: 12,
    recentCalls: [
      { time: '09:45', caller: 'Ayesha Malik', area: 'Mayo Hospital • SP-LAH-09182', refNumber: 'SP-LAH-09182', handler: 'AI', status: 'Resolved', callId: 'CALL-2997', dotColor: '#a855f7' },
      { time: '13:10', caller: 'Nadia Perveen', area: 'Services Hospital • SP-LAH-45078', refNumber: 'SP-LAH-45078', handler: 'Human', status: 'Escalated', callId: 'CALL-2990', dotColor: '#f97316' },
      { time: '15:33', caller: 'Mehreen Zahra', area: 'Lahore General • SP-LAH-12098', refNumber: 'SP-LAH-12098', handler: 'AI', status: 'Resolved', callId: 'CALL-2992', dotColor: '#a855f7' },
    ],
  },
};

const DEFAULT_SUBTYPE = (id: string, catId: string) => ({
  name: id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  category: catId.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  totalCalls: 80, aiHandled: 68, aiRate: 85.0, human: 12,
  recentCalls: [
    { time: '10:22', caller: 'Ahmed Khan', area: 'Model Town • SP-LAH-11001', refNumber: 'SP-LAH-11001', handler: 'AI' as const, status: 'Resolved' as const, callId: 'CALL-3000', dotColor: '#a855f7' },
    { time: '11:14', caller: 'Sana Bibi', area: 'DHA Phase 5 • SP-LAH-22002', refNumber: 'SP-LAH-22002', handler: 'WA' as const, status: 'Escalated' as const, callId: 'CALL-2999', dotColor: '#f97316' },
    { time: '14:50', caller: 'Tariq Javed', area: 'Johar Town • SP-LAH-33003', refNumber: 'SP-LAH-33003', handler: 'Human' as const, status: 'Resolved' as const, callId: 'CALL-2998', dotColor: '#a855f7' },
    { time: '16:35', caller: 'Hina Khan', area: 'Gulberg • SP-LAH-44004', refNumber: 'SP-LAH-44004', handler: 'AI' as const, status: 'Resolved' as const, callId: 'CALL-2997', dotColor: '#a855f7' },
    { time: '19:20', caller: 'Waqar Ali', area: 'Cantt • SP-LAH-55005', refNumber: 'SP-LAH-55005', handler: 'AI' as const, status: 'Escalated' as const, callId: 'CALL-2996', dotColor: '#f97316' },
  ],
});

function HandlerBadge({ handler }: { handler: 'AI' | 'Human' | 'WA' }) {
  const cfg = {
    AI: { bg: '#10b981', text: 'AI' },
    Human: { bg: '#3b82f6', text: 'Human' },
    WA: { bg: '#16a34a', text: 'WA' },
  };
  const c = cfg[handler];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-sm" style={{ backgroundColor: c.bg, color: '#fff' }}>
      {c.text}
    </span>
  );
}

function StatusBadge({ status }: { status: 'Resolved' | 'Escalated' }) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-sm"
      style={{ backgroundColor: status === 'Resolved' ? '#10b981' : '#ef4444', color: '#fff' }}
    >
      {status}
    </span>
  );
}

export default function SubtypeDetail() {
  const { category: catId, subtype: subtypeId } = useParams();
  const navigate = useNavigate();

  const data = subtypeId
    ? (SUBTYPE_DATA[subtypeId] || DEFAULT_SUBTYPE(subtypeId, catId || ''))
    : DEFAULT_SUBTYPE('', '');

  const backPath = `/triage/${catId}`;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(backPath)}
        className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-md transition-all"
        style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
        
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.15)')}
      >
        ← {data.category}
      </button>

      <div>
        <h2 className="text-xl font-bold text-white">{data.name} — {data.category}</h2>
        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
          {data.totalCalls} calls • AI rate: {data.aiRate}%
        </p>
      </div>

      {/* 4-Card KPI */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Calls', value: data.totalCalls, color: '#a855f7' },
          { label: 'AI Handled', value: data.aiHandled, color: '#10b981' },
          { label: 'AI Rate', value: `${data.aiRate}%`, color: '#10b981' },
          { label: 'Human', value: data.human, color: '#f97316' },
        ].map(k => (
          <div key={k.label} className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Calls List */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f2937' }}>
          <h3 className="text-sm font-semibold text-white">Recent Calls — {data.name}</h3>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
          {data.recentCalls.map((call, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all"
              style={{ borderBottom: '1px solid #1a2030' }}
              
              
              onClick={() => navigate(`/triage/${catId}/${subtypeId}/${call.callId}`)}
            >
              {/* Dot */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: call.dotColor }}
              />
              {/* Time */}
              <span className="text-xs font-mono w-10 flex-shrink-0" style={{ color: '#6b7280' }}>
                {call.time}
              </span>
              {/* Name / Area */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-white">{call.caller}</span>
                <span className="text-sm" style={{ color: '#6b7280' }}> / {call.area}</span>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <HandlerBadge handler={call.handler} />
                <StatusBadge status={call.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
