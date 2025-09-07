import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Filter, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import type { CompreExamApplicationSummary } from './Index';
import Details from './details';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type Columns = { student: boolean; program: boolean; eligibility: boolean; applied: boolean; appStatus: boolean; actions: boolean };

type Props = {
  paged: CompreExamApplicationSummary[];
  columns: Columns;
};

export default function TableCompreExam({ paged, columns }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedRow, setSelectedRow] = useState<CompreExamApplicationSummary | null>(null);

  // Eligibility filter
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'eligible' | 'not'>('all');
  // Applied filter
  const [appliedFilter, setAppliedFilter] = useState<'all' | 'yes' | 'no'>('all');
  // Application status filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'not_yet_applied'>('all');

  const headerChecked = selected.length > 0 && selected.length === paged.length;

  const sorted = useMemo(() => {
    // sort by submitted_at desc, nulls last
    return [...paged].sort((a, b) => {
      const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : -Infinity;
      const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : -Infinity;
      return bTime - aTime;
    });
  }, [paged]);

  // Apply all filters
  const filtered = useMemo(() => {
    let out = sorted;
    // eligibility
    if (eligibilityFilter === 'eligible') out = out.filter(r => r.eligible === true);
    else if (eligibilityFilter === 'not') out = out.filter(r => r.eligible === false);
    // applied
    if (appliedFilter === 'yes') out = out.filter(r => r.applied === true);
    else if (appliedFilter === 'no') out = out.filter(r => r.applied === false);
    // application status
    if (statusFilter !== 'all') {
      out = out.filter(r => (r.application_status || 'not_yet_applied') === statusFilter);
    }
    return out;
  }, [sorted, eligibilityFilter, appliedFilter, statusFilter]);

  function toggleSelectAll() {
    setSelected(headerChecked ? [] : paged.map(p => p.id));
  }
  function toggleSelectOne(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const eligBadge = (ok: boolean) => {
    return (
      <Badge
        className={
          'rounded-full ' +
          (ok
            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900'
            : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900')
        }
        variant="outline"
      >
        {ok ? 'Eligible' : 'Not eligible'}
      </Badge>
    );
  };

  const appStatusBadge = (s: CompreExamApplicationSummary['application_status']) => {
    const v = s || 'not_yet_applied';
    const map: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900',
      rejected: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
      pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
      not_yet_applied: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800',
    };
    const label = v === 'not_yet_applied' ? 'Not yet applied' : v[0].toUpperCase() + v.slice(1);
    return <Badge className={'rounded-full ' + map[v]} variant="outline">{label}</Badge>;
  };

  const eligLabel = eligibilityFilter === 'all' ? 'All' : eligibilityFilter === 'eligible' ? 'Eligible' : 'Not eligible';
  const appliedLabel = appliedFilter === 'all' ? 'All' : appliedFilter === 'yes' ? 'Yes' : 'No';
  const statusLabelMap: Record<typeof statusFilter, string> = {
    all: 'All',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    not_yet_applied: 'Not yet applied',
  };

  return (
    <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-background dark:border-border w-full max-w-full">
      {/* Toolbar with Filters */}
      
      <div className="flex flex-wrap items-center justify-end gap-2 px-3 py-3 border-b bg-muted/20 dark:bg-muted/10">
        {/* Eligibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-2 h-4 w-4" />
              Eligibility: {eligLabel}
            </Button>
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

        {/* Applied */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-2 h-4 w-4" />
              Applied: {appliedLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setAppliedFilter('all')} className="flex items-center justify-between">
              All {appliedFilter === 'all' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAppliedFilter('yes')} className="flex items-center justify-between">
              Yes {appliedFilter === 'yes' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAppliedFilter('no')} className="flex items-center justify-between">
              No {appliedFilter === 'no' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Application Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-2 h-4 w-4" />
              Status: {statusLabelMap[statusFilter]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setStatusFilter('all')} className="flex items-center justify-between">
              All {statusFilter === 'all' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('approved')} className="flex items-center justify-between">
              Approved {statusFilter === 'approved' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="flex items-center justify-between">
              Pending {statusFilter === 'pending' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('rejected')} className="flex items-center justify-between">
              Rejected {statusFilter === 'rejected' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('not_yet_applied')} className="flex items-center justify-between">
              Not yet applied {statusFilter === 'not_yet_applied' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table className="min-w-[900px] text-sm dark:text-muted-foreground">
        <TableHeader>
          <TableRow className="dark:bg-muted/40">
            <TableHead className="w-[4%] py-2 dark:bg-muted/30 dark:texxt-muted-foreground">
              <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
            </TableHead>
            {columns.student && <TableHead className="w-[28%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Student</TableHead>}
            {columns.program && <TableHead className="w-[22%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Program</TableHead>}
            {columns.eligibility && <TableHead className="w-[14%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Eligibility</TableHead>}
            {columns.applied && <TableHead className="w-[10%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Applied</TableHead>}
            {columns.appStatus && <TableHead className="w-[16%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Application status</TableHead>}
            {columns.actions && <TableHead className="w-[10%] px-1 py-2 text-center dark:bg-muted/30 dark:text-muted-foreground">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r, i) => (
            <TableRow key={r.id} className="hover:bg-muted/50 dark:hover:bg-muted/70">
              <TableCell className="px-2 py-2">
                <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleSelectOne(r.id)} />
              </TableCell>

              {columns.student && (
                <TableCell className="px-2 py-2 font-semibold truncate leading-tight dark:text-foreground" style={{ maxWidth: '260px' }}>
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

              {columns.eligibility && (
                <TableCell className="px-1 py-2 text-center">{eligBadge(r.eligible)}</TableCell>
              )}

              {columns.applied && (
                <TableCell className="px-1 py-2 text-center">
                  <Badge variant="outline" className="rounded-full">
                    {r.applied ? 'Yes' : 'No'}
                  </Badge>
                  {r.submitted_at ? (
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {format(new Date(r.submitted_at), 'MMM dd, yyyy')}
                    </div>
                  ) : null}
                </TableCell>
              )}

              {columns.appStatus && (
                <TableCell className="px-1 py-2 text-center">
                  {appStatusBadge(r.application_status)}
                </TableCell>
              )}

              {columns.actions && (
                <TableCell className="px-1 py-2 text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRow(r);
                          setSelectedIndex(i);
                        }}
                        title="Details"
                        className="dark:bg-muted/30"
                      >
                        <Info />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl min-w-260 w-full max-h-[90vh]">
                      <div className="max-h-[80vh] overflow-y-auto px-1">
                        {selectedRow && <Details application={selectedRow} />}
                      </div>
                    </DialogContent>
                  </Dialog>
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