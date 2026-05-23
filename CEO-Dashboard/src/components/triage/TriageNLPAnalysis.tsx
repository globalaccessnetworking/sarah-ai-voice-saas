// TriageNLPAnalysis.tsx — NLP Analysis page from Triage path (triage-aware routing)
import { useParams } from 'react-router-dom';
import { getCallById, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

function ModelBar({ name, percent }: { name: string; percent: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 flex-shrink-0" style={{ color: '#d1d5db' }}>{name}</span>
      <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: '#1f2937' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${percent}%`, backgroundColor: '#10b981' }} />
      </div>
      <span className="text-xs w-10 text-right" style={{ color: '#10b981' }}>{percent}%</span>
    </div>
  );
}

export default function TriageNLPAnalysis() {
  const { category: catId, subtype: subtypeId, callId } = useParams();
  const call = callId ? getCallById(callId) : calls[0];

  if (!call) return <div className="text-gray-500 p-8">Call not found</div>;

  const backPath = `/triage/${catId}/${subtypeId}/${call.callId}`;
  const resolutionPath = `/triage/${catId}/${subtypeId}/${call.callId}/nlp/resolution`;

  const intentColor = call.intentScore >= 85 ? '#10b981' : '#f97316';
  const sentimentColor = call.sentimentScore < 0 ? '#ef4444' : '#10b981';

  return (
    <div className="space-y-4">
      <BackButton label="← Transcript" to={backPath} />
      <h2 className="text-xl font-bold text-white">NLP Analysis — {call.callId}</h2>

      {/* 4-Card KPI */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Intent Confidence</p>
          <p className="text-2xl font-bold" style={{ color: intentColor }}>{call.intentScore}.0%</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Sentiment Score</p>
          <p className="text-2xl font-bold" style={{ color: sentimentColor }}>{call.sentimentScore.toFixed(2)}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Category Match</p>
          <p className="text-xl font-bold" style={{ color: '#a855f7' }}>{call.category}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Language</p>
          <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{call.language}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Entity Extraction */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Entity Extraction</h3>
          {[
            { label: 'Category', value: call.category },
            { label: 'Location', value: `${call.district} — ${call.area}` },
            { label: 'Urgency', value: `${call.priority} — ${call.priority === 'P1' ? 'Critical' : call.priority === 'P2' ? 'High' : call.priority === 'P3' ? 'Medium' : 'Low'}` },
            { label: 'Key Phrases', value: call.category === 'Missed Collection' ? 'sweeper, absent, dirty' : call.category === 'Street Sweeping' ? 'dirty, unswept, dust' : call.category === 'Dead Animal' ? 'dead, carcass, road' : 'waste, dumping, illegal' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Model Performance */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Model Performance on This Call</h3>
          <div className="space-y-4">
            <ModelBar name="SP-Voice-v3.2" percent={96} />
            <ModelBar name="SP-NLU-v2.6" percent={99} />
            <ModelBar name="SP-Triage-v4.1" percent={96} />
            <ModelBar name="SP-Vision-v1.4" percent={91} />
          </div>
          <p className="text-xs mt-4" style={{ color: '#4b5563' }}>
            Latency: {call.latency}ms • Tokens: {call.latency * 4}
          </p>
        </div>
      </div>

      <GreenActionButton label="View Resolution Chain →" to={resolutionPath} />
    </div>
  );
}
