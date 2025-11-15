import React, { useMemo, useState, useEffect, useDeferredValue } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Paperclip,
  Search,
  Users,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import TableCompreExam from './table-compre-exam';
import { PaperclipIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
// add dialog ui
// (Insights removed: dialog & chart imports deleted)

export type CompreExamApplicationSummary = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  school_id: string | null;
  program: string | null;
  eligible: boolean;
  lacking: string[]; // e.g., ["Grades","Documents","Outstanding Balance"]
  applied: boolean;
  application_id?: number | null;
  submitted_at: string | null; // ISO
  application_status: 'approved' | 'pending' | 'rejected' | 'not_yet_applied';
  permit_status: 'approved' | 'pending' | 'rejected' | null;
};

type PageProps = {
  programs: string[];
  eligible: CompreExamApplicationSummary[];
  notEligible: CompreExamApplicationSummary[];
  counts?: { eligible: number; notEligible: number };
};

export default function CoordinatorCompreExamIndex() {
  const { props } = usePage<PageProps>();
  const { programs = [], eligible = [], notEligible = [] } = props;

  const [q, setQ] = useState('');
  // search: defer like payments page for smoother typing
  const dq = useDeferredValue(q);
  // insights removed

  const data = [...eligible, ...notEligible];

  // --- Richer metrics for the KPI strip
  const metrics = useMemo(() => {
    const all = [...eligible, ...notEligible];
    const total = all.length;

    const applied = all.filter((a) => a.applied).length;
    const accepted = all.filter((a) => (a.application_status || 'not_yet_applied') === 'approved').length;
    const rejected = all.filter((a) => (a.application_status || 'not_yet_applied') === 'rejected').length;
    const pending = all.filter((a) => (a.application_status || 'not_yet_applied') === 'pending').length;
    const notYetApplied = all.filter((a) => (a.application_status || 'not_yet_applied') === 'not_yet_applied').length;

    const appliedPct = total ? Math.round((applied / total) * 100) : 0;
    const acceptRate = applied ? Math.round((accepted / applied) * 100) : 0;

    return {
      total,
      applied,
      appliedPct,
      eligibleCount: eligible.length,
      notEligibleCount: notEligible.length,
      accepted,
      rejected,
      pending,
      notYetApplied,
      acceptRate,
    };
  }, [eligible, notEligible]);

  // --- (1) Progress & Readiness: Eligibility breakdown + trend ---
  const lackingBreakdown = useMemo(() => {
    // Count lacking categories across NOT eligible students
    const counts: Record<string, number> = {};
    notEligible.forEach((s) => {
      (s.lacking || []).forEach((k) => {
        const key = normalizeLacking(k);
        counts[key] = (counts[key] ?? 0) + 1;
      });
    });

    // Ensure stable order and friendly labels
    const order = ['Grades', 'Documents', 'Outstanding Balance', 'Other'];
    const entries = Object.entries(counts).map(([k, v]) => ({ key: k, label: k, value: v }));
    const byKey = entries.reduce<Record<string, number>>((acc, x) => {
      acc[x.key] = x.value;
      return acc;
    }, {});
    const ordered = order
      .filter((k) => byKey[k] !== undefined)
      .map((k) => ({ key: k, label: k, value: byKey[k] }));

    const total = ordered.reduce((s, x) => s + x.value, 0);

    return { items: ordered, total };
  }, [notEligible]);

  const readinessTrend = useMemo(() => {
    // Weekly count of "eligible students" by submitted_at week (or just eligible flag date-less)
    // We’ll bucket by ISO week (Mon-Sun). If submitted_at is null but eligible is true, we skip.
    const weekKey = (iso: string) => {
      const d = new Date(iso);
      // get Monday of week
      const day = (d.getDay() + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day);
      monday.setHours(0, 0, 0, 0);
      return monday.toISOString().slice(0, 10);
    };

    const map: Record<string, number> = {};
    eligible.forEach((s) => {
      if (s.submitted_at) {
        const k = weekKey(s.submitted_at);
        map[k] = (map[k] ?? 0) + 1;
      }
    });

    // Convert to sorted array (last 8 weeks)
    const keys = Object.keys(map).sort();
    const last = keys.slice(-8);
    const series = last.map((k) => ({ weekStart: k, count: map[k] }));

    const max = series.length ? Math.max(...series.map((p) => p.count)) : 0;
    return { series, max };
  }, [eligible]);
  

  // Filtered list (like payments page)
  const filtered = useMemo(() => {
    const query = dq.trim().toLowerCase();
    if (!query) return data;
    return data.filter((r) =>
      [r.first_name, r.middle_name || '', r.last_name, r.email || '', r.school_id || '', r.program || '']
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [data, dq]);
  
  const columns = { student: true, program: true, eligibility: true, applied: true, appStatus: true, actions: true };

  // Pagination (copied from payments page)
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    setPage(1); // reset when search changes
  }, [dq]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  // --- (3) Student-Centric: table of students with missing requirements (view-only)
  const studentsWithMissing = useMemo(() => {
    // Flatten notEligible into rows with a joined "missing" column
    return notEligible
      .map((s) => ({
        id: s.id,
        name: [s.last_name, s.first_name, s.middle_name].filter(Boolean).join(', '),
        program: s.program || '',
        school_id: s.school_id || '',
        missing: (s.lacking || []).map(normalizeLacking).join(', ') || '—',
        lastUpdate: s.submitted_at ? new Date(s.submitted_at) : null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [notEligible]);

  return (
    <AppLayout>
      <Head title="Comprehensive Exam — Coordinator" />

      <div className="px-6 py-6">
        {/* Top header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200">
              <PaperclipIcon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-6">Comprehensive Exam Applications</h1>
              <p className="text-sm text-muted-foreground">
                View readiness and missing requirements at a glance. (Coordinator has view-only access.)
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative w-80">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search students, program, school ID..."
                className="pl-10 h-9"
                aria-label="Search students"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              {q && (
                <button
                  onClick={() => setQ('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-2.5 text-white hover:bg-rose-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Insights button removed */}
          </div>
        </div>

        {/* KPI strip stays visible (table is the highlight below) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <CardKPI
            label="Students in scope"
            value={metrics.total}
            accent="bg-zinc-50"
            icon={<Users className="h-4 w-4" />}
            sub={`${metrics.eligibleCount} eligible • ${metrics.notEligibleCount} not eligible`}
          />

          <CardKPI
            label="Applied"
            value={metrics.applied}
            accent="bg-amber-50"
            icon={<Paperclip className="h-4 w-4" />}
            sub={`${metrics.appliedPct}% of total`}
            deltaLabel={`${metrics.appliedPct}%`}
            deltaType={metrics.appliedPct === 0 ? 'neutral' : 'up'}
          />

          <CardKPI
            label="Accepted"
            value={metrics.accepted}
            accent="bg-emerald-50"
            icon={<Check className="h-4 w-4" />}
            sub={`Accept rate ${metrics.acceptRate}%`}
            deltaLabel={`${metrics.acceptRate}%`}
            deltaType={metrics.acceptRate >= 50 ? 'up' : metrics.acceptRate === 0 ? 'neutral' : 'down'}
          />

          <CardKPI
            label="Pending"
            value={metrics.pending}
            accent="bg-sky-50"
            icon={<Paperclip className="h-4 w-4" />}
            sub="Awaiting review"
            deltaLabel="–"
            deltaType="neutral"
          />

          <CardKPI
            label="Rejected"
            value={metrics.rejected}
            accent="bg-rose-50"
            icon={<X className="h-4 w-4" />}
            sub="Needs re-check"
            deltaLabel={metrics.rejected ? `${metrics.rejected}` : '–'}
            deltaType={metrics.rejected ? 'down' : 'neutral'}
          />

          <CardKPI
            label="Not yet applied"
            value={metrics.notYetApplied}
            accent="bg-zinc-50"
            icon={<ChevronRightIcon className="h-4 w-4" />}
            sub="Nudge candidates"
            deltaLabel={metrics.notYetApplied ? `${metrics.notYetApplied}` : '–'}
            deltaType={metrics.notYetApplied ? 'down' : 'neutral'}
          />
        </div>

        {/* Table container (highlight) */}
        <div className="mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 rounded-lg">
          <div>
            <TableCompreExam paged={pageItems} columns={columns} />
          </div>

          {/* footer */}
          <div className="px-1 py-1 border-t border-zinc-100 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Showing {total} students</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Insights removed */}
      </div>
      {/* Toasts for bottom-right success messages */}
      <Toaster position="bottom-right" duration={5000} richColors closeButton />
    </AppLayout>
  );
}

/* ---------- Helpers & Presentational Components ---------- */

function normalizeLacking(k: string) {
  const s = (k || '').toString().trim().toLowerCase();
  if (s.includes('grade')) return 'Grades';
  if (s.includes('document')) return 'Documents';
  if (s.includes('balance') || s.includes('outstanding')) return 'Outstanding Balance';
  return 'Other';
}

// colorForIndex removed with insights

/** Simple donut (SVG) */
// function EligibilityDonut({ items, total }: { items: { key: string; label: string; value: number }[]; total: number }) {
//   const size = 160;
//   const stroke = 18;
//   const r = (size - stroke) / 2;
//   const C = 2 * Math.PI * r;

//   let offset = 0;
//   const arcs = items.map((it, idx) => {
//     const frac = total ? it.value / total : 0;
//     const len = frac * C;
//     const dasharray = `${len} ${C - len}`;
//     const dashoffset = C - offset;
//     offset += len;
//     return (
//       <circle
//         key={it.key}
//         r={r}
//         cx={size / 2}
//         cy={size / 2}
//         fill="transparent"
//         strokeWidth={stroke}
//         className={colorForIndex(idx)}
//         strokeDasharray={dasharray}
//         strokeDashoffset={dashoffset}
//         transform={`rotate(-90 ${size / 2} ${size / 2})`}
//       />
//     );
//   });

//   return (
//     <div className="flex items-center gap-4">
//       <svg width={size} height={size} className="shrink-0">
//         <circle r={r} cx={size / 2} cy={size / 2} fill="transparent" strokeWidth={stroke} className="text-zinc-100" stroke="currentColor" />
//         {arcs}
//         <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-zinc-700 text-sm font-semibold">
//           {total || 0}
//         </text>
//       </svg>
//       <div className="text-xs text-zinc-600">
//         Missing items across not-eligible students. Use to prioritize interventions (docs, grades, or balances).
//       </div>
//     </div>
//   );
// }

// replace EligibilityDonut with a Recharts Pie
// EligibilityDonut removed with insights

// replace MiniBarChart with a Recharts BarChart
// MiniBarChart removed with insights

function CardKPI({
  label,
  value,
  accent,
  icon,
  sub,
  deltaLabel,
  deltaType = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
  sub?: React.ReactNode;
  deltaLabel?: string;
  deltaType?: 'up' | 'down' | 'neutral';
}) {
  const deltaStyles =
    deltaType === 'up'
      ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
      : deltaType === 'down'
      ? 'text-rose-700 bg-rose-100 border-rose-200'
      : 'text-zinc-700 bg-zinc-100 border-zinc-200';

  const deltaGlyph = deltaType === 'up' ? '↑' : deltaType === 'down' ? '↓' : '–';

  return (
    <div className="rounded-md border p-3 flex items-start gap-3" role="region" aria-label={label}>
      <div className={`p-2 rounded-md ${accent ?? 'bg-zinc-50'} border border-zinc-100`}>{icon ?? <Paperclip className="h-5 w-5 text-zinc-600" />}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">{label}</div>
          {deltaLabel !== undefined && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] leading-none ${deltaStyles}`}>
              {deltaGlyph} {deltaLabel}
            </span>
          )}
        </div>
        <div className="text-xl font-semibold mt-0.5">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
