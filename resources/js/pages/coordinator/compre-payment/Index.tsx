import React, { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
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

  const [tab, setTab] = useState<'pending' | 'rejected' | 'approved'>('pending');
  const [q, setQ] = useState('');

  const all = { pending, rejected, approved } as const;

  const paged = useMemo(() => {
    const src = all[tab] || [];
    const query = q.trim().toLowerCase();
    if (!query) return src;
    return src.filter((r) =>
      [r.first_name, r.middle_name || '', r.last_name, r.email || '', r.school_id || '', r.program || '', r.reference || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [tab, q, pending, approved, rejected]);

  const columns = { student: true, program: true, reference: true, amount: true, date: true, status: true, actions: true };

  return (
    <AppLayout>
      <Head title="Coordinator • Compre Payments" />
      <div className="px-7 pt-5 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Comprehensive Exam • Payments</h1>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant={tab === 'pending' ? 'secondary' : 'outline'} className="h-8" onClick={() => setTab('pending')}>
            Pending <Badge variant="secondary" className="ml-2">{counts?.pending ?? pending.length}</Badge>
          </Button>
          <Button variant={tab === 'rejected' ? 'secondary' : 'outline'} className="h-8" onClick={() => setTab('rejected')}>
            Rejected <Badge variant="secondary" className="ml-2">{counts?.rejected ?? rejected.length}</Badge>
          </Button>
          <Button variant={tab === 'approved' ? 'secondary' : 'outline'} className="h-8" onClick={() => setTab('approved')}>
            Approved <Badge variant="secondary" className="ml-2">{counts?.approved ?? approved.length}</Badge>
          </Button>

          <div className="ml-auto relative w-64">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-8 h-8" />
            <Search className="absolute left-2 top-1.5 h-5 w-5 text-zinc-400" />
          </div>
        </div>

        <div className="mt-3">
          <TableComprePayment
            paged={paged}
            columns={columns}
            tabType={tab}
            onRowApprove={(id) => console.log('approve payment', id)}
            onRowReject={(id) => console.log('reject payment', id)}
            onRowRetrieve={(id) => console.log('retrieve payment', id)}
          />
        </div>

        {/* <div className="mt-6">
          <div className="text-sm text-zinc-500 mb-1">You can manage payments for these programs:</div>
          <div className="flex flex-wrap gap-2">
            {programs.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}
          </div>
        </div> */}
      </div>
    </AppLayout>
  );
}