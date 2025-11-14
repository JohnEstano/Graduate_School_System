import React from 'react';
import { Paperclip as DefaultIcon } from 'lucide-react';

type Props = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string; // e.g. 'bg-emerald-50'
  deltaLabel?: string; // small badge content (e.g. '57%')
  deltaType?: 'up' | 'down' | 'neutral';
};

export default function KpiCard({
  label,
  value,
  icon,
  sub,
  accent,
  deltaLabel,
  deltaType = 'neutral',
}: Props) {
  const deltaStyles =
    deltaType === 'up'
      ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
      : deltaType === 'down'
      ? 'text-rose-700 bg-rose-100 border-rose-200'
      : 'text-zinc-700 bg-zinc-100 border-zinc-200';

  const deltaGlyph = deltaType === 'up' ? '↑' : deltaType === 'down' ? '↓' : '–';

  return (
    <div className="rounded-md border p-3 flex items-start gap-3" role="region" aria-label={label}>
      <div className={`p-2 rounded-md ${accent ?? 'bg-zinc-50'} border border-zinc-100`}>
        {icon ?? <DefaultIcon className="h-5 w-5 text-zinc-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          {typeof deltaLabel !== 'undefined' && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] leading-none ${deltaStyles}`}>
              {deltaGlyph} {deltaLabel}
            </span>
          )}
        </div>
        <div className="text-lg font-semibold mt-0.5">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}