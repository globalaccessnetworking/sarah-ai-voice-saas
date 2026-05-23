// CallDetail.tsx — Call detail page (L1 nested from Live Feed or Agent Call Log)
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { calls, getCallById } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';
import KpiCard from '../shared/KpiCard';

function MetaRow({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #1a2030' }}>
      <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: valueColor || '#d1d5db' }}>{value}</span>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg px-4 py-3" style={{ backgroundColor: '#1a2030' }}>
      <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#6b7280' }}>{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

export default function CallDetail() {
  const { id, callId, agentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which call to show
  const resolvedCallId = id || callId;
  const call = resolvedCallId ? getCallById(resolvedCallId) : calls[0];
  if (!call) return <div className="text-gray-500 p-8">Call not found</div>;

  // Determine back path and transcript path
  const isFromAgent = location.pathname.includes('/agents/');
  const backPath = isFromAgent ? `/agents/${agentId}/calls` : '/';
  const backLabel = isFromAgent ? `← ${agentId}` : '← Live Feed';
  const transcriptPath = isFromAgent
    ? `/agents/${agentId}/calls/${call.callId}/transcript`
    : `/call/${call.callId}/transcript`;

  const sentimentColor = call.sentiment === 'Angry' || call.sentiment === 'Frustrated' ? '#ef4444' : '#10b981';

  return (
    <div className="space-y-4">
      {/* Back */}
      <BackButton label={backLabel} to={backPath} />

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <h2 className="text-2xl font-bold text-white">{call.callId}</h2>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#7c3aed', color: '#fff' }}>AI Handled</span>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{
          backgroundColor: call.priority === 'P2' ? '#f97316' : call.priority === 'P1' ? '#ef4444' : '#6b7280',
          color: '#fff'
        }}>
          {call.priority} — {call.priority === 'P1' ? 'Critical' : call.priority === 'P2' ? 'High' : call.priority === 'P3' ? 'Medium' : 'Low'}
        </span>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{
          backgroundColor: call.status === 'Resolved' ? '#10b981' : '#ef4444',
          color: '#fff'
        }}>
          {call.status}
        </span>
      </div>

      {/* 6-Card Metadata Ribbon */}
      <div className="grid grid-cols-6 gap-2">
        <MetaCard label="Caller" value={call.caller} />
        <MetaCard label="Channel" value={call.channel} />
        <MetaCard label="District" value={call.district} />
        <MetaCard label="Area" value={call.area} />
        <MetaCard label="Ref #" value={call.refNumber} />
        <MetaCard label="Category" value={call.category} />
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Call Metadata */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-3">Call Metadata</h3>
          <MetaRow label="Timestamp" value={call.timestamp} />
          <MetaRow label="Channel" value={call.channel} />
          <MetaRow label="Area" value={call.area} />
          <MetaRow label="Ref #" value={call.refNumber} />
          <MetaRow label="Language" value={call.language} />
          <MetaRow label="Sentiment" value={call.sentiment} valueColor={sentimentColor} />
          <MetaRow label="AI Model" value={call.aiModel} />
          <MetaRow label="Confidence" value={`${call.confidence}%`} />
          <MetaRow label="Cost Saved" value={`PKR ${call.costSaved}`} />
          <MetaRow label="Repeat Caller" value={call.repeatCaller ? 'Yes' : 'No'} />
          <MetaRow label="Prior Complaints" value={call.priorComplaints} />
        </div>

        {/* Right: AI Processing Summary */}
        <div className="space-y-4">
          <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-3">AI Processing Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded p-3 text-center" style={{ backgroundColor: '#1a2030' }}>
                <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Intent</p>
                <p className="text-lg font-bold" style={{ color: '#10b981' }}>{call.intentScore}%</p>
              </div>
              <div className="rounded p-3 text-center" style={{ backgroundColor: '#1a2030' }}>
                <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Entities</p>
                <p className="text-lg font-bold" style={{ color: '#6b7280' }}>{call.entities}</p>
              </div>
              <div className="rounded p-3 text-center" style={{ backgroundColor: '#1a2030' }}>
                <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Sentiment</p>
                <p className="text-lg font-bold" style={{ color: sentimentColor }}>{call.sentimentScore.toFixed(2)}</p>
              </div>
              <div className="rounded p-3 text-center" style={{ backgroundColor: '#1a2030' }}>
                <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Latency</p>
                <p className="text-lg font-bold" style={{ color: '#6b7280' }}>{call.latency}ms</p>
              </div>
            </div>

            {/* Classification path */}
            <div className="mt-4 rounded p-3" style={{ borderLeft: '3px solid #a855f7', backgroundColor: 'rgba(168,85,247,0.08)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#a855f7' }}>Classification Path</p>
              <p className="text-xs" style={{ color: '#d1d5db' }}>{call.classificationPath}</p>
            </div>

            {/* Escalation block */}
            {call.status === 'Escalated' && call.escalationReason && (
              <div className="mt-3 rounded p-3" style={{ borderLeft: '3px solid #ef4444', backgroundColor: 'rgba(239,68,68,0.08)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#ef4444' }}>Escalation</p>
                <p className="text-xs" style={{ color: '#fca5a5' }}>Reason: {call.escalationReason}</p>
                <p className="text-xs" style={{ color: '#fca5a5' }}>Assigned to: {call.escalationAssignedTo}</p>
              </div>
            )}
          </div>

          {/* WhatsApp Image Analysis (conditional) */}
          {call.whatsappImage && (
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-card-bg)', borderLeft: '3px solid #a855f7' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">📋</span>
                <h3 className="text-sm font-semibold text-white">WhatsApp Image Analysis</h3>
                <span className="text-xs px-2 py-0.5 rounded-sm font-bold" style={{ backgroundColor: '#7c3aed', color: '#fff' }}>
                  SP-Vision-v1.4
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Detection', value: call.whatsappImage.detection },
                  { label: 'Confidence', value: `${call.whatsappImage.confidence}%`, color: '#10b981' },
                  { label: 'Severity', value: call.whatsappImage.severity, color: call.whatsappImage.severity === 'High' ? '#ef4444' : '#f97316' },
                  { label: 'Auto-Category', value: call.whatsappImage.autoCategory, color: '#a855f7' },
                ].map(item => (
                  <div key={item.label} className="rounded p-2 text-center" style={{ backgroundColor: '#1a2030' }}>
                    <p className="text-xs mb-1" style={{ color: '#6b7280' }}>{item.label}</p>
                    <p className="text-xs font-bold" style={{ color: item.color || '#d1d5db' }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Detected Objects</p>
                <div className="flex gap-2 flex-wrap">
                  {call.whatsappImage.detectedObjects.map(obj => (
                    <span key={obj} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1e3a2f', color: '#10b981' }}>{obj}</span>
                  ))}
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                📍 Geo-tag: {call.whatsappImage.geoTag}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <GreenActionButton label="View Full Transcript →" to={transcriptPath} />
    </div>
  );
}
