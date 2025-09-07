import React, { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Paperclip, Search } from 'lucide-react';
import TableCompreExam from './table-compre-exam';
import { Users, PaperclipIcon } from "lucide-react";

export type CompreExamApplicationSummary = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  school_id: string | null;
  program: string | null;
  eligible: boolean;
  lacking: string[];
  applied: boolean;
  submitted_at: string | null;
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
  const { programs = [], eligible = [], notEligible = [], counts = { eligible: 0, notEligible: 0 } } = props;

  const [tab, setTab] = useState<'eligible' | 'not'>('eligible');
  const [q, setQ] = useState('');

  const data = tab === 'eligible' ? eligible : notEligible;

  const paged = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return data;
    return data.filter(r =>
      [
        r.first_name, r.middle_name || '', r.last_name,
        r.email || '', r.school_id || '', r.program || '',
      ]
      .join(' ')
      .toLowerCase()
      .includes(query)
    );
  }, [data, q]);

  const columns = { student: true, program: true, eligibility: true, applied: true, appStatus: true, actions: true };

  return (
    <AppLayout>

      <div className="px-7 pt-5 pb-6">
        <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-500/10 border border-rose-500">
                <PaperclipIcon className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <span className="text-base font-semibold">
                Comprehensive Exam Applications
                </span>
                <span className="block text-xs text-muted-foreground">
                  This section shows all comprehensive exam applications. View student application details.
                </span>
              </div>
            </div>
            <div className="ml-auto relative w-64">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="pl-8 h-8" />
                <Search className="absolute left-2 top-1.5 h-5 w-5 text-zinc-400" />
            </div>
        </div>

        <div className="mt-3">
          <TableCompreExam paged={paged} columns={columns} />
        </div>

        {/* <div className="mt-20">
          <div className="text-sm text-zinc-500 mb-1">You can manage students in these programs:</div>
          <div className="flex flex-wrap gap-2">
            {programs.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}
          </div>
        </div> */}
      </div>
    </AppLayout>
  );
}