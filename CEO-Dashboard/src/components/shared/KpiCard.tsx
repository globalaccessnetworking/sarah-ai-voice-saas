// KpiCard.tsx — Reusable KPI metric card
interface KpiCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  className?: string;
}

export default function KpiCard({ label, value, valueColor = '#10b981', className = '' }: KpiCardProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg p-4 bg-[#111827] border border-gray-800 rounded-xl ${className}`}
    >
      <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#6b7280' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}
