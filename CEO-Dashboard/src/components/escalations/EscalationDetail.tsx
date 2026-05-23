// EscalationDetail.tsx — Escalation detail page
import { useParams } from 'react-router-dom';
import { getEscalationByCallId, escalations } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg px-4 py-3" style={{ backgroundColor: '#1a2030' }}>
      <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#6b7280' }}>{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

export default function EscalationDetail() {
  const { callId } = useParams();
  const esc = callId ? getEscalationByCallId(callId) : escalations[0];
  if (!esc) return <div className="text-gray-500 p-8">Escalation not found</div>;

  return (
    <div className="space-y-4">
      <BackButton label="← Escalation Queue" to="/escalations" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-white">{esc.callId}</h2>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#ef4444', color: '#fff' }}>Escalated</span>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{
          backgroundColor: esc.urgency === 'P2' ? '#f97316' : esc.urgency === 'P1' ? '#ef4444' : '#3b82f6',
          color: '#fff'
        }}>
          {esc.urgency} — {esc.urgency === 'P1' ? 'Critical' : esc.urgency === 'P2' ? 'High' : 'Medium'}
        </span>
      </div>

      {/* 7-Card Metadata Ribbon */}
      <div className="grid grid-cols-7 gap-2">
        <MetaCard label="Caller" value={esc.caller} />
        <MetaCard label="Area" value={esc.area} />
        <MetaCard label="Ref #" value={esc.refNumber} />
        <MetaCard label="Category" value={esc.category} />
        <MetaCard label="Reason" value={esc.reason} />
        <MetaCard label="Agent" value={esc.assignedTo} />
        <MetaCard label="Duration" value={esc.duration} />
      </div>

      {/* Escalation Summary */}
      <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-3">Escalation Summary</h3>
        <p className="text-sm" style={{ color: '#9ca3af' }}>
          Caller {esc.caller} contacted the system regarding a {esc.category} issue in {esc.area}. 
          After {esc.conversationTurns} conversation turns, the AI system escalated this call due to: 
          <span style={{ color: '#f97316' }}> {esc.reason}</span>. 
          The call has been assigned to <span style={{ color: '#10b981' }}>{esc.assignedTo}</span> for immediate resolution.
        </p>
      </div>

      {/* Action Buttons */}
      <GreenActionButton label="Analyze Escalation →" to={`/escalations/${esc.callId}/analysis`} />
    </div>
  );
}
