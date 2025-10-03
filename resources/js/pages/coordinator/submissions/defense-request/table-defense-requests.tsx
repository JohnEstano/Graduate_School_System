import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ChevronsUpDown, Eye, CheckCircle, CircleX, CircleArrowLeft, CalendarX, UserSearch, Check, X, AlertCircle, FileText } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { router } from '@inertiajs/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type DefenseRequestSummary = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  program: string;
  thesis_title: string;
  date_of_defense?: string;
  scheduled_date?: string;
  defense_type: string;
  mode_defense?: string;
  defense_mode?: string;
  status: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info';
  priority: 'Low' | 'Medium' | 'High';
  last_status_updated_by?: string;
  last_status_updated_at?: string;
  workflow_state?: string;
  adviser?: string; // Add adviser field if not present
  submitted_at?: string; // Add submitted_at field if not present
  panelists?: any[]; // Add panelists field (adjust type as needed)
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
  highlightMissingDateMode?: boolean;
  hideActions?: boolean; // <-- Add this prop
  hideSelect?: boolean;  // <-- Add this prop
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
  onRowRetrieve,
  highlightMissingDateMode,
  hideActions,
  hideSelect
}: TableDefenseRequestsProps) {
  // Helper for status indicator with checklist tooltip
  function getIndicator(r: DefenseRequestSummary) {
    // Only count as assigned if at least one non-empty string in panelists array
    const hasPanelists =
      Array.isArray(r.panelists) &&
      r.panelists.filter(p => typeof p === 'string' && p.trim().length > 0).length > 0;

    const hasDate = !!(r.date_of_defense || r.scheduled_date);

    let icon, color;
    if (hasPanelists && hasDate) {
      icon = <CheckCircle size={18} />;
      color = 'bg-green-500';
    } else {
      icon = <AlertCircle size={18} />;
      color = 'bg-red-500';
    }

    const checklist = [
      {
        label: 'Approved',
        checked: true,
      },
      {
        label: 'Assigned panelists',
        checked: hasPanelists,
      },
      {
        label: 'Scheduled date',
        checked: hasDate,
      },
    ];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center justify-center rounded-full ${color} text-white h-7 w-7 cursor-pointer`}>
              {icon}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-white text-black border border-border shadow-lg p-2 min-w-[160px]"
          >
            <div className="flex flex-col gap-1">
              {checklist.map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className={`inline-flex items-center justify-center rounded-full ${item.checked ? 'bg-green-500' : 'bg-red-500'} text-white w-4 h-4`}>
                    {item.checked ? <Check size={12} /> : <X size={12} />}
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto w-full rounded-md border border-border bg-background">
        <Table className="w-full text-sm table-auto">
          <TableHeader>
            <TableRow>
              {!hideSelect && (
                <TableHead className="w-[40px] py-2">
                  <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
                </TableHead>
              )}
              {columns.title && <TableHead className="px-3 min-w-[180px]">Title</TableHead>}
              {columns.presenter && <TableHead className="px-2 min-w-[120px]">Presenter</TableHead>}
              {columns.adviser && <TableHead className="px-2 min-w-[120px]">Adviser</TableHead>}
              {columns.program && <TableHead className="px-2 min-w-[100px]">Program</TableHead>}
              {columns.type && <TableHead className="text-center px-2 min-w-[90px]">Type</TableHead>}
              {columns.submitted_at && <TableHead className="px-2 min-w-[130px] text-center">Submitted</TableHead>}
              {columns.status && <TableHead className="px-2 min-w-[100px] text-center">Status</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map(r => {
              const isSelected = selected.includes(r.id);
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
                  {!hideSelect && (
                    <TableCell className="px-2 py-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectOne(r.id)}
                        className="action-btn"
                        onClick={e => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.title && (
                    <TableCell className="px-3 py-2 font-medium truncate leading-tight align-middle" title={r.thesis_title}>
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
                      {r.adviser || '—'}
                    </TableCell>
                  )}
                  {columns.program && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.program || '—'}
                    </TableCell>
                  )}
                  {columns.type && (
                    <TableCell className="px-2 py-2 text-center align-middle">
                      <Badge variant="outline">{r.defense_type || '—'}</Badge>
                    </TableCell>
                  )}
                  {columns.submitted_at && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap text-center align-middle">
                      {r.submitted_at
                        ? format(new Date(r.submitted_at), 'yyyy-MM-dd hh:mm a')
                        : '—'}
                    </TableCell>
                  )}
                  {columns.status && (
                    <TableCell className="px-2 py-2 text-xs whitespace-nowrap text-center align-middle">
                      <Badge
                        className={
                          r.status === 'Approved'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : r.status === 'Rejected'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : r.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            : r.status === 'Needs-info'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : r.status === 'In progress'
                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={
                    (hideSelect ? 0 : 1) +
                    (columns.title ? 1 : 0) +
                    (columns.presenter ? 1 : 0) +
                    (columns.adviser ? 1 : 0) +
                    (columns.program ? 1 : 0) +
                    (columns.type ? 1 : 0) +
                    (columns.submitted_at ? 1 : 0) +
                    (columns.status ? 1 : 0)
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