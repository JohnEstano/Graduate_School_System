import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Filter, Check, CheckCircle, CircleX, CircleArrowLeft, X } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import type { ComprePaymentSummary } from './Index';
import Details from './details';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog';

type Columns = { student: boolean; program: boolean; reference: boolean; amount: boolean; date: boolean; status: boolean; actions: boolean };

type Props = {
  paged: ComprePaymentSummary[];
  columns: Columns;
  tabType?: 'pending' | 'approved' | 'rejected';
  onRowApprove?: (id: number) => void;
  onRowReject?: (id: number) => void;
  onRowRetrieve?: (id: number) => void;
  showStatusFilter?: boolean; // NEW
};

export default function TableComprePayment({
  paged, columns, tabType, onRowApprove, onRowReject, onRowRetrieve, showStatusFilter,
}: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedRow, setSelectedRow] = useState<ComprePaymentSummary | null>(null);
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bulk dialog state
  const [approveManyOpen, setApproveManyOpen] = useState(false);
  const [rejectManyOpen, setRejectManyOpen] = useState(false);
  const [rejectManyReason, setRejectManyReason] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const sorted = useMemo(() => {
    return [...paged].sort((a, b) => {
      const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : -Infinity;
      const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : -Infinity;
      return bTime - aTime;
    });
  }, [paged]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return sorted;
    return sorted.filter((r) => r.status === statusFilter);
  }, [sorted, statusFilter]);

  const headerChecked = selected.length > 0 && selected.length === filtered.length;

  function toggleSelectAll() {
    setSelected(headerChecked ? [] : filtered.map((p) => p.id));
  }
  function toggleSelectOne(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const statusBadge = (s?: string | null) => {
    const v = String(s || 'pending').toLowerCase();
    const cls =
      v === 'approved'
        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900'
        : v === 'rejected'
        ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
        : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
    return (
      <Badge className={`rounded-full ${cls}`} variant="outline">
        {v[0].toUpperCase() + v.slice(1)}
      </Badge>
    );
  };

  const money = (amt?: number | null) =>
    amt == null || isNaN(Number(amt)) ? '—' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(amt));

  const statusLabel = statusFilter === 'all' ? 'All' : statusFilter[0].toUpperCase() + statusFilter.slice(1);
  const shouldShowStatusFilter = showStatusFilter ?? !tabType;

  function refreshLight() {
    router.reload({ only: ['pending', 'approved', 'rejected', 'counts'], preserveUrl: true });
  }

  function doApprove(id: number) {
    setSubmitting(true);
    router.post(route('coordinator.compre-payment.approve', id), {}, {
      preserveScroll: true,
      onSuccess: refreshLight,
      onFinish: () => {
        setSubmitting(false);
        setApproveId(null);
      },
    });
  }
  function doReject(id: number) {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    router.post(route('coordinator.compre-payment.reject', id), { remarks: rejectReason.trim() }, {
      preserveScroll: true,
      onSuccess: refreshLight,
      onFinish: () => {
        setSubmitting(false);
        setRejectId(null);
        setRejectReason('');
      },
    });
  }

  // Bulk actions
  function doApproveMany(ids: number[]) {
    if (!ids.length) return;
    setSubmitting(true);
    router.post(route('coordinator.compre-payment.bulk-approve'), { ids }, {
      preserveScroll: true,
      onSuccess: () => {
        setSelected([]);
        refreshLight();
      },
      onFinish: () => {
        setSubmitting(false);
        setApproveManyOpen(false);
      },
    });
  }
  function doRejectMany(ids: number[], reason: string) {
    if (!ids.length || !reason.trim()) return;
    setSubmitting(true);
    router.post(route('coordinator.compre-payment.bulk-reject'), { ids, remarks: reason.trim() }, {
      preserveScroll: true,
      onSuccess: () => {
        setSelected([]);
        refreshLight();
      },
      onFinish: () => {
        setSubmitting(false);
        setRejectManyOpen(false);
        setRejectManyReason('');
      },
    });
  }

  // Keep selection in sync with visible rows
  useEffect(() => {
    setSelected(prev => prev.filter(id => filtered.some(r => r.id === id)));
  }, [/* filtered list change should prune invalid selections */ filtered]);

  // Show bulk bar only on Pending tab with selections
  const showBulk = tabType === 'pending' && selected.length > 0;

  return (
    <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-background dark:border-border w-full max-w-full">
      {/* Toolbar: only status dropdown on the right */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-b bg-muted/20 dark:bg-muted/10">
        {shouldShowStatusFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="mr-2 h-4 w-4" />
                Status: {statusLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className="flex items-center justify-between">
                All {statusFilter === 'all' && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="flex items-center justify-between">
                Pending {statusFilter === 'pending' && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('approved')} className="flex items-center justify-between">
                Approved {statusFilter === 'approved' && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('rejected')} className="flex items-center justify-between">
                Rejected {statusFilter === 'rejected' && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Table className="min-w-[900px] text-sm dark:text-muted-foreground">
        <TableHeader>
          <TableRow className="dark:bg-muted/40">
            <TableHead className="w-[4%] py-2 dark:bg-muted/30 dark:text-muted-foreground">
              <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
            </TableHead>
            {columns.student && <TableHead className="w-[22%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Student</TableHead>}
            {columns.program && <TableHead className="w-[18%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Program</TableHead>}
            {columns.reference && <TableHead className="w-[16%] px-2 dark:bg-muted/30 dark:text-muted-foreground">OR / Reference</TableHead>}
            {columns.amount && <TableHead className="w-[10%] text-right px-2 py-2 dark:bg-muted/30 dark:text-muted-foreground">Amount</TableHead>}
            {columns.date && <TableHead className="w-[12%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Date</TableHead>}
            {columns.status && <TableHead className="w-[12%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Status</TableHead>}
            {columns.actions && <TableHead className="w-[14%] px-1 py-2 text-center dark:bg-muted/30 dark:text-muted-foreground">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/50 dark:hover:bg-muted/70">
              <TableCell className="px-2 py-2">
                <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleSelectOne(r.id)} />
              </TableCell>

              {columns.student && (
                <TableCell className="px-2 py-2 font-semibold truncate leading-tight dark:text-foreground" style={{ maxWidth: '220px' }}>
                  <div className="truncate" title={`${r.last_name}, ${r.first_name}`}>
                    {r.last_name}, {r.first_name} {r.middle_name ? `${r.middle_name[0]}.` : ''}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground mt-1 truncate">
                    {r.email || '—'} {r.school_id ? `• ${r.school_id}` : ''}
                  </div>
                </TableCell>
              )}

              {columns.program && (
                <TableCell className="px-2 py-2">
                  <span className="truncate block">{r.program || '—'}</span>
                </TableCell>
              )}

              {columns.reference && (
                <TableCell className="px-2 py-2">
                  <span className="truncate block">{r.reference || '—'}</span>
                </TableCell>
              )}

              {columns.amount && <TableCell className="px-2 py-2 text-right">{money(r.amount)}</TableCell>}

              {columns.date && (
                <TableCell className="px-1 py-2 text-center whitespace-nowrap">
                  {r.submitted_at ? format(new Date(r.submitted_at), 'MMM dd, yyyy') : '—'}
                </TableCell>
              )}

              {columns.status && <TableCell className="px-1 py-2 text-center">{statusBadge(r.status)}</TableCell>}

              {columns.actions && (
                <TableCell className="px-1 py-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedRow(r)} title="Details" className="dark:bg-muted/30">
                          <Info />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md w-full max-h-[90vh]">
                        <div className="max-h-[80vh] overflow-y-auto">{selectedRow && <Details payment={selectedRow} />}</div>
                      </DialogContent>
                    </Dialog>

                    {tabType === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Reject"
                          onClick={() => {
                            setRejectId(r.id);
                            setRejectReason('');
                          }}
                          className="text-rose-500 hover:text-rose-500"
                          disabled={submitting}
                          aria-disabled={submitting}
                        >
                          <CircleX size={16} />
                        </Button>

                        {/* Approve confirmation */}
                        <AlertDialog open={approveId === r.id} onOpenChange={(open) => !open && setApproveId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Approve"
                              onClick={() => setApproveId(r.id)}
                              className="text-green-500 hover:text-green-500"
                              disabled={submitting}
                              aria-disabled={submitting}
                            >
                              <CheckCircle size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approve this payment?</AlertDialogTitle>
                              <AlertDialogDescription>This will mark the submission as approved. The student will see the status update.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                              <AlertDialogAction disabled={submitting} onClick={() => doApprove(r.id)}>
                                {submitting ? 'Approving…' : 'Approve'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Reject dialog with reason */}
                        <Dialog open={rejectId === r.id} onOpenChange={(open) => !open && setRejectId(null)}>
                          <DialogContent className="max-w-md">
                            <div className="space-y-2">
                              <h3 className="text-base font-semibold">Reject this payment</h3>
                              <p className="text-sm text-muted-foreground">Provide a reason. The student will see this message.</p>
                              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection" rows={4} />
                              <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setRejectId(null)} disabled={submitting}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => doReject(r.id)} disabled={submitting || rejectReason.trim().length < 3}>
                                  {submitting ? 'Rejecting…' : 'Confirm Reject'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}

                    {tabType === 'rejected' && (
                      <Button size="sm" variant="outline" title="Retrieve" onClick={() => onRowRetrieve && onRowRetrieve(r.id)} className="text-blue-500 hover:text-blue-500">
                        <CircleArrowLeft size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={Object.values(columns).filter(Boolean).length + 1} className="text-center py-16">
                <div className="text-muted-foreground">No records found.</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Floating bulk action bar (centered bottom) with subtle animation */}
      <div
        role="region"
        aria-label="Bulk actions"
        aria-hidden={!showBulk}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                    transition-all duration-200 ease-out
                    ${showBulk ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-3 scale-95 pointer-events-none'}`}
      >
        <div
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur
                     dark:border-slate-800 dark:bg-slate-900/95 transition-shadow"
        >
          <span className="text-sm text-muted-foreground">
            {selected.length} selected
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setApproveManyOpen(true)}
            disabled={submitting}
            className="gap-1 hover:bg-rose-500 hover:text-white disabled:opacity-50"
            aria-disabled={submitting}
            title="Approve selected"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => setRejectManyOpen(true)}
            disabled={submitting}
            className="gap-1"
            aria-disabled={submitting}
            title="Reject selected"
          >
            <CircleX className="h-4 w-4" />
            Reject
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected([])}
            disabled={submitting}
            className="gap-1"
            aria-disabled={submitting}
            title="Clear selection"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Bulk Approve dialog */}
      <AlertDialog open={approveManyOpen} onOpenChange={setApproveManyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {selected.length} selected payment(s)?</AlertDialogTitle>
            <AlertDialogDescription>This will mark all selected pending payments as approved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={() => doApproveMany(selected)}>
              {submitting ? 'Approving…' : 'Approve selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Reject dialog */}
      <Dialog open={rejectManyOpen} onOpenChange={setRejectManyOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Reject {selected.length} selected payment(s)</h3>
            <p className="text-sm text-muted-foreground">Provide a reason. The student will see this message.</p>
            <Textarea
              value={rejectManyReason}
              onChange={(e) => setRejectManyReason(e.target.value)}
              placeholder="Reason for rejection"
              rows={4}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRejectManyOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => doRejectMany(selected, rejectManyReason)}
                disabled={submitting || rejectManyReason.trim().length < 3}
              >
                {submitting ? 'Rejecting…' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}