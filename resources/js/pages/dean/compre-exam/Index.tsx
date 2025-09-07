import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import TableDeanCompreExam from './table-dean-compre-exam';

export type CompreExamApplicationSummary = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  school_id: string | null;
  program: string | null;
  submitted_at: string | null;
  application_status: 'pending' | 'approved' | 'rejected';
  remarks?: string | null;
};

type PageProps = {
  programs: string[]; // now: distinct programs from all applications
  pending: CompreExamApplicationSummary[];
  approved: CompreExamApplicationSummary[];
  rejected: CompreExamApplicationSummary[];
  counts: { pending: number; approved: number; rejected: number };
};

export default function DeanCompreExamIndex() {
  const { props } = usePage<PageProps>();
  const { programs = [], pending = [], approved = [], rejected = [], counts } = props;

  const [tab, setTab] = useState<'pending' | 'rejected' | 'approved'>('pending');
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);

  // URL-state persistence
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = (p.get('tab') || '').toLowerCase();
    if (t === 'approved' || t === 'rejected' || t === 'pending') setTab(t as any);
    const qs = p.get('q');
    if (qs) setQ(qs);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.set('tab', tab);
    dq ? p.set('q', dq) : p.delete('q');
    window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
  }, [tab, dq]);

  const all = { pending, rejected, approved } as const;

  const paged = useMemo(() => {
    const src = all[tab] || [];
    const query = dq.trim().toLowerCase();
    if (!query) return src;
    return src.filter((r) =>
      [r.first_name, r.middle_name || '', r.last_name, r.email || '', r.school_id || '', r.program || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [tab, dq, pending, approved, rejected]);

  const columns = { student: true, program: true, date: true, status: true, actions: true };

  return (
    <AppLayout>
      <Head title="Dean • Comprehensive Exam" />
      <div className="px-7 pt-5 pb-6">
        <div className="mt-3 flex flex-wrap items-center gap-2 justify-end w-full">
          <div className="relative w-full md:w-72">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, ID, program…"
              className="pl-8 h-9"
              aria-label="Search applications"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          </div>
          <div className="flex-1" />
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow dark:border-slate-800 dark:bg-slate-900" role="tablist">
            <Button role="tab" aria-selected={tab === 'pending'} variant="ghost"
              className={`h-9 px-3 rounded-md ${tab === 'pending' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
              onClick={() => setTab('pending')}>
              <span className="mr-2">Pending</span>
              <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === 'pending' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'}`}>
                {counts?.pending ?? pending.length}
              </span>
            </Button>
            <Button role="tab" aria-selected={tab === 'rejected'} variant="ghost"
              className={`h-9 px-3 rounded-md ${tab === 'rejected' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
              onClick={() => setTab('rejected')}>
              <span className="mr-2">Rejected</span>
              <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === 'rejected' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'}`}>
                {counts?.rejected ?? rejected.length}
              </span>
            </Button>
            <Button role="tab" aria-selected={tab === 'approved'} variant="ghost"
              className={`h-9 px-3 rounded-md ${tab === 'approved' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'}`}
              onClick={() => setTab('approved')}>
              <span className="mr-2">Approved</span>
              <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${tab === 'approved' ? 'bg-rose-600 text-white dark:bg-rose-500' : 'border border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-300'}`}>
                {counts?.approved ?? approved.length}
              </span>
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <TableDeanCompreExam
            paged={paged}
            columns={columns}
            tabType={tab}
            showStatusFilter={false}
            programOptions={programs}
          />
        </div>

        <div className="mt-6">
          <div className="text-sm text-zinc-500 mb-1">Programs available:</div>
          <div className="flex flex-wrap gap-2">{programs.map((p, i) => (<Badge key={i} variant="secondary">{p}</Badge>))}</div>
        </div>
      </div>
    </AppLayout>
  );
}