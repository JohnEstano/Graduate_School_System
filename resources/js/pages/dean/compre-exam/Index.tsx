import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UIC_PROGRAMS } from '@/constants/programs';
import TableDeanCompreExam, { type CompreExamApplicationSummary } from './table-dean-compre-exam';
import { Badge } from '@/components/ui/badge';
import { Search, PaperclipIcon, Check, CircleX, Timer, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Toaster } from '@/components/ui/sonner';

type Row = {
  application_id: number;
  first_name: string; middle_name?: string|null; last_name: string;
  email?: string|null; school_id?: string|number;
  program: string; school_year: string;
  created_at: string | null;
  subjects_count?: number;
  registrar_status?: string | null;
  final_approval_status?: 'pending'|'approved'|'rejected'|null;
  final_approval_date?: string|null;
  final_approval_reason?: string|null;
};

export default function DeanCompreExamIndex({ programs = UIC_PROGRAMS }: { programs?: string[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const [tab, setTab] = useState<'pending'|'approved'|'rejected'>('pending');
  const [loading, setLoading] = useState(false);
  const [schoolYear, setSchoolYear] = useState<'all'|string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [hasRemarks, setHasRemarks] = useState<'all'|'yes'|'no'>('all');
  const [programFilter, setProgramFilter] = useState<'all'|string>('all');

  const fetchRows = React.useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    setLoading(true);
    fetch(`/api/dean/exam-applications?${p.toString()}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch applications');
        return r.json();
      })
      .then(json => {
        const data = Array.isArray(json.data) ? json.data : [];
        setRows(data);
      })
      .catch(err => {
        console.error('Error fetching applications:', err);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [q]);

  // URL-state: restore tab and q from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = (p.get('tab') || '').toLowerCase();
    if (t === 'approved' || t === 'rejected' || t === 'pending') setTab(t as any);
    const qs = p.get('q');
    if (qs) setQ(qs);
  }, []);

  // Persist tab and debounced q in URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.set('tab', tab);
    dq ? p.set('q', dq) : p.delete('q');
    window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
  }, [tab, dq]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // Map API rows to table summaries
  const mapToSummary = (r: Row): CompreExamApplicationSummary => ({
    id: r.application_id,
    first_name: r.first_name,
    middle_name: r.middle_name ?? null,
    last_name: r.last_name,
    email: r.email ?? null,
    school_id: r.school_id != null ? String(r.school_id) : null,
    program: r.program ?? null,
    submitted_at: r.created_at ?? null,
    application_status: (r.final_approval_status ?? 'pending') as 'pending'|'approved'|'rejected',
    remarks: r.final_approval_reason ?? null,
  });

  // Derive program list from rows + provided programs
  const programsFromRows = useMemo(() => {
    const set = new Map<string, string>();
    rows.forEach(r => {
      const v = (r.program || '').trim();
      if (!v) return;
      const key = v.toLowerCase().replace(/\s+/g, ' ');
      if (!set.has(key)) set.set(key, v);
    });
    const base = Array.from(set.values());
    const merged = Array.from(new Map([...base, ...programs].map(p => [p.toLowerCase().replace(/\s+/g, ' '), p])).values());
    return merged.sort((a, b) => a.localeCompare(b));
  }, [rows, programs]);

  // Distinct School Years from rows
  const schoolYears = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => { if (r.school_year) s.add(r.school_year); });
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [rows]);

  // Partition by status and compute counts (from raw rows)
  const pendingRows = useMemo(() => rows.filter(r => (r.final_approval_status ?? 'pending') === 'pending'), [rows]);
  const approvedRows = useMemo(() => rows.filter(r => r.final_approval_status === 'approved'), [rows]);
  const rejectedRows = useMemo(() => rows.filter(r => r.final_approval_status === 'rejected'), [rows]);
  const counts = { pending: pendingRows.length, approved: approvedRows.length, rejected: rejectedRows.length };

  // Build pipeline for current tab: filter -> search -> sort -> map
  const srcForTabRows = tab === 'pending' ? pendingRows : tab === 'approved' ? approvedRows : rejectedRows;
  const filteredRows = useMemo(() => {
    let out = [...srcForTabRows];
    if (schoolYear !== 'all') out = out.filter(r => r.school_year === schoolYear);
    if (dateRange?.from) {
      const fromTime = new Date(dateRange.from).setHours(0,0,0,0);
      out = out.filter(r => r.created_at && new Date(r.created_at).getTime() >= fromTime);
    }
    if (dateRange?.to) {
      const toTime = new Date(dateRange.to).setHours(23,59,59,999);
      out = out.filter(r => r.created_at && new Date(r.created_at).getTime() <= toTime);
    }
    if (hasRemarks !== 'all') out = out.filter(r => (r.final_approval_reason && r.final_approval_reason.trim().length > 0) === (hasRemarks === 'yes'));
    if (programFilter !== 'all') out = out.filter(r => (r.program || '') === programFilter);
    return out;
  }, [srcForTabRows, schoolYear, dateRange, hasRemarks, programFilter]);

  const searchedRows = useMemo(() => {
    const term = dq.trim().toLowerCase();
    if (!term) return filteredRows;
    return filteredRows.filter(r => [r.first_name, r.middle_name || '', r.last_name, r.email || '', String(r.school_id || ''), r.program || '']
      .join(' ').toLowerCase().includes(term));
  }, [filteredRows, dq]);

  const sortedRows = useMemo(() => {
    const out = [...searchedRows];
    out.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : -Infinity;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : -Infinity;
      return bTime - aTime; // Always newest first
    });
    return out;
  }, [searchedRows]);

  const paged: CompreExamApplicationSummary[] = useMemo(() => sortedRows.map(mapToSummary), [sortedRows]);

  // Pagination (client-side)
  const [page, setPage] = useState(1);
  const pageSize = 12;
  useEffect(() => { setPage(1); }, [tab, dq, schoolYear, dateRange, hasRemarks, rows.length]);
  const total = paged.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageItems = useMemo(() => paged.slice(pageStart, pageStart + pageSize), [paged, pageStart]);

  const csrf = () => (document.querySelector('meta[name="csrf-token"]') as any)?.content || '';

  async function onApprove(id: number) {
    try {
      const response = await fetch(`/dean/exam-applications/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Approve failed' }));
        throw new Error(error.message || 'Approve failed');
      }
      fetchRows();
    } catch (err) {
      console.error('Error approving application:', err);
      throw err;
    }
  }
  async function onReject(id: number, reason: string) {
    try {
      const response = await fetch(`/dean/exam-applications/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify({ status: 'rejected', reason }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Reject failed' }));
        throw new Error(error.message || 'Reject failed');
      }
      fetchRows();
    } catch (err) {
      console.error('Error rejecting application:', err);
      throw err;
    }
  }
  async function onApproveMany(ids: number[]) {
    try {
      const response = await fetch('/dean/exam-applications/bulk-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify({ ids, status: 'approved' }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Bulk approve failed' }));
        throw new Error(error.message || 'Bulk approve failed');
      }
      fetchRows();
    } catch (err) {
      console.error('Error bulk approving:', err);
      throw err;
    }
  }
  async function onRejectMany(ids: number[], reason: string) {
    try {
      const response = await fetch('/dean/exam-applications/bulk-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify({ ids, status: 'rejected', reason }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Bulk reject failed' }));
        throw new Error(error.message || 'Bulk reject failed');
      }
      fetchRows();
    } catch (err) {
      console.error('Error bulk rejecting:', err);
      throw err;
    }
  }

  return (
    <AppLayout>
      <Head title="Dean • Comprehensive Exam" />
      <Toaster position="bottom-right" duration={5000} richColors closeButton />
      <div className="px-7 pt-5 pb-6">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200">
              <PaperclipIcon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-6">Comprehensive Exam Applications</h1>
              <p className="text-sm text-muted-foreground">
                View registrar approved applications. Approve or reject applications based on their eligibility. (Dean View)
              </p>
            </div>
        </div>
        
        {/* KPI strip */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CardKPI label="Pending" value={counts.pending} icon={<Timer className="h-4 w-4" />} accent="bg-sky-50" />
          <CardKPI label="Approved" value={counts.approved} icon={<Check className="h-4 w-4" />} accent="bg-emerald-50" />
          <CardKPI label="Rejected" value={counts.rejected} icon={<CircleX className="h-4 w-4" />} accent="bg-rose-50" />
          <CardKPI
            label="Approval rate"
            value={`${Math.round((counts.approved / Math.max(1, counts.approved + counts.rejected)) * 100)}%`}
            sub={`${counts.approved} of ${counts.approved + counts.rejected}`}
            accent="bg-amber-50"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 justify-end w-full">
         {/* Top Header */}
          <div className="relative w-full md:w-72">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, ID, program…"
              className="pl-8 h-9"
              aria-label="Search applications"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            {q && (
              <button
                onClick={() => setQ('')}
                aria-label="Clear search"
                className="absolute right-2 top-2.5 text-zinc-500 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow dark:border-slate-800 dark:bg-slate-900" role="tablist">
            <Button role="tab" aria-selected={tab === 'pending'} variant="ghost"
              className={`h-9 px-3 rounded-md ${tab === 'pending' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
              onClick={() => setTab('pending')}>
              <span className="mr-2">Pending</span>
              <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === 'pending' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'}`}>
                {counts.pending}
              </span>
            </Button>
            <Button role="tab" aria-selected={tab === 'rejected'} variant="ghost"
              className={`h-9 px-3 rounded-md ${tab === 'rejected' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
              onClick={() => setTab('rejected')}>
              <span className="mr-2">Rejected</span>
              <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === 'rejected' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'}`}>
                {counts.rejected}
              </span>
            </Button>
            <Button role="tab" aria-selected={tab === 'approved'} variant="ghost"
              className={`h-9 px-3 rounded-md ${tab === 'approved' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
              onClick={() => setTab('approved')}>
              <span className="mr-2">Approved</span>
              <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === 'approved' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'}`}>
                {counts.approved}
              </span>
            </Button>
            <Button size="sm" className="ml-2 h-8" onClick={fetchRows} disabled={loading}>Refresh</Button>
          </div>
        </div>

        {/* Filters moved inline beside program filter within the table header */}

        <div className="mt-3">
          <TableDeanCompreExam
            paged={pageItems}
            columns={{ student: true, program: true, date: true, status: true, actions: true }}
            tabType={tab}
            showStatusFilter={false}
            programOptions={programsFromRows}
            programValue={programFilter}
            onProgramChange={(v)=>{ setProgramFilter(v as any); setPage(1); }}
            onApprove={onApprove}
            onReject={onReject}
            onApproveMany={onApproveMany}
            onRejectMany={onRejectMany}
            onRetrieve={async (id:number)=>{
              await fetch(`/dean/exam-applications/${id}/revert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf() },
                credentials: 'same-origin',
              }).then(r => { if (!r.ok) throw new Error('Revert failed'); });
              fetchRows();
            }}
            onRetrieveMany={async (ids:number[])=>{
              await fetch('/dean/exam-applications/bulk-revert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrf() },
                credentials: 'same-origin',
                body: JSON.stringify({ ids }),
              }).then(r => { if (!r.ok) throw new Error('Bulk revert failed'); });
              fetchRows();
            }}
            loading={loading}
            schoolYearOptions={schoolYears}
            schoolYearValue={schoolYear}
            onSchoolYearChange={(v)=>setSchoolYear(v as any)}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            hasRemarks={hasRemarks}
            onHasRemarksChange={(v)=>setHasRemarks(v)}
            onResetFilters={()=>{ setSchoolYear('all'); setDateRange(undefined); setHasRemarks('all'); setProgramFilter('all'); setPage(1); }}
          />
          {/* Pagination footer */}
          <div className="px-1 py-2 flex items-center justify-between text-sm text-muted-foreground">
            <div>Showing {total} records</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} aria-label="Previous page">«</Button>
              <div className="text-xs">Page {page} of {totalPages}</div>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} aria-label="Next page">»</Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm text-zinc-500 mb-1">Programs available:</div>
          <div className="flex flex-wrap gap-2">{programsFromRows.map((p, i) => (<Badge key={i} variant="secondary">{p}</Badge>))}</div>
        </div>
      </div>
    </AppLayout>
  );
}

/* --------- Presentational bits (local) --------- */
function CardKPI({ label, value, sub, accent, icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3 flex items-start gap-3" role="region" aria-label={label}>
      <div className={`p-2 rounded-md ${accent ?? 'bg-zinc-50'} border border-zinc-100`}>{icon ?? <Timer className="h-5 w-5 text-zinc-600" />}</div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold mt-0.5">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}