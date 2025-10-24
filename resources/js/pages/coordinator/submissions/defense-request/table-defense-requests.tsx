import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, DollarSign, Banknote, Hourglass, CircleCheck } from 'lucide-react';
import { format } from 'date-fns';
import { router } from '@inertiajs/react';

export type DefenseRequestSummary = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  program: string;
  thesis_title: string;
  date_of_defense?: string;
  scheduled_date?: string | null;
  defense_type: string;
  mode_defense?: string;
  defense_mode?: string;
  status: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info';
  priority: 'Low' | 'Medium' | 'High';
  last_status_updated_by?: string;
  last_status_updated_at?: string;
  workflow_state?: string;
  adviser?: string;
  aa_status?: 'pending' | 'ready_for_finance' | 'in_progress' | 'paid' | 'completed' | null;
};

export type TableDefenseRequestsProps = {
  paged: DefenseRequestSummary[];
  columns: Record<string, boolean>;
  toggleSort: () => void;
  sortDir: 'asc' | 'desc' | null | undefined;
  onPriorityChange: (id: number, priority: string) => Promise<void>;
  tabType?: 'pending' | 'rejected' | 'approved';
  onViewDetails?: (id: number) => void;
  onRowApprove?: (id: number) => void;
  onRowReject?: (id: number) => void;
  onRowRetrieve?: (id: number) => void;
  highlightMissingDateMode?: boolean;
  hideActions?: boolean;
  hideSelect?: boolean;
};

function getAaStatusBadge(status?: 'pending' | 'ready_for_finance' | 'in_progress' | 'paid' | 'completed' | null) {
  if (!status) {
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">—</Badge>;
  }
  if (status === 'completed') {
    return <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1"><CircleCheck className="h-3 w-3" />Completed</Badge>;
  }
  if (status === 'paid') {
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1"><Banknote className="h-3 w-3" />Paid</Badge>;
  }
  if (status === 'ready_for_finance') {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1"><DollarSign className="h-3 w-3" />Ready for Finance</Badge>;
  }
  if (status === 'in_progress') {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1"><Hourglass className="h-3 w-3" />In Progress</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
}

export default function TableDefenseRequests({
  paged,
  columns,
  toggleSort,
  sortDir,
  onPriorityChange,
  tabType,
  onViewDetails,
  onRowApprove,
  onRowReject,
  onRowRetrieve,
  highlightMissingDateMode,
  hideActions,
  hideSelect
}: TableDefenseRequestsProps) {
  return (
    <div className="relative w-full">
      <div className="overflow-x-auto rounded-md border border-border bg-background">
        <Table className="w-full text-sm table-auto">
          <TableHeader>
            <TableRow>
              {columns.title && <TableHead className="px-3 min-w-[180px]">Thesis Title</TableHead>}
              {columns.presenter && <TableHead className="px-2 min-w-[120px]">Presenter</TableHead>}
              {columns.adviser && <TableHead className="px-2 min-w-[120px]">Adviser</TableHead>}
              {columns.program && <TableHead className="px-2 min-w-[100px]">Program</TableHead>}
              {/* Coordinator Status */}
              {columns.status && <TableHead className="px-2 min-w-[100px] text-center">Coordinator Status</TableHead>}
              {/* AA Status */}
              <TableHead className="px-2 min-w-[100px] text-center">AA Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map(r => {
              const handleRowClick = (e: React.MouseEvent) => {
                const tag = (e.target as HTMLElement).tagName;
                if (
                  tag === 'BUTTON' ||
                  tag === 'INPUT' ||
                  tag === 'SELECT' ||
                  (e.target as HTMLElement).closest('.action-btn') ||
                  (e.target as HTMLElement).closest('.priority-dropdown')
                ) {
                  return;
                }
                if (onViewDetails) onViewDetails(r.id);
                else router.visit(`/coordinator/defense-requests/${r.id}/details`);
              };

              return (
                <TableRow
                  key={r.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={handleRowClick}
                >
                  {columns.title && (
                    <TableCell className="px-3 py-2 font-medium truncate leading-tight align-middle" title={r.thesis_title}>
                      <Badge variant="outline" className="mr-2">
                        {r.defense_type || '—'}
                      </Badge>
                      {r.thesis_title}
                    </TableCell>
                  )}
                  {columns.presenter && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle" title={`${r.first_name} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name}`}>
                      {r.first_name} {r.middle_name ? r.middle_name[0] + '. ' : ''}{r.last_name}
                    </TableCell>
                  )}
                  {columns.adviser && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {/* Fix: Render adviser name from r.adviser, fallback to blank if not present */}
                        {r.adviser && r.adviser.trim() !== '' ? r.adviser : '—'}
                    </TableCell>
                  )}
                  {columns.program && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.program || '—'}
                    </TableCell>
                  )}
                  {/* Coordinator Status */}
                  {columns.status && (
                    <TableCell className="px-2 py-2 text-xs whitespace-nowrap text-center align-middle">
                      <Badge
                        className={
                          r.status === 'Approved'
                            ? 'bg-green-100 text-green-700 border-green-200 flex items-center gap-1'
                            : r.status === 'Rejected'
                            ? 'bg-red-100 text-red-700 border-red-200 flex items-center gap-1'
                            : r.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1'
                            : r.status === 'Needs-info'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1'
                            : r.status === 'In progress'
                            ? 'bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1'
                            : 'bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1'
                        }
                      >
                        {r.status === 'Approved' && <CheckCircle size={14} className="mr-1" />}
                        {r.status === 'Rejected' && <XCircle size={14} className="mr-1" />}
                        {r.status === 'Pending' && <Clock size={14} className="mr-1" />}
                        {r.status}
                      </Badge>
                    </TableCell>
                  )}
                  {/* AA Status: Placeholder, replace with actual value if available */}
                    {/* AA Status: Show actual value if available, fallback to '—' */}
                    {/* AA Status: Show actual value if available, fallback to '—' */}
                    <TableCell className="px-2 py-2 text-xs whitespace-nowrap text-center align-middle">
                      {getAaStatusBadge(r.aa_status)}
                  </TableCell>
                </TableRow>
              );
            })}
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={
                    (columns.title ? 1 : 0) +
                    (columns.presenter ? 1 : 0) +
                    (columns.adviser ? 1 : 0) +
                    (columns.program ? 1 : 0) +
                    (columns.status ? 1 : 0) +
                    1 // AA Status
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