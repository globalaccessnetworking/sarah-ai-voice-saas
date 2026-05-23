// Breadcrumb.tsx — Back button + breadcrumb trail
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BreadcrumbProps {
  items: { label: string; path?: string }[];
  backLabel?: string;
  backPath?: string;
}

export default function Breadcrumb({ items, backLabel, backPath }: BreadcrumbProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Breadcrumb trail at top */}
      <div className="flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span style={{ color: '#374151' }}>›</span>}
            {item.path ? (
              <button
                onClick={() => navigate(item.path!)}
                className="hover:text-gray-300 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span style={{ color: '#10b981' }}>{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BackButton({ label, to }: { label: string; to: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 mb-6"
      style={{ backgroundColor: '#1f2937', color: '#10b981', border: '1px solid #374151' }}
      
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1f2937')}
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  );
}
