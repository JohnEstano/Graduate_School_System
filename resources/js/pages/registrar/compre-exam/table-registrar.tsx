import { useMemo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Check, Eye } from 'lucide-react';

export type RegistrarRow = {
  application_id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  school_id?: string | number;
  program: string;
  school_year: string;
  created_at: string;
  subjects_count: number;
  registrar_status?: 'pending' | 'approved' | 'rejected';
  latest_review?: {
    documents_complete: boolean;
    grades_complete: boolean;
  } | null;
};

type Columns = {
  sel: boolean;
  student: boolean;
  program: boolean;
  grades: boolean;
  submitted: boolean;
  status: boolean;
  actions: boolean;
};

type Props = {
  rows: RegistrarRow[];
  programs: string[];
  columns?: Partial<Columns>;
  onVisibleCountChange?: (n: number) => void;
  onReview: (row: RegistrarRow) => void;
  onBulkAction?: (ids: number[], action: 'approve' | 'reject') => void;
};

export default function TableRegistrar({ rows, programs, onVisibleCountChange, onReview, onBulkAction, columns: cols }: Props) {
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const columns: Columns = {
    sel: bulkMode,
    student: true,
    program: true,
    grades: true,
    submitted: true,
    status: true,
    actions: true,
    ...cols,
  };

  // Local filters
  const [programFilter, setProgramFilter] = useState<'all' | string>('all');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'eligible' | 'not'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('pending');

  // Derive flags
  const enriched = useMemo(() => {
    return rows.map((r) => {
      const grades = r.latest_review?.grades_complete ?? false;
      const docs = r.latest_review?.documents_complete ?? false;
      const eligible = grades && docs;
      return { ...r, eligible, grades } as RegistrarRow & { eligible: boolean; grades: boolean };
    });
  }, [rows]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (programFilter !== 'all') list = list.filter((r) => r.program === programFilter);
    if (eligibilityFilter === 'eligible') list = list.filter((r: any) => r.eligible === true);
    else if (eligibilityFilter === 'not') list = list.filter((r: any) => r.eligible === false);
    if (statusFilter !== 'all') list = list.filter((r) => (r.registrar_status ?? 'pending') === statusFilter);
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [enriched, programFilter, eligibilityFilter, statusFilter]);

  useEffect(() => onVisibleCountChange?.(filtered.length), [filtered, onVisibleCountChange]);

  // Deduplicate by application_id
  const renderRows = useMemo(() => {
    const map = new Map<number, RegistrarRow & { eligible: boolean; grades: boolean }>();
    for (const r of filtered) if (!map.has(r.application_id)) map.set(r.application_id, r);
    return Array.from(map.values());
  }, [filtered]);

  const gradeBadge = (ok: boolean) => (
    <Badge
      className={
        'rounded-full ' +
        (ok
          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900'
          : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900')
      }
      variant="outline"
    >
      {ok ? 'Grades complete' : 'Grades missing'}
    </Badge>
  );

  // Display helpers
  const statusBadge = (s: RegistrarRow['registrar_status']) => {
    const v = s ?? 'pending';
    const map: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900',
      rejected: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
      pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
    };
    const label = v[0].toUpperCase() + v.slice(1);
    return <Badge className={'rounded-full ' + map[v]} variant="outline">{label}</Badge>;
  };

  const programLabel = programFilter === 'all' ? 'All programs' : programFilter;
  const eligLabel = eligibilityFilter === 'all' ? 'All' : eligibilityFilter === 'eligible' ? 'Eligible' : 'Not eligible';
  const statusLabel = statusFilter === 'all' ? 'All' : statusFilter[0].toUpperCase() + statusFilter.slice(1);

  const nameParts = (s?: string | null) => (typeof s === 'string' ? s.trim() : '');
  const buildDisplay = (r: RegistrarRow) => {
    const fn = nameParts(r.first_name);
    const ln = nameParts(r.last_name);
    const mn = nameParts(r.middle_name);
    const hasName = !!(fn || ln);
    const primary = hasName
      ? `${ln ? ln.toUpperCase() : ''}${ln && fn ? ', ' : ''}${fn}${mn ? ` ${mn[0].toUpperCase()}.` : ''}`.trim()
      : (r.email?.trim() || (r.school_id ? `Student ${r.school_id}` : `Application #${r.application_id}`));
    const secondary = r.email?.trim() || (r.school_id ? `ID: ${r.school_id}` : '—');
    return { primary, secondary };
  };

  const allSelected = renderRows.length > 0 && renderRows.every((r) => selected.has(r.application_id));
  const toggleAll = (checked: boolean) => {
    const next = new Set<number>();
    if (checked) renderRows.forEach((r) => next.add(r.application_id));
    setSelected(next);
  };

  return (
    <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-background dark:border-border w-full max-w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2 px-3 py-3 border-b bg-muted/20 dark:bg-muted/10">
        {/* Program */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8"><Filter className="mr-2 h-4 w-4" />Program: {programLabel}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setProgramFilter('all')} className="flex items-center justify-between">
              All programs {programFilter === 'all' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            {programs.map((p) => (
              <DropdownMenuItem key={p} onClick={() => setProgramFilter(p)} className="flex items-center justify-between">
                {p} {programFilter === p && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Eligibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8"><Filter className="mr-2 h-4 w-4" />Eligibility: {eligLabel}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setEligibilityFilter('all')} className="flex items-center justify-between">
              All {eligibilityFilter === 'all' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEligibilityFilter('eligible')} className="flex items-center justify-between">
              Eligible {eligibilityFilter === 'eligible' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEligibilityFilter('not')} className="flex items-center justify-between">
              Not eligible {eligibilityFilter === 'not' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8"><Filter className="mr-2 h-4 w-4" />Status: {statusLabel}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {(['all', 'approved', 'pending', 'rejected'] as const).map((s) => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="flex items-center justify-between">
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)} {statusFilter === s && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bulk checker */}
        <Button variant={bulkMode ? 'default' : 'outline'} size="sm" className="h-8" onClick={() => { setBulkMode((v) => !v); setSelected(new Set()); }}>
          {bulkMode ? 'Exit Bulk' : 'Bulk checker'}
        </Button>
        {bulkMode && (
          <>
            <Button size="sm" className="h-8" onClick={() => onBulkAction?.(Array.from(selected), 'approve')} disabled={selected.size === 0}>
              Approve selected ({selected.size})
            </Button>
            <Button size="sm" variant="destructive" className="h-8" onClick={() => onBulkAction?.(Array.from(selected), 'reject')} disabled={selected.size === 0}>
              Reject selected ({selected.size})
            </Button>
          </>
        )}
      </div>

      <Table className="min-w-[900px] text-sm dark:text-muted-foreground">
        <TableHeader>
          <TableRow className="dark:bg-muted/40">
            {columns.sel && <TableHead className="w-[40px] px-2"><Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(!!v)} /></TableHead>}
            {columns.student && <TableHead className="w-[30%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Applicant</TableHead>}
            {columns.program && <TableHead className="w-[28%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Program • SY</TableHead>}
            {columns.grades && <TableHead className="w-[14%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Grades</TableHead>}
            {columns.submitted && <TableHead className="w-[14%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Submitted</TableHead>}
            {columns.status && <TableHead className="w-[8%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Status</TableHead>}
            {columns.actions && <TableHead className="w-[6%] px-1 py-2 text-center dark:bg-muted/30 dark:text-muted-foreground">Actions</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {renderRows.map((r) => {
            const disp = buildDisplay(r);
            const grades = (r as any).grades as boolean;
            return (
              <TableRow key={`app-${r.application_id}`} className="hover:bg-muted/50 dark:hover:bg-muted/70">
                {columns.sel && (
                  <TableCell className="px-2">
                    <Checkbox
                      checked={selected.has(r.application_id)}
                      onCheckedChange={(v) =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (v) next.add(r.application_id);
                          else next.delete(r.application_id);
                          return next;
                        })
                      }
                    />
                  </TableCell>
                )}

                {columns.student && (
                  <TableCell className="px-2 py-2 font-semibold truncate leading-tight dark:text-foreground" style={{ maxWidth: '260px' }}>
                    <div className="truncate" title={disp.primary}>{disp.primary}</div>
                    <div className="text-xs font-normal text-muted-foreground mt-1 truncate">{disp.secondary}</div>
                  </TableCell>
                )}

                {columns.program && (
                  <TableCell className="px-2 py-2">
                    <span className="truncate block">{r.program || '—'}</span>
                    <div className="text-[11px] text-muted-foreground mt-1">{r.school_year || '—'}</div>
                  </TableCell>
                )}

                {columns.grades && <TableCell className="px-1 py-2 text-center">{gradeBadge(grades)}</TableCell>}
                {columns.submitted && (
                  <TableCell className="px-1 py-2 text-center">
                    <Badge variant="outline" className="rounded-full">{r.created_at ? 'Yes' : 'No'}</Badge>
                    {r.created_at ? <div className="text-[11px] text-muted-foreground mt-1">{format(new Date(r.created_at), 'MMM dd, yyyy')}</div> : null}
                  </TableCell>
                )}
                {columns.status && <TableCell className="px-1 py-2 text-center">{statusBadge(r.registrar_status)}</TableCell>}
                {columns.actions && (
                  <TableCell className="px-1 py-2 text-center">
                    <Button size="icon" variant="ghost" aria-label="Review" onClick={() => onReview(r)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {renderRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={Object.values(columns).filter(Boolean).length || 1} className="text-center py-16">
                <div className="text-muted-foreground">No records found.</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}