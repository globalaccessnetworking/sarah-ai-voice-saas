// ResolutionChain.tsx — Complete System Audit Log / Resolution Chain timeline
import { useParams, useLocation } from 'react-router-dom';
import { getCallById, calls, resolutionChainSteps } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';

const dotColors: Record<string, string> = {
  green: '#10b981',
  blue: '#3b82f6',
  purple: '#a855f7',
};

const systemTagColors: Record<string, string> = {
  SYSTEM_READY: '#10b981',
  STT_ENGINE: '#3b82f6',
  NLU_ENGINE: '#a855f7',
  LLM_TRIAGE: '#f97316',
  CRM_API: '#10b981',
  DISPATCH_SYS: '#3b82f6',
  CONV_AI: '#a855f7',
  FINAL_EXIT: '#10b981',
};

export default function ResolutionChain() {
  const { id, callId, agentId } = useParams();
  const location = useLocation();
  const resolvedId = id || callId;
  const call = resolvedId ? getCallById(resolvedId) : calls[0];

  if (!call) return <div className="text-gray-500 p-8">Call not found</div>;

  const isFromAgent = location.pathname.includes('/agents/');
  const backPath = isFromAgent
    ? `/agents/${agentId}/calls/${call.callId}/transcript/nlp`
    : `/call/${call.callId}/transcript/nlp`;

  return (
    <div className="space-y-4">
      <BackButton label="← NLP Analysis" to={backPath} />
      <div>
        <h2 className="text-xl font-bold text-white">Complete System Audit Log</h2>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Resolution Chain for {call.callId}</p>
      </div>

      {/* Timeline */}
      <div className="rounded-lg p-6 bg-[#111827] border border-gray-800 rounded-xl">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-4 bottom-4 w-0.5" style={{ backgroundColor: '#1f2937' }} />

          <div className="space-y-0">
            {resolutionChainSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 relative pb-6">
                {/* Dot */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-1 z-10"
                  style={{ backgroundColor: dotColors[step.color], border: `2px solid ${dotColors[step.color]}44` }}
                />
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" style={{ color: '#6b7280' }}>{step.time}</span>
                        <h4 className="text-sm font-bold text-white">{step.title}</h4>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{step.subtitle}</p>
                    </div>
                    {/* System tag */}
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                      style={{
                        color: systemTagColors[step.system] || '#6b7280',
                        backgroundColor: (systemTagColors[step.system] || '#6b7280') + '15',
                        border: `1px solid ${(systemTagColors[step.system] || '#6b7280')}30`,
                      }}
                    >
                      {step.system}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
