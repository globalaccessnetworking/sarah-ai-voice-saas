// EscalationAnalysis.tsx — Root cause analysis of escalation
import { useParams } from 'react-router-dom';
import { getEscalationByCallId, escalations } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

export default function EscalationAnalysis() {
  const { callId } = useParams();
  const esc = callId ? getEscalationByCallId(callId) : escalations[0];
  if (!esc) return <div className="text-gray-500 p-8">Escalation not found</div>;

  const sentimentColor = esc.callerSentiment === 'Angry' || esc.callerSentiment === 'Frustrated' ? '#ef4444' : '#10b981';

  return (
    <div className="space-y-4">
      <BackButton label={`← ${esc.callId}`} to={`/escalations/${esc.callId}`} />
      <div>
        <h2 className="text-xl font-bold text-white">Escalation Analysis — {esc.callId}</h2>
      </div>

      {/* 4-Card KPI */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Reason</p>
          <p className="text-base font-bold" style={{ color: '#f97316' }}>{esc.reason}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>AI Confidence</p>
          <p className="text-2xl font-bold" style={{ color: '#f97316' }}>{esc.confidenceAtEscalation}%</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Caller Sentiment</p>
          <p className="text-xl font-bold" style={{ color: sentimentColor }}>{esc.callerSentiment}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Assigned To</p>
          <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>{esc.assignedTo}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Why AI Couldn't Handle */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Why AI Couldn't Handle</h3>
          {[
            { label: 'Primary Reason', value: esc.reason },
            { label: 'AI Confidence at Escalation', value: `${esc.confidenceAtEscalation}%` },
            { label: 'Conversation Turns Before Escalation', value: `${esc.conversationTurns} turns` },
            { label: 'Caller Escalation Request', value: esc.callerRequestedHuman ? 'Yes' : 'No' },
            { label: 'Repeat Caller', value: esc.repeatCaller ? `Yes (${esc.priorCalls} prior)` : 'Yes (0 prior)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Improvement Opportunity */}
        <div className="rounded-lg p-5 space-y-4 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white">Improvement Opportunity</h3>
          <div className="rounded p-4" style={{ borderLeft: '3px solid #a855f7', backgroundColor: 'rgba(168,85,247,0.08)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#a855f7' }}>AI Learning Note</p>
            <p className="text-xs" style={{ color: '#c4b5fd' }}>{esc.aiNote}</p>
          </div>
          <GreenActionButton label="View Agent Handoff →" to={`/escalations/${esc.callId}/analysis/handoff`} />
        </div>
      </div>
    </div>
  );
}
