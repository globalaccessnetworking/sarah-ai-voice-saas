import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VoiceShell from './components/voice/VoiceShell';

// ─── Tab Views ────────────────────────────────────────────────────────────────
import LiveCallMonitor from './components/live/LiveCallMonitor';

// Tab 2 — AI Triage Engine (full 5-level chain)
import TriageEngine from './components/triage/TriageEngine';
import CategoryDetail from './components/triage/CategoryDetail';
import SubtypeDetail from './components/triage/SubtypeDetail';
import TriageTranscript from './components/triage/TriageTranscript';
import TriageNLPAnalysis from './components/triage/TriageNLPAnalysis';
import ResolutionChainTriage from './components/triage/ResolutionChainTriage';
import FullAuditLog from './components/triage/FullAuditLog';

// Tab 3 — Agent Performance
import AgentRoster from './components/agents/AgentRoster';
import AgentDetail from './components/agents/AgentDetail';
import AgentCallLog from './components/agents/AgentCallLog';
import AgentNLPAnalysis from './components/agents/AgentNLPAnalysis';
import AgentResolutionChain from './components/agents/AgentResolutionChain';
import AgentFullAuditLog from './components/agents/AgentFullAuditLog';

// Tab 4 — Call Analytics
import CallAnalytics from './components/analytics/CallAnalytics';
import DistrictDetail from './components/analytics/DistrictDetail';
import AreaDetail from './components/analytics/AreaDetail';
import AnalyticsNLPAnalysis from './components/analytics/AnalyticsNLPAnalysis';
import AnalyticsResolutionChain from './components/analytics/AnalyticsResolutionChain';
import AnalyticsAuditLog from './components/analytics/AnalyticsAuditLog';

// Tab 5 — Escalation Queue
import EscalationQueue from './components/escalations/EscalationQueue';
import EscalationDetail from './components/escalations/EscalationDetail';
import EscalationAnalysis from './components/escalations/EscalationAnalysis';
import AgentHandoff from './components/escalations/AgentHandoff';
import EscalationResolutionChain from './components/escalations/EscalationResolutionChain';
import EscalationAuditLog from './components/escalations/EscalationAuditLog';

// Tab 6 — Cost & ROI
import CostROI from './components/cost/CostROI';
import MonthBreakdown from './components/cost/MonthBreakdown';
import CostDetail from './components/cost/CostDetail';
import RoiProjection from './components/cost/RoiProjection';

// Tab 7 — Complaint Registry
import ComplaintRegistry from './components/registry/ComplaintRegistry';

// Tab 8 — Verification Registry
import VerificationRegistry from './components/registry/VerificationRegistry';

// Tab 9 — Outbound HUD
import OutboundHud from './components/voice/outbound/OutboundHud';

// ─── Shared Call Chain Views (Live Feed + Agent path) ─────────────────────────
import CallDetail from './components/call/CallDetail';
import Transcript from './components/call/Transcript';
import NLPAnalysis from './components/call/NLPAnalysis';
import ResolutionChain from './components/call/ResolutionChain';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<VoiceShell />}>

          {/* ══════════════════════════════════════════════════
              TAB 1 — Live Call Monitor
          ════════════════════════════════════════════════════ */}
          <Route index element={<LiveCallMonitor />} />

          {/* Call detail chain from Live Feed */}
          <Route path="call/:id" element={<CallDetail />} />
          <Route path="call/:id/transcript" element={<Transcript />} />
          <Route path="call/:id/transcript/nlp" element={<NLPAnalysis />} />
          <Route path="call/:id/transcript/nlp/resolution" element={<ResolutionChain />} />

          {/* ══════════════════════════════════════════════════
              TAB 2 — AI Triage Engine (5-level deep chain)
              /triage
              /triage/:category
              /triage/:category/:subtype
              /triage/:category/:subtype/:callId          ← Transcript
              /triage/:category/:subtype/:callId/nlp
              /triage/:category/:subtype/:callId/nlp/resolution
              /triage/:category/:subtype/:callId/nlp/resolution/audit
          ════════════════════════════════════════════════════ */}
          <Route path="triage" element={<TriageEngine />} />
          <Route path="triage/:category" element={<CategoryDetail />} />
          <Route path="triage/:category/:subtype" element={<SubtypeDetail />} />
          <Route path="triage/:category/:subtype/:callId" element={<TriageTranscript />} />
          <Route path="triage/:category/:subtype/:callId/nlp" element={<TriageNLPAnalysis />} />
          <Route path="triage/:category/:subtype/:callId/nlp/resolution" element={<ResolutionChainTriage />} />
          <Route path="triage/:category/:subtype/:callId/nlp/resolution/audit" element={<FullAuditLog />} />

          {/* ══════════════════════════════════════════════════
              TAB 3 — Agent Performance (4-level chain)
          ════════════════════════════════════════════════════ */}
          <Route path="agents" element={<AgentRoster />} />
          <Route path="agents/:agentId" element={<AgentDetail />} />
          <Route path="agents/:agentId/calls" element={<AgentCallLog />} />

          {/* Agent call path: CallLog → NLP → Resolution Chain → Full Audit Log */}
          <Route path="agents/:agentId/calls/:callId/nlp" element={<AgentNLPAnalysis />} />
          <Route path="agents/:agentId/calls/:callId/nlp/resolution" element={<AgentResolutionChain />} />
          <Route path="agents/:agentId/calls/:callId/nlp/resolution/audit" element={<AgentFullAuditLog />} />

          {/* ══════════════════════════════════════════════════
              TAB 4 — Call Analytics (6-level chain)
              /analytics
              /analytics/:district
              /analytics/:district/:area
              /analytics/:district/:area/:callId/nlp
              /analytics/:district/:area/:callId/nlp/resolution
              /analytics/:district/:area/:callId/nlp/resolution/audit
          ════════════════════════════════════════════════════ */}
          <Route path="analytics" element={<CallAnalytics />} />
          <Route path="analytics/:district" element={<DistrictDetail />} />
          <Route path="analytics/:district/:area" element={<AreaDetail />} />
          <Route path="analytics/:district/:area/:callId/nlp" element={<AnalyticsNLPAnalysis />} />
          <Route path="analytics/:district/:area/:callId/nlp/resolution" element={<AnalyticsResolutionChain />} />
          <Route path="analytics/:district/:area/:callId/nlp/resolution/audit" element={<AnalyticsAuditLog />} />

          {/* ══════════════════════════════════════════════════
              TAB 5 — Escalation Queue (6-level chain)
              /escalations
              /escalations/:callId
              /escalations/:callId/analysis
              /escalations/:callId/analysis/handoff
              /escalations/:callId/analysis/handoff/resolution
              /escalations/:callId/analysis/handoff/resolution/audit
          ════════════════════════════════════════════════════ */}
          <Route path="escalations" element={<EscalationQueue />} />
          <Route path="escalations/:callId" element={<EscalationDetail />} />
          <Route path="escalations/:callId/analysis" element={<EscalationAnalysis />} />
          <Route path="escalations/:callId/analysis/handoff" element={<AgentHandoff />} />
          <Route path="escalations/:callId/analysis/handoff/resolution" element={<EscalationResolutionChain />} />
          <Route path="escalations/:callId/analysis/handoff/resolution/audit" element={<EscalationAuditLog />} />

          {/* ══════════════════════════════════════════════════
              TAB 6 — Cost & ROI (4-level chain)
              /cost
              /cost/month/:month
              /cost/month/:month/detail
              /cost/month/:month/detail/projection
          ════════════════════════════════════════════════════ */}
          <Route path="cost" element={<CostROI />} />
          <Route path="cost/month/:month" element={<MonthBreakdown />} />
          <Route path="cost/month/:month/detail" element={<CostDetail />} />
          <Route path="cost/month/:month/detail/projection" element={<RoiProjection />} />

          {/* ══════════════════════════════════════════════════
              TAB 7 — Complaint Registry (Master DB)
              /registry
          ════════════════════════════════════════════════════ */}
          <Route path="registry" element={<ComplaintRegistry />} />

          {/* ══════════════════════════════════════════════════
              TAB 8 — Verification Registry
              /verifications
          ════════════════════════════════════════════════════ */}
          <Route path="verifications" element={<VerificationRegistry />} />

          {/* ══════════════════════════════════════════════════
              TAB 9 — Outbound HUD
              /outbound
          ════════════════════════════════════════════════════ */}
          <Route path="outbound" element={<OutboundHud />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
