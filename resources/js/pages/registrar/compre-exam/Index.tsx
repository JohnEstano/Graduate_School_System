import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Toaster, toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { Search, Check, X, Paperclip as PaperclipIcon } from 'lucide-react';
import { UIC_PROGRAMS } from '@/constants/programs';
import TableRegistrar, { RegistrarRow } from './table-registrar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type Row = {
  application_id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  program: string;
  school_year: string;
  created_at: string;
  school_id?: string | null;
  registrar_status?: 'pending' | 'approved' | 'rejected';
  registrar_reason?: string | null;
  subjects_count: number;
  latest_review?: {
    documents_complete: boolean;
    grades_complete: boolean;
    status: 'pending'|'approved'|'rejected';
    reason?: string | null;
    created_at: string;
  } | null;
};

// Normalize API rows to UI Row
function toRow(r: any): Row {
  return {
    application_id: r.application_id ?? r.id ?? r.app_id,
    first_name: r.first_name ?? r.user?.first_name ?? '',
    middle_name: r.middle_name ?? r.user?.middle_name ?? null,
    last_name: r.last_name ?? r.user?.last_name ?? '',
    program: r.program ?? r.student_program ?? '',
    school_year: r.school_year ?? r.sy ?? '',
    school_id: r.school_id ?? r.student_id ?? null,
    created_at: r.created_at ?? r.createdAt ?? '',
    registrar_status: (r.registrar_status ?? r.status ?? 'pending') as any,
    registrar_reason: r.registrar_reason ?? r.reason ?? null,
    subjects_count: r.subjects_count ?? (Array.isArray(r.subjects) ? r.subjects.length : 0),
    latest_review: r.latest_review ?? null,
  };
}

export default function RegistrarCompreExamIndex() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<Row | null>(null);
  const [doc, setDoc] = React.useState({ photo: false, tor: false, psa: false, hd: false, prof: false, marriage: false });
  const [gradesComplete, setGradesComplete] = React.useState<boolean>(false);
  const [decision, setDecision] = React.useState<'approved'|'rejected'|null>(null);
  const [reason, setReason] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);
  const [audit, setAudit] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState<'checklist'|'audit'>('checklist');

  function fetchRows() {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', per_page: '100' }).toString();
    fetch(`/api/registrar/exam-applications?${params}`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const list = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
        setRows(list.map(toRow));
      })
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }

  React.useEffect(() => { fetchRows(); }, []);

  // Quick search (client-side like coordinator)
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.first_name, r.middle_name || '', r.last_name, r.program, r.school_year]
        .join(' ')
        .toLowerCase()
        .includes(s),
    );
  }, [rows, q]);

  // Helpers
  const parseISO = (s?: string | null) => (s ? new Date(s) : null);
  const daysBetween = (a?: string | null, b?: Date) => {
    const d1 = parseISO(a);
    const d2 = b ?? new Date();
    if (!d1) return 0;
    return Math.max(0, Math.round((+d2 - +d1) / 86400000));
  };
  const median = (arr: number[]) => {
    if (!arr.length) return 0;
    const s = [...arr].sort((x, y) => x - y);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  };
  const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

  // Enhanced KPIs
  const kpis = React.useMemo(() => {
    const now = new Date();

    const total = rows.length;
    const pendingRows = rows.filter(r => (r.registrar_status ?? 'pending') === 'pending');
    const approvedRows = rows.filter(r => r.registrar_status === 'approved');
    const rejectedRows = rows.filter(r => r.registrar_status === 'rejected');

    const pending = pendingRows.length;
    const approved = approvedRows.length;
    const rejected = rejectedRows.length;
    const decided = approved + rejected;

    const eligible = rows.filter((r: any) => r.latest_review?.documents_complete && r.latest_review?.grades_complete).length;

    const approvalRate = decided ? Math.round((approved / decided) * 100) : 0;
    const pendingPct = total ? Math.round((pending / total) * 100) : 0;

    const decidedLast7 = [...approvedRows, ...rejectedRows].filter(r => {
      const decidedAt = r.latest_review?.created_at || r.created_at;
      return daysBetween(decidedAt, now) <= 7;
    }).length;

    const medPendingAge = median(pendingRows.map(r => daysBetween(r.created_at, now)));
    const avgDecisionTime = avg(
      [...approvedRows, ...rejectedRows].map(r => {
        const decidedAt = r.latest_review?.created_at || r.created_at;
        return Math.max(0, daysBetween(r.created_at, decidedAt ? new Date(decidedAt) : undefined));
      })
    );

    return { total, pending, approved, rejected, decided, eligible, approvalRate, pendingPct, decidedLast7, medPendingAge, avgDecisionTime };
  }, [rows]);

  // Bulk actions from table
  const handleBulkAction = (ids: number[], action: 'approve'|'reject', reasonArg?: string) => {
    if (ids.length === 0) return;
    // naive sequential calls; can be optimized/batched server-side later
    const doOne = (id: number) => fetch(`/registrar/exam-applications/${id}/decision`, {
      method: 'POST',
      headers: {
        Accept: 'application/json','Content-Type': 'application/json','X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        // For bulk operations, record completeness flags and overall aggregate booleans for audit trail
        doc_photo_clear: true, doc_transcript: true, doc_psa_birth: true, doc_honorable_dismissal: true,
        doc_prof_exam: false, doc_marriage_cert: false,
        grades_complete: true,
        documents_complete: true,
        status: action,
        reason: action === 'reject' ? (reasonArg && reasonArg.trim() ? reasonArg.trim() : 'Bulk review: incomplete requirements.') : null,
      }),
    }).then(r => { if (!r.ok) throw new Error(String(r.status)); });

    (async () => {
      try {
        for (const id of ids) { // sequential to keep server happy
          // eslint-disable-next-line no-await-in-loop
          await doOne(id);
        }
        toast.success(`${action === 'approve' ? 'Approved' : 'Rejected'} ${ids.length} application(s).`);
        fetchRows();
      } catch {
        toast.error('Bulk action failed');
      }
    })();
  };

  function openReview(r: RegistrarRow) {
    const cur = rows.find((x) => x.application_id === r.application_id) || (r as any);
    setCurrent(cur);
    setDoc({ photo: false, tor: false, psa: false, hd: false, prof: false, marriage: false });
    setDecision(null);
    setReason('');
    setGradesComplete(!!cur.latest_review?.grades_complete);
    setTab('checklist');
    setOpen(true);

    // Eligibility probe
    fetch('/api/comprehensive-exam/eligibility?application_id=' + encodeURIComponent(String(cur.application_id)), {
      headers: { Accept: 'application/json' }, credentials: 'same-origin',
    }).then((res) => res.ok ? res.json() : null)
      .then((json) => { if (json && typeof json.gradesComplete === 'boolean') setGradesComplete(json.gradesComplete); })
      .catch(() => {});

    // Audit trail (normalize, with fallback endpoint if API 500s)
    const normalizeAudit = (data: any) => {
      const list = Array.isArray(data) ? data : (Array.isArray((data as any)?.data) ? (data as any).data : []);
      return list.map((a: any) => ({
        id: a.id ?? a.review_id ?? a.log_id ?? `${a.status || a.decision || 'entry'}-${a.created_at || a.timestamp || Math.random()}`,
        status: (a.status ?? a.decision ?? a.application_status ?? '').toString().toLowerCase(),
        reason: a.reason ?? a.remarks ?? a.message ?? null,
        created_at: a.created_at ?? a.createdAt ?? a.timestamp ?? new Date().toISOString(),
        grades_complete: a.grades_complete ?? a.grade_complete ?? a.grades ?? false,
        documents_complete: a.documents_complete ?? a.docs_complete ?? a.documents ?? false,
      }));
    };
    const apiUrl = `/api/registrar/exam-applications/${cur.application_id}/reviews`;
    const altUrl = `/registrar/exam-applications/${cur.application_id}/reviews`;
    fetch(apiUrl, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
      .then(async (res) => {
        if (res.ok) return res.json();
        // fallback to non-API route if available
        const alt = await fetch(altUrl, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' });
        if (alt.ok) return alt.json();
        throw new Error('audit fetch failed');
      })
      .then((data) => setAudit(normalizeAudit(data)))
      .catch(() => setAudit([]));
  }

  // Build default reject reason from unchecked boxes/grades
  const buildAutoReject = React.useCallback(() => {
    const missing: string[] = [];
    if (!doc.photo) missing.push('clear whole body picture');
    if (!doc.tor) missing.push('transcript of record');
    if (!doc.psa) missing.push('PSA birth certificate');
    if (!doc.hd) missing.push('honorable dismissal');
    if (!gradesComplete) missing.push('complete grades');
    return missing.length ? `Incomplete requirements: ${missing.join(', ')}.` : 'Does not meet requirements.';
  }, [doc.photo, doc.tor, doc.psa, doc.hd, gradesComplete]);

  function submitDecision() {
    if (!current || !decision) return;
    const auto = decision === 'rejected' && !reason.trim() ? buildAutoReject() : null;
    const documentsComplete = !!(doc.photo && doc.tor && doc.psa && doc.hd);
    const body = {
      doc_photo_clear: doc.photo,
      doc_transcript: doc.tor,
      doc_psa_birth: doc.psa,
      doc_honorable_dismissal: doc.hd,
      doc_prof_exam: doc.prof,
      doc_marriage_cert: doc.marriage,
      grades_complete: gradesComplete,
      documents_complete: documentsComplete,
      status: decision,
      reason: (reason || auto) || null,
    };
    setSubmitting(true);
    fetch(`/registrar/exam-applications/${current.application_id}/decision`, {
      method: 'POST',
      headers: {
        Accept: 'application/json','Content-Type': 'application/json','X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
      },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
      .then(async (r) => { if (!r.ok) throw new Error(await r.text()); })
      .then(() => {
        if (decision === 'approved') toast.success('Application approved (to Dean next).');
        else toast.error('Application rejected', { description: (reason || auto) || undefined });
        // Optimistically append to audit trail for immediate feedback
        setAudit((prev) => [
          {
            id: `local-${Date.now()}`,
            status: decision,
            reason: (reason || auto) || null,
            created_at: new Date().toISOString(),
            grades_complete: gradesComplete,
            documents_complete: documentsComplete,
          },
          ...prev,
        ]);
        setOpen(false);
        fetchRows();
      })
      .catch(() => toast.error('Failed to save decision'))
      .finally(() => setSubmitting(false));
  }

  return (
    <AppLayout>
      <Head title="Registrar • Comprehensive Exam Applications" />
      <Toaster position="bottom-right" duration={5000} richColors closeButton />
      <div className="px-6 py-6">
        {/* KPI strips (enhanced) */}
        

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200">
              <PaperclipIcon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-6">Comprehensive Exam Applications</h1>
              <p className="text-sm text-muted-foreground">Registrar review and decision.</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative w-80">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search applicant, program, SY…" className="pl-10 h-9" aria-label="Search" />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              {q && <button onClick={() => setQ('')} aria-label="Clear" className="absolute right-2 top-2.5 text-zinc-400 hover:text-zinc-600"><X className="h-4 w-4" /></button>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <CardKPI
            label="Total"
            value={kpis.total}
            accent="bg-zinc-50"
            icon={<PaperclipIcon className="h-4 w-4" />}
            sub={`${kpis.decided} decided`}
          />
          <CardKPI
            label="Pending"
            value={kpis.pending}
            accent="bg-sky-50"
            sub={`${kpis.pendingPct}% of total`}
            progress={kpis.pendingPct}
          />
          <CardKPI
            label="Approved"
            value={kpis.approved}
            accent="bg-emerald-50"
            sub={`Approval rate ${kpis.approvalRate}%`}
            deltaLabel={`${kpis.approvalRate}%`}
            deltaType={kpis.approvalRate >= 60 ? 'up' : kpis.approvalRate === 0 ? 'neutral' : 'down'}
          />
          <CardKPI
            label="Rejected"
            value={kpis.rejected}
            accent="bg-rose-50"
            sub={`Decided last 7d: ${kpis.decidedLast7}`}
          />
          <CardKPI
            label="Eligible"
            value={kpis.eligible}
            accent="bg-emerald-50"
            sub="Docs + grades complete"
          />
          <CardKPI
            label="Decision time"
            value={`${kpis.avgDecisionTime} d`}
            accent="bg-zinc-50"
            sub={`Median pending age: ${kpis.medPendingAge} d`}
          />
        </div>

        {/* Table */}
        <TableRegistrar
          rows={filtered as unknown as RegistrarRow[]}
          programs={UIC_PROGRAMS}
          onVisibleCountChange={() => {}}
          onReview={openReview}
          onBulkAction={handleBulkAction}
        />

        {/* Review Dialog with Audit Trail tab */}
        <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Review</DialogTitle>
              <DialogDescription>Check documents and decide. Grades completeness auto-fetched.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">{current ? `${current.last_name}, ${current.first_name}` : ''}</div>
                <div className="text-muted-foreground">{current ? `${current.program} • ${current.school_year}` : ''}</div>
              </div>

              <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
                <TabsList>
                  <TabsTrigger value="checklist">Checklist</TabsTrigger>
                  <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                </TabsList>

                <TabsContent value="checklist">
                  <Separator className="my-3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={doc.photo} onCheckedChange={(v) => setDoc(s => ({ ...s, photo: !!v }))} /> Clear whole body picture</label>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={doc.tor} onCheckedChange={(v) => setDoc(s => ({ ...s, tor: !!v }))} /> Transcript of record</label>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={doc.psa} onCheckedChange={(v) => setDoc(s => ({ ...s, psa: !!v }))} /> PSA birth certificate</label>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={doc.hd} onCheckedChange={(v) => setDoc(s => ({ ...s, hd: !!v }))} /> Honorable dismissal</label>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={doc.prof} onCheckedChange={(v) => setDoc(s => ({ ...s, prof: !!v }))} /> Passed professional exam (optional)</label>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={doc.marriage} onCheckedChange={(v) => setDoc(s => ({ ...s, marriage: !!v }))} /> Marriage certificate (optional)</label>
                  </div>

                  <div className="text-sm mt-2">Grades complete: <span className={gradesComplete ? 'text-green-700' : 'text-rose-700'}>{gradesComplete ? 'Yes' : 'No'}</span></div>

                  <Separator className="my-3" />

                  <div className="flex items-center gap-2">
                    <Button variant={decision === 'approved' ? 'default' : 'outline'} onClick={() => setDecision('approved')}><Check className="h-4 w-4 mr-1" /> Approve</Button>
                    <Button variant={decision === 'rejected' ? 'destructive' : 'outline'} onClick={() => setDecision('rejected')}><X className="h-4 w-4 mr-1" /> Reject</Button>
                  </div>

                  {decision === 'rejected' && (
                    <div className="space-y-1 mt-2">
                      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection…" />
                      {!reason && <div className="text-xs text-muted-foreground">Tip: leave empty to auto-fill based on missing requirements.</div>}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3">
                    <Button onClick={submitDecision} disabled={!decision || submitting}>{submitting ? 'Saving…' : 'Save decision'}</Button>
                  </div>
                </TabsContent>

                <TabsContent value="audit">
                  <Separator className="my-3" />
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {audit.length === 0 && <div className="text-sm text-muted-foreground">No audit entries.</div>}
                    {audit.map((a) => (
                      <div key={a.id} className="rounded-md border p-2">
                        <div className="text-sm">
                          <strong className={a.status === 'approved' ? 'text-green-700' : a.status === 'rejected' ? 'text-rose-700' : ''}>
                            {a.status[0].toUpperCase() + a.status.slice(1)}
                          </strong>
                          {' • '}
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Grades: {a.grades_complete ? '✅' : '❌'} • Docs: {a.documents_complete ? '✅' : '❌'}
                        </div>
                        {a.reason && <div className="text-sm mt-1">Reason: {a.reason}</div>}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// Lightweight KPI card with optional delta and progress bar
function CardKPI({
  label,
  value,
  accent,
  icon,
  sub,
  deltaLabel,
  deltaType = 'neutral',
  progress,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
  sub?: React.ReactNode;
  deltaLabel?: string;
  deltaType?: 'up' | 'down' | 'neutral';
  progress?: number; // 0..100
}) {
  const deltaStyles =
    deltaType === 'up'
      ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
      : deltaType === 'down'
      ? 'text-rose-700 bg-rose-100 border-rose-200'
      : 'text-zinc-700 bg-zinc-100 border-zinc-200';
  const deltaGlyph = deltaType === 'up' ? '↑' : deltaType === 'down' ? '↓' : '–';
  const pct = typeof progress === 'number' ? Math.min(100, Math.max(0, Math.round(progress))) : null;

  return (
    <div className="rounded-md border p-3 flex flex-col gap-2" role="region" aria-label={label}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-md ${accent ?? 'bg-zinc-50'} border border-zinc-100`}>
          {icon ?? <PaperclipIcon className="h-5 w-5 text-zinc-600" />}
        </div>
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
      {pct !== null && (
        <div className="w-full h-1.5 bg-zinc-100 rounded">
          <div
            className="h-1.5 rounded bg-sky-500"
            style={{ width: `${pct}%` }}
            aria-label={`${pct}%`}
          />
        </div>
      )}
    </div>
  );
}