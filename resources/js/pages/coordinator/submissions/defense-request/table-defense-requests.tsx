import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ChevronsUpDown, Eye, CheckCircle, CircleX, CircleArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { router } from '@inertiajs/react';

export type DefenseRequestSummary = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  program: string;
  thesis_title: string;
  date_of_defense: string;
  defense_type: string;
  mode_defense: string;
  status: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info';
  priority: 'Low' | 'Medium' | 'High';
  last_status_updated_by?: string;
  last_status_updated_at?: string;
  workflow_state?: string;
};

export type TableDefenseRequestsProps = {
  paged: DefenseRequestSummary[];
  columns: Record<string, boolean>;
  selected: number[];
  toggleSelectOne: (id: number) => void;
  headerChecked: boolean;
  toggleSelectAll: () => void;
  toggleSort: () => void;
  sortDir: 'asc' | 'desc' | null | undefined;
  onPriorityChange: (id: number, priority: string) => Promise<void>;
  tabType?: 'pending' | 'rejected' | 'approved';
  onViewDetails?: (id: number) => void;
  onRowApprove?: (id: number) => void;
  onRowReject?: (id: number) => void;
  onRowRetrieve?: (id: number) => void;
};

export default function TableDefenseRequests({
  paged,
  columns,
  selected,
  toggleSelectOne,
  headerChecked,
  toggleSelectAll,
  toggleSort,
  sortDir,
  onPriorityChange,
  tabType,
  onViewDetails,
  onRowApprove,
  onRowReject,
  onRowRetrieve
}: TableDefenseRequestsProps) {
  const showProgress = tabType === 'approved' && columns.progress;

  return (
    <div className="relative w-full">
      {/* Contain horizontal scroll INSIDE this div only */}
      <div className="overflow-x-auto w-full rounded-md border border-border bg-background">
        <Table className="w-full text-sm table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] py-2">
                <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
              </TableHead>
              {columns.title && <TableHead className="px-2">Title</TableHead>}
              {columns.presenter && <TableHead className="px-2">Presenter</TableHead>}
              {columns.date && (
                <TableHead
                  className="text-center cursor-pointer px-1 py-2"
                  onClick={toggleSort}
                >
                  <div className="flex justify-center items-center gap-1">
                    <span>Date</span>
                    {sortDir === 'asc' && <ArrowUp size={12} />}
                    {sortDir === 'desc' && <ArrowDown size={12} />}
                    {!sortDir && <ChevronsUpDown size={12} className="opacity-60" />}
                  </div>
                </TableHead>
              )}
              {columns.mode && <TableHead className="text-center px-1 py-2">Mode</TableHead>}
              {columns.type && <TableHead className="text-center px-1 py-2">Type</TableHead>}
              {columns.priority && <TableHead className="text-center px-1 py-2">Priority</TableHead>}
              {showProgress && <TableHead className="text-center px-1 py-2">Progress</TableHead>}
              <TableHead className="text-center px-1 py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged
              .slice()
              .sort((a, b) => {
                const da = a.date_of_defense ? new Date(a.date_of_defense).getTime() : 0;
                const db = b.date_of_defense ? new Date(b.date_of_defense).getTime() : 0;
                return db - da;
              })
              .map(r => {
                const isSelected = selected.includes(r.id);
                return (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="px-2 py-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOne(r.id)}
                      />
                    </TableCell>

                    {columns.title && (
                      <TableCell
                        className="px-2 py-2 font-medium truncate leading-tight"
                        title={r.thesis_title}
                      >
                        <div className="truncate">{r.thesis_title}</div>
                      </TableCell>
                    )}

                    {columns.presenter && (
                      <TableCell
                        className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap"
                        title={`${r.first_name} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name}`}
                      >
                        {r.first_name} {r.middle_name ? r.middle_name[0] + '. ' : ''}{r.last_name}
                      </TableCell>
                    )}

                    {columns.date && (
                      <TableCell className="px-1 py-2 text-center whitespace-nowrap">
                        {r.date_of_defense && !isNaN(new Date(r.date_of_defense).getTime())
                          ? format(new Date(r.date_of_defense), 'MMM dd, yyyy')
                          : '—'}
                      </TableCell>
                    )}

                    {columns.mode && (
                      <TableCell className="px-1 py-2 text-center capitalize">
                        {r.mode_defense?.replace('-', ' ') || '—'}
                      </TableCell>
                    )}

                    {columns.type && (
                      <TableCell className="px-1 py-2 text-center">
                        <Badge variant="outline">{r.defense_type || '—'}</Badge>
                      </TableCell>
                    )}

                    {columns.priority && (
                      <TableCell className="px-1 py-2 text-center">
                        <Badge
                          onClick={() =>
                            onPriorityChange(
                              r.id,
                              r.priority === 'High'
                                ? 'Medium'
                                : r.priority === 'Medium'
                                ? 'Low'
                                : 'High'
                            )
                          }
                          className={
                            'cursor-pointer ' +
                            (r.priority === 'High'
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : r.priority === 'Low'
                              ? 'bg-sky-100 text-sky-700 border-sky-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200')
                          }
                          variant="outline"
                        >
                          {r.priority}
                        </Badge>
                      </TableCell>
                    )}

                    {showProgress && (
                      <TableCell className="px-1 py-2 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <Progress value={40} className="w-full h-2" />
                          <span className="text-[11px] text-muted-foreground">In Progress</span>
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="px-1 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {tabType === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-8 p-0 text-green-600"
                              title="Approve"
                              onClick={() => onRowApprove && onRowApprove(r.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-8 p-0 text-red-600"
                              title="Reject"
                              onClick={() => onRowReject && onRowReject(r.id)}
                            >
                              <CircleX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {tabType === 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-8 p-0 text-blue-600"
                            title="Retrieve (set back to Pending)"
                            onClick={() => onRowRetrieve && onRowRetrieve(r.id)}
                          >
                            <CircleArrowLeft className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-8 p-0"
                          onClick={() =>
                            onViewDetails
                              ? onViewDetails(r.id)
                              : router.visit(`/coordinator/defense-requests/${r.id}/details`)
                          }
                          title="Open details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={
                    1 +
                    (columns.title ? 1 : 0) +
                    (columns.presenter ? 1 : 0) +
                    (columns.date ? 1 : 0) +
                    (columns.mode ? 1 : 0) +
                    (columns.type ? 1 : 0) +
                    (columns.priority ? 1 : 0) +
                    (showProgress ? 1 : 0) +
                    1
                  }
                  className="text-center py-10 text-muted-foreground"
                >
                  No requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}