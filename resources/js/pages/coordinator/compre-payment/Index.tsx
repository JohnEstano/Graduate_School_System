import React, { useEffect, useMemo, useState, useDeferredValue } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge,  } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, PaperclipIcon } from 'lucide-react';
import TableComprePayment from './table-compre-payment';

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
};

export default function CoordinatorComprePaymentIndex() {
  const { props } = usePage<PageProps>();
  const { programs = [], pending = [], approved = [], rejected = [], counts } = props;

  // Initialize tab/search from URL
  const [tab, setTab] = useState<'pending' | 'rejected' | 'approved'>('pending');
  const [q, setQ] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = (params.get('tab') || '').toLowerCase();
    if (t === 'approved' || t === 'rejected' || t === 'pending') setTab(t as any);
    const qs = params.get('q');
    if (qs) setQ(qs);
  }, []);

  // Write to URL (no server request) when tab/search change
  const dq = useDeferredValue(q);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    if (dq) params.set('q', dq);
    else params.delete('q');
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  }, [tab, dq]);

  const all = { pending, rejected, approved } as const;

  const paged = useMemo(() => {
    const src = all[tab] || [];
    const query = dq.trim().toLowerCase();
    if (!query) return src;
    return src.filter((r) =>
      [r.first_name, r.middle_name || '', r.last_name, r.email || '', r.school_id || '', r.program || '', r.reference || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [tab, dq, pending, approved, rejected]);

  const columns = { student: true, program: true, reference: true, amount: true, date: true, status: true, actions: true };

  return (
    <AppLayout>
      <Head title="Coordinator • Compre Payments" />
      <div className="px-7 pt-5 pb-6">
        {/* Title + Search + Tabs (side-by-side) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Title (left) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
              <PaperclipIcon className="h-5 w-5 text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Comprehensive Exam Payments</div>
              <div className="hidden md:block text-xs text-muted-foreground truncate">
                Manage student payment submissions.
              </div>
            </div>
          </div>
          
          {/* Search (middle) */}
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

          {/* Tabs (right) */}
          <div
             className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow dark:border-slate-800 dark:bg-slate-900"
             role="tablist"
             aria-label="Comprehensive Exam Filters"
           >
            <Button
              role="tab"
              aria-selected={tab === 'pending'}
              variant="ghost"
              className={`h-9 px-3 rounded-md transition ${
                tab === 'pending'
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 hover:bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
              onClick={() => setTab('pending')}
            >
              <span className="mr-2">Pending</span>
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                  tab === 'pending' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'
                }`}
              >
                {counts?.pending ?? pending.length}
              </span>
            </Button>

            <Button
              role="tab"
              aria-selected={tab === 'rejected'}
              variant="ghost"
              className={`h-9 px-3 rounded-md transition ${
                tab === 'rejected'
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 hover:bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
              onClick={() => setTab('rejected')}
            >
              <span className="mr-2">Rejected</span>
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                  tab === 'rejected' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'
                }`}
              >
                {counts?.rejected ?? rejected.length}
              </span>
            </Button>

            <Button
              role="tab"
              aria-selected={tab === 'approved'}
              variant="ghost"
              className={`h-9 px-3 rounded-md transition ${
                tab === 'approved'
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 hover:bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
              onClick={() => setTab('approved')}
            >
              <span className="mr-2">Approved</span>
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                  tab === 'approved' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'
                }`}
              >
                {counts?.approved ?? approved.length}
              </span>
            </Button>
           </div>
         </div>
 
         <div className="mt-3">
           <TableComprePayment paged={paged} columns={columns} tabType={tab} showStatusFilter={false} />
         </div>
       </div>
    </AppLayout>
  );
}