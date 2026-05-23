// CostROI.tsx — Tab 6: Cost & ROI with clickable bar chart
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { costData } from '../../data/mockData';
import KpiCard from '../shared/KpiCard';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface TooltipState {
  visible: boolean;
  month: string;
  monthIdx: number;
  x: number;
  y: number;
}

export default function CostROI() {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, month: '', monthIdx: 0, x: 0, y: 0 });
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const chartData = costData.monthNames.map((m, i) => ({ month: m, savings: costData.monthlyTrend[i] }));

  const CustomBar = (props: any) => {
    const { x, y, width, height, index } = props;
    const isActive = activeBar === index;
    return (
      <rect
        x={x} y={y} width={width} height={height}
        fill={isActive ? '#34d399' : '#10b981'}
        rx={3} ry={3}
        style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
        onClick={() => {
          navigate(`/cost/month/${costData.monthNames[index].toLowerCase()}`);
        }}
        onMouseEnter={() => setActiveBar(index)}
        onMouseLeave={() => setActiveBar(null)}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-6 gap-3">
        <KpiCard label="Old Monthly" value="PKR 6.8M" valueColor="#ef4444" />
        <KpiCard label="New Monthly" value="PKR 1.9M" valueColor="#10b981" />
        <KpiCard label="Monthly Savings" value="PKR 4.8M" valueColor="#10b981" />
        <KpiCard label="Annual Savings" value="PKR 58.2M" valueColor="#10b981" />
        <KpiCard label="Agents Reduced" value="150 → 20" valueColor="#a855f7" />
        <KpiCard label="ROI" value="1021%" valueColor="#10b981" />
      </div>

      {/* Monthly Savings Trajectory Chart */}
      <div className="rounded-lg p-5 relative bg-[#111827] border border-gray-800 rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-4">Monthly Savings Trajectory</h3>
        <p className="text-xs mb-3" style={{ color: '#6b7280' }}>Click any bar to view monthly breakdown</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={52}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis hide />
            <Bar dataKey="savings" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>

        {/* Click instruction */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#10b981' }} />
          <span className="text-xs" style={{ color: '#6b7280' }}>Monthly Savings (PKR M) — Click bar for breakdown →</span>
        </div>
      </div>

      {/* Two comparison panels */}
      <div className="grid grid-cols-2 gap-4">
        {/* Old Model */}
        <div className="rounded-lg p-5" style={{ backgroundColor: '#111827', borderLeft: '3px solid #ef4444' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#ef4444' }}>Old Model — 150 Agents</h3>
          {[
            { label: 'Monthly Salaries', value: `PKR ${costData.oldModel.salaries}M` },
            { label: 'Infrastructure', value: `PKR ${costData.oldModel.infrastructure}M` },
            { label: 'Training & QA', value: `PKR ${costData.oldModel.trainingQA}M` },
            { label: 'Total Monthly', value: `PKR ${costData.oldModel.total}M`, bold: true },
            { label: 'Cost per Call', value: `PKR ${costData.oldModel.costPerCall}`, bold: true },
          ].map(({ label, value, bold }) => (
            <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color: '#ef4444' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* New Model */}
        <div className="rounded-lg p-5" style={{ backgroundColor: '#111827', borderLeft: '3px solid #10b981' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#10b981' }}>New Model — 20 Agents + AI</h3>
          {[
            { label: 'Agent Salaries (20×55K)', value: `PKR ${costData.newModel.agentSalaries}M` },
            { label: 'AI Platform', value: `PKR ${costData.newModel.aiPlatform}M` },
            { label: 'Infrastructure', value: `PKR ${costData.newModel.infrastructure}M` },
            { label: 'Total Monthly', value: `PKR ${costData.newModel.total}M`, bold: true },
            { label: 'Cost per Call', value: `PKR ${costData.newModel.costPerCall}`, bold: true },
          ].map(({ label, value, bold }) => (
            <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color: '#10b981' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
