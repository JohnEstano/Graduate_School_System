import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Filter, Check, CheckCircle, CircleX, CircleArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
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
};

export default function TableComprePayment({ paged, columns, tabType, onRowApprove, onRowReject, onRowRetrieve }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedRow, setSelectedRow] = useState<ComprePaymentSummary | null>(null);
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const headerChecked = selected.length > 0 && selected.length === paged.length;

  const sorted = useMemo(() => {
    return [...paged].sort((a, b) => {
      const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : -Infinity;
      const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : -Infinity;
      return bTime - aTime;
    });
  }, [paged]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return sorted;
    return sorted.filter(r => r.status === statusFilter);
  }, [sorted, statusFilter]);

  function toggleSelectAll() {
    setSelected(headerChecked ? [] : paged.map(p => p.id));
  }
  function toggleSelectOne(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const statusBadge = (s?: string | null) => {
    const v = String(s || 'pending').toLowerCase();
    const cls =
      v === 'approved'
        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900'
        : v === 'rejected'
        ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900'
        : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
    return <Badge className={`rounded-full ${cls}`} variant="outline">{v[0].toUpperCase() + v.slice(1)}</Badge>;
  };

  const money = (amt?: number | null) =>
    amt == null || isNaN(Number(amt))
      ? '—'
      : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(amt));

  const statusLabel = statusFilter === 'all' ? 'All' : statusFilter[0].toUpperCase() + statusFilter.slice(1);

  function doApprove(id: number) {
    setSubmitting(true);
    router.post(route('coordinator.compre-payment.approve', id), {}, {
      preserveScroll: true,
      onFinish: () => { setSubmitting(false); setApproveId(null); },
    });
  }
  function doReject(id: number) {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    router.post(route('coordinator.compre-payment.reject', id), { remarks: rejectReason.trim() }, {
      preserveScroll: true,
      onFinish: () => { setSubmitting(false); setRejectId(null); setRejectReason(''); },
    });
  }

  return (
    <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-background dark:border-border w-full max-w-full">
      {/* Toolbar with filters */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-b bg-muted/20 dark:bg-muted/10">
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

              {columns.amount && (
                <TableCell className="px-2 py-2 text-right">
                  {money(r.amount)}
                </TableCell>
              )}

              {columns.date && (
                <TableCell className="px-1 py-2 text-center whitespace-nowrap">
                  {r.submitted_at ? format(new Date(r.submitted_at), 'MMM dd, yyyy') : '—'}
                </TableCell>
              )}

              {columns.status && (
                <TableCell className="px-1 py-2 text-center">
                  {statusBadge(r.status)}
                </TableCell>
              )}

              {columns.actions && (
                <TableCell className="px-1 py-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRow(r)}
                          title="Details"
                          className="dark:bg-muted/30"
                        >
                          <Info />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl min-w-260 w-full max-h-[90vh]">
                        <div className="max-h-[80vh] overflow-y-auto px-1">
                          {selectedRow && <Details payment={selectedRow} />}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {tabType === 'pending' && (
                      <>
                        {/* Reject modal (with reason) */}
                        <Button
                          size="sm"
                          variant="outline"
                          title="Reject"
                          onClick={() => { setRejectId(r.id); setRejectReason(''); }}
                          className="text-red-500 hover:text-red-500"
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
                            >
                              <CheckCircle size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approve this payment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the submission as approved. The student will see the status update.
                              </AlertDialogDescription>
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
                              <p className="text-sm text-muted-foreground">
                                Provide a reason. The student will see this message.
                              </p>
                              <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection"
                                rows={4}
                              />
                              <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setRejectId(null)} disabled={submitting}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => doReject(r.id)}
                                  disabled={submitting || rejectReason.trim().length < 3}
                                >
                                  {submitting ? 'Rejecting…' : 'Confirm Reject'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}

                    {tabType === 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Retrieve"
                        onClick={() => onRowRetrieve && onRowRetrieve(r.id)}
                        className="text-blue-500 hover:text-blue-500"
                      >
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
    </div>
  );
}