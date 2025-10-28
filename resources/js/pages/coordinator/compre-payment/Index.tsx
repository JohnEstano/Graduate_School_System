import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  PaperclipIcon,
  Check,
  X,
  Clock,
  CircleDollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import TableComprePayment from './table-compre-payment';
import { Toaster } from '@/components/ui/sonner';

export type ComprePaymentSummary = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  school_id: string | null;
  program: string | null;
  reference: string | null;
  amount: number | null;
  submitted_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string | null;
  proof_url?: string | null;
};

type PageProps = {
  programs: string[];
  pending: ComprePaymentSummary[];
  approved: ComprePaymentSummary[];
  rejected: ComprePaymentSummary[];
  counts: { pending: number; approved: number; rejected: number };
  bypassMode?: boolean;
  canModerate?: boolean;
};

export default function CoordinatorComprePaymentIndex() {
  const { props } = usePage<PageProps>();
  const { pending = [], approved = [], rejected = [] } = props;

  // --- URL-driven tab + search ---
  const [status, setStatus] = useState<'all' | 'pending' | 'rejected' | 'approved'>('pending');
  const [q, setQ] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('status') || params.get('tab') || '').toLowerCase();
    if (raw === 'approved' || raw === 'rejected' || raw === 'pending' || raw === 'all') setStatus(raw as any);
    const qs = params.get('q');
    if (qs) setQ(qs);
  }, []);

  const dq = useDeferredValue(q);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('status', status);
    // keep legacy param in sync for backward-compat
    params.set('tab', status);
    if (dq) params.set('q', dq);
    else params.delete('q');
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  }, [status, dq]);

  // --- Data source by tab + search ---
  const all = { pending, rejected, approved } as const;

  // 1) full filtered list (for "Showing N")
  const filtered = useMemo(() => {
    const src =
      status === 'all'
        ? ([] as ComprePaymentSummary[]).concat(pending || [], rejected || [], approved || [])
        : (all[status as 'pending' | 'rejected' | 'approved'] || []);
    const query = dq.trim().toLowerCase();
    if (!query) return src;
    return src.filter((r) =>
      [
        r.first_name,
        r.middle_name || '',
        r.last_name,
        r.email || '',
        r.school_id || '',
        r.program || '',
        r.reference || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [status, dq, pending, approved, rejected]);

  // 2) pagination over filtered list
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    // reset to first page when tab or search changes
    setPage(1);
  }, [status, dq]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  // --- KPI metrics (consistent with Applications page) ---
  const kpis = useMemo(() => {
    const totalAll = (pending?.length || 0) + (approved?.length || 0) + (rejected?.length || 0);
    const approvedCount = approved?.length || 0;
    const rejectedCount = rejected?.length || 0;
    const pendingCount = pending?.length || 0;

    const toNum = (n: unknown) => (typeof n === 'number' ? n : Number(n || 0)) || 0;
    const sum = (arr: ComprePaymentSummary[]) => arr.reduce((s, r) => s + toNum(r.amount), 0);

    const approvalDenom = approvedCount + rejectedCount;
    const approvalRate = approvalDenom ? Math.round((approvedCount / approvalDenom) * 100) : 0;

    const currency = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    });

    // Per-filter amount (helps understand magnitude for current view)
    const filterArr =
      status === 'approved' ? approved : status === 'rejected' ? rejected : status === 'pending' ? pending : ([] as ComprePaymentSummary[]).concat(pending, approved, rejected);
    const tabAmountFmt = currency.format(sum(filterArr));

    return {
      total: totalAll,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      approvalRate,
      tabAmountFmt,
    };
  }, [pending, approved, rejected, status]);

  const columns = {
    student: true,
    program: true,
    reference: true,
    amount: true,
    date: true,
    status: true,
    actions: true,
  };

  return (
    <AppLayout>
      <Head title="Coordinator • Compre Payments" />
      <div className="px-7 pt-5 pb-6">
        {/* Title + Search + Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
              <PaperclipIcon className="h-5 w-5 text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                Comprehensive Exam Payments
              </div>
              <div className="hidden md:block text-xs text-muted-foreground truncate">
                View and manage student payment submissions for comprehensive exams.
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, ID, program, OR…"
              className="pl-8 h-9"
              aria-label="Search payments"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          {/* Status dropdown */}
          <div className="w-full sm:w-48">
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payments Dashboard KPIs (consistent with Applications page) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <CardSmall
            label="Students in scope"
            value={kpis.total}
            accent="bg-zinc-50"
          />
          <CardSmall
            label="Pending"
            value={kpis.pending}
            accent="bg-amber-50"
            icon={<Clock className="h-4 w-4 text-amber-700" />}
          />
          <CardSmall
            label="Approved"
            value={kpis.approved}
            accent="bg-emerald-50"
            icon={<Check className="h-4 w-4 text-emerald-700" />}
          />
          <CardSmall
            label="Rejected"
            value={kpis.rejected}
            accent="bg-rose-50"
            icon={<X className="h-4 w-4 text-rose-700" />}
          />
          <CardSmall
            label="Approval rate"
            value={`${kpis.approvalRate}%`}
            accent="bg-sky-50"
            icon={<TrendingUp className="h-4 w-4 text-sky-700" />}
            sub={<ProgressBar value={kpis.approvalRate} />}
          />
          <CardSmall
            label={status === 'approved' ? 'Approved amount (filter)' : 'Amount (filter)'}
            value={kpis.tabAmountFmt}
            accent="bg-indigo-50"
            icon={<CircleDollarSign className="h-4 w-4 text-indigo-700" />}
          />
        </div>

        {/* Table */}
        <div className="mt-3">
          <TableComprePayment
            paged={pageItems}
            columns={columns}
            tabType={status === 'all' ? undefined : (status as 'pending' | 'rejected' | 'approved')}
            showStatusFilter={false}
          />
        </div>

        {/* Footer: consistent with Applications page, now with working pagination */}
        <div className="px-1 py-1 flex items-center justify-between mt-2">
          <div className="text-sm text-muted-foreground">
            Showing {total} payments
          </div>
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
      {/* Toasts for bottom-right success messages */}
      <Toaster position="bottom-right" duration={5000} richColors closeButton />
    </AppLayout>
  );
}

/* small presentational components kept here for clarity */

function CardSmall({
  label,
  value,
  accent,
  icon,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-3 flex items-center gap-3" role="region" aria-label={label}>
      <div className={`p-2 rounded-md ${accent ?? 'bg-zinc-50'} border border-zinc-100`}>
        {icon ?? <PaperclipIcon className="h-5 w-5 text-zinc-600" />}
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
        {sub && <div className="mt-2">{sub}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-zinc-100 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-emerald-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
