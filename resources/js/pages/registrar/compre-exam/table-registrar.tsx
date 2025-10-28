import { useMemo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Check, Eye, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UIC_PROGRAMS } from '@/constants/programs';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  // Allow optional reason (for reject)
  onBulkAction?: (ids: number[], action: 'approve' | 'reject', reason?: string) => void;
};

export default function TableRegistrar({ rows, programs, onVisibleCountChange, onReview, onBulkAction, columns: cols }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const columns: Columns = {
    sel: true,
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [programOpen, setProgramOpen] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);

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

  // Pagination (client-side, consistent with payment/schedule)
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    // reset to first page when local filters change
    setPage(1);
  }, [programFilter, eligibilityFilter, statusFilter, rows]);
  const total = renderRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageRows = useMemo(() => renderRows.slice(pageStart, pageStart + pageSize), [renderRows, pageStart]);

  // Program options: available (from current rows) and all (rows + prop programs + canonical)
  const { programsAvailable, programsAll } = useMemo(() => {
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');
    const keepFirst = (names: (string | null | undefined)[]) => {
      const map = new Map<string, string>();
      for (const n of names) {
        if (!n) continue;
        const v = normalize(n);
        const key = v.toLowerCase();
        if (!map.has(key)) map.set(key, v);
      }
      return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
    };
    const fromApplicants = keepFirst(rows.map(r => r.program));
    const fromProps = keepFirst(programs ?? []);
    const fromCanonical = keepFirst(UIC_PROGRAMS);
    const all = keepFirst([...fromApplicants, ...fromProps, ...fromCanonical]);
    return { programsAvailable: fromApplicants, programsAll: all };
  }, [rows, programs]);

  const programChoices = showAllPrograms ? programsAll : programsAvailable;

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

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.application_id));
  const toggleAll = (checked: boolean) => {
    const next = new Set<number>();
    if (checked) pageRows.forEach((r) => next.add(r.application_id));
    setSelected(next);
  };

  // Bulk dialog states and helpers (mirroring coordinator payment UI)
  const [approveManyOpen, setApproveManyOpen] = useState(false);
  const [rejectManyOpen, setRejectManyOpen] = useState(false);
  const [rejectManyReason, setRejectManyReason] = useState('');

  // Selected subsets
  const selectedArray = useMemo(() => Array.from(selected), [selected]);
  const selectedRows = useMemo(() => renderRows.filter(r => selected.has(r.application_id)), [renderRows, selected]);
  const selectedPendingIds = useMemo(() => selectedRows.filter(r => (r.registrar_status ?? 'pending') === 'pending').map(r => r.application_id), [selectedRows]);
  // If needed later, we can derive rejected IDs similarly to payments UI

  // Bulk actions
  const doApproveMany = () => {
    if (!onBulkAction || selectedPendingIds.length === 0) return;
    onBulkAction(selectedPendingIds, 'approve');
    setSelected(new Set());
    setApproveManyOpen(false);
  };
  const doRejectMany = () => {
    const reason = rejectManyReason.trim();
    if (!onBulkAction || selectedPendingIds.length === 0 || reason.length < 3) return;
    onBulkAction(selectedPendingIds, 'reject', reason);
    setSelected(new Set());
    setRejectManyOpen(false);
    setRejectManyReason('');
  };
  // Retrieve flow is not included for registrar at this time

  return (
    <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-background dark:border-border w-full max-w-full">
      {/* Toolbar */}
  <div className="flex flex-wrap items-center justify-end gap-2 px-3 py-3 border-b bg-muted/20 dark:bg-muted/10">
        {/* Program (dean-style searchable with scope toggle) */}
        <Popover open={programOpen} onOpenChange={setProgramOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <GraduationCap className="mr-2 h-4 w-4" />
              Program: {programFilter === 'all' ? 'All' : programFilter}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-80" align="end">
            <Command shouldFilter={true}>
              <CommandInput placeholder="Search program…" />
              <CommandEmpty>No program found.</CommandEmpty>
              <CommandList className="max-h-64 overflow-y-auto">
                <CommandGroup heading="Scope">
                  <CommandItem
                    value={showAllPrograms ? 'available-only' : 'all-programs'}
                    onSelect={() => setShowAllPrograms(v => !v)}
                  >
                    {showAllPrograms ? 'Show only current applicants' : 'Show all programs'}
                  </CommandItem>
                </CommandGroup>
                <CommandGroup heading="Programs">
                  <CommandItem
                    value="all"
                    onSelect={() => { setProgramFilter('all'); setProgramOpen(false); }}
                  >
                    All programs {programFilter === 'all' && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                  {programChoices.map((p) => (
                    <CommandItem
                      key={p}
                      value={p}
                      onSelect={() => { setProgramFilter(p); setProgramOpen(false); }}
                    >
                      {p} {programFilter === p && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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

        {/* Bulk actions are available via floating bar when selection is not empty */}
      </div>

      <Table className="min-w-[900px] text-sm dark:text-muted-foreground">
        <TableHeader>
          <TableRow className="dark:bg-muted/40">
            {columns.sel && <TableHead className="w-[40px] px-2"><Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(!!v)} aria-label="Select all" /></TableHead>}
            {columns.student && <TableHead className="w-[30%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Applicant</TableHead>}
            {columns.program && <TableHead className="w-[28%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Program • SY</TableHead>}
            {columns.grades && <TableHead className="w-[14%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Grades</TableHead>}
            {columns.submitted && <TableHead className="w-[14%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Submitted</TableHead>}
            {columns.status && <TableHead className="w-[8%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Status</TableHead>}
            {columns.actions && <TableHead className="w-[6%] px-1 py-2 text-center dark:bg-muted/30 dark:text-muted-foreground">Actions</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {pageRows.map((r) => {
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
                      aria-label="Select row"
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

      {/* Floating bulk action bar (centered bottom) */}
      {selectedArray.length > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-200 ease-out opacity-100 translate-y-0 scale-100 pointer-events-auto"
        >
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <span className="text-sm text-muted-foreground">
              {selectedArray.length} selected • {selectedPendingIds.length} pending
            </span>
            <Button size="sm" variant="outline" onClick={() => setApproveManyOpen(true)} disabled={selectedPendingIds.length === 0} className="gap-1">
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setRejectManyOpen(true)} disabled={selectedPendingIds.length === 0} className="gap-1">
              Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="gap-1">
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Footer pagination (consistent with coordinator payment/schedule) */}
      <div className="px-1 py-2 flex items-center justify-between mt-2">
        <div className="text-sm text-muted-foreground ml-2">Showing {total} application{total === 1 ? '' : 's'}</div>
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
          <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
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

      {/* Bulk Approve dialog */}
      <AlertDialog open={approveManyOpen} onOpenChange={setApproveManyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {selectedPendingIds.length} pending application(s)?</AlertDialogTitle>
            <AlertDialogDescription>Only pending selections will be approved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doApproveMany} disabled={selectedPendingIds.length === 0}>Approve pending</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Reject dialog */}
      <Dialog open={rejectManyOpen} onOpenChange={setRejectManyOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Reject {selectedPendingIds.length} pending application(s)</h3>
            <p className="text-sm text-muted-foreground">Provide a reason. Only pending selections will be rejected.</p>
            <Textarea value={rejectManyReason} onChange={(e) => setRejectManyReason(e.target.value)} placeholder="Reason for rejection" rows={4} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRejectManyOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={doRejectMany} disabled={rejectManyReason.trim().length < 3 || selectedPendingIds.length === 0}>Confirm Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* No bulk retrieve for registrar at the moment */}
    </div>
  );
}