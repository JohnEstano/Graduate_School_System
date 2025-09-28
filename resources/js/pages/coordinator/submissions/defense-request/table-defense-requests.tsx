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
              {/* Approved tab: add indicator column at the start */}
              {tabType === 'approved' && (
                <TableHead className="w-[48px] text-center">Status</TableHead>
              )}
              {!hideSelect && (
                <TableHead className="w-[40px] py-2">
                  <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
                </TableHead>
              )}
              {/* Document icon column - header blank */}
              {columns.title && <TableHead className="px-2">Title</TableHead>}
              {columns.presenter && <TableHead className="px-2">Presenter</TableHead>}
              {tabType !== 'approved' && columns.adviser && <TableHead className="px-2">Adviser</TableHead>}
              {tabType !== 'approved' && columns.program && <TableHead className="px-2">Program</TableHead>}
              {tabType !== 'approved' && columns.submitted_at && <TableHead className="px-2">Submitted</TableHead>}
              {/* Approved: Date & Mode */}
              {tabType === 'approved' && columns.date && (
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
              {tabType === 'approved' && columns.mode && <TableHead className="text-center px-1 py-2">Mode</TableHead>}
              {columns.type && <TableHead className="text-center px-1 py-2">Type</TableHead>}
              {columns.priority && <TableHead className="text-center px-1 py-2">Priority</TableHead>}
              {!hideActions && <TableHead className="text-center px-1 py-2">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged
              .slice()
              .sort((a, b) => {
                const daStr = a.date_of_defense || a.scheduled_date;
                const dbStr = b.date_of_defense || b.scheduled_date;
                const da = daStr ? new Date(daStr).getTime() : 0;
                const db = dbStr ? new Date(dbStr).getTime() : 0;
                return db - da;
              })
              .map(r => {
                const isSelected = selected.includes(r.id);
                const highlightRow =
                  highlightMissingDateMode &&
                  tabType === 'approved' &&
                  (!r.date_of_defense && !r.scheduled_date || !(r.mode_defense || r.defense_mode));
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
                    className={`hover:bg-muted/40 ${highlightRow ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} cursor-pointer`}
                    onClick={handleRowClick}
                  >
                    {/* Approved tab: indicator column */}
                    {tabType === 'approved' && (
                      <TableCell className="text-center">
                        {getIndicator(r)}
                      </TableCell>
                    )}
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
                    {/* Document icon cell */}
                    
                    {columns.title && (
                      <TableCell className="px-2 py-2 font-medium truncate leading-tight" title={r.thesis_title}>
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center justify-center rounded-md bg-rose-500 text-white h-8 w-8">
                            <FileText size={20} />
                          </span>
                          <span className="truncate align-middle">{r.thesis_title}</span>
                        </span>
                      </TableCell>
                    )}
                    {columns.presenter && (
                      <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap" title={`${r.first_name} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name}`}>
                        {r.first_name} {r.middle_name ? r.middle_name[0] + '. ' : ''}{r.last_name}
                      </TableCell>
                    )}
                    {tabType !== 'approved' && columns.adviser && (
                      <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {r.adviser || '—'}
                      </TableCell>
                    )}
                    {tabType !== 'approved' && columns.program && (
                      <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {r.program || '—'}
                      </TableCell>
                    )}
                    {tabType !== 'approved' && columns.submitted_at && (
                      <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {r.submitted_at
                          ? `${formatDistanceToNowStrict(new Date(r.submitted_at), { addSuffix: true })}`
                          : '—'}
                      </TableCell>
                    )}
                    {tabType === 'approved' && columns.date && (
                      <TableCell className="px-1 py-2 text-center whitespace-nowrap">
                        {(() => {
                          const raw = r.date_of_defense || r.scheduled_date;
                          return raw && !isNaN(new Date(raw).getTime())
                            ? format(new Date(raw), 'MMM dd, yyyy')
                            : <span className="text-amber-600 font-semibold">Missing</span>;
                        })()}
                      </TableCell>
                    )}
                    {tabType === 'approved' && columns.mode && (
                      <TableCell className="px-1 py-2 text-center capitalize">
                        {(r.mode_defense || r.defense_mode)
                          ? (r.mode_defense || r.defense_mode)?.replace('-', ' ')
                          : <span className="text-amber-600 font-semibold">Missing</span>}
                      </TableCell>
                    )}
                    {columns.type && (
                      <TableCell className="px-1 py-2 text-center">
                        <Badge variant="outline">{r.defense_type || '—'}</Badge>
                      </TableCell>
                    )}
                    {columns.priority && (
                      <TableCell className="px-1 py-2 text-center priority-dropdown">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge
                              className={
                                'cursor-pointer select-none ' +
                                (r.priority === 'High'
                                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                                  : r.priority === 'Low'
                                  ? 'bg-sky-100 text-sky-700 border-sky-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200')
                              }
                              variant="outline"
                              onClick={e => e.stopPropagation()}
                            >
                              {r.priority}
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={() => onPriorityChange(r.id, 'High')}
                              className={r.priority === 'High' ? 'font-bold text-rose-700' : ''}
                            >
                              High
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onPriorityChange(r.id, 'Medium')}
                              className={r.priority === 'Medium' ? 'font-bold text-amber-700' : ''}
                            >
                              Medium
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onPriorityChange(r.id, 'Low')}
                              className={r.priority === 'Low' ? 'font-bold text-sky-700' : ''}
                            >
                              Low
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                    {!hideActions && (
                      <TableCell className="px-1 py-2">
                        <div className="flex items-center justify-center gap-2">
                          {tabType === 'pending' && (
                            <>
                              <Button
                                size="lg"
                                variant="outline"
                                className="h-8 w-10 p-0 text-green-600 action-btn hover:text-green-600 hover:border-green-200 focus:text-green-600 focus:border-green-200"
                                title="Approve"
                                onClick={e => {
                                  e.stopPropagation();
                                  onRowApprove && onRowApprove(r.id);
                                }}
                              >
                                <CheckCircle className="h-5 w-5" />
                              </Button>
                              <Button
                                size="lg"
                                variant="outline"
                                className="h-8 w-10 p-0 text-red-600 action-btn hover:text-red-600 hover:border-red-200 focus:text-red-600 focus:border-red-200"
                                title="Reject"
                                onClick={e => {
                                  e.stopPropagation();
                                  onRowReject && onRowReject(r.id);
                                }}
                              >
                                <CircleX className="h-5 w-5" />
                              </Button>
                            </>
                          )}
                          {tabType === 'rejected' && (
                            <Button
                              size="lg"
                              variant="outline"
                              className="h-10 w-12 p-0 text-blue-600 action-btn hover:text-blue-600 hover:border-blue-200 focus:text-blue-600 focus:border-blue-200"
                              title="Retrieve (set back to Pending)"
                              onClick={e => {
                                e.stopPropagation();
                                onRowRetrieve && onRowRetrieve(r.id);
                              }}
                            >
                              <CircleArrowLeft className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
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
                    (tabType !== 'approved' && columns.adviser ? 1 : 0) +
                    (tabType !== 'approved' && columns.submitted_at ? 1 : 0) +
                    (tabType !== 'approved' && columns.program ? 1 : 0) +
                    (tabType === 'approved' && columns.date ? 1 : 0) +
                    (tabType === 'approved' && columns.mode ? 1 : 0) +
                    (columns.type ? 1 : 0) +
                    (columns.priority ? 1 : 0) +
                    (hideActions ? 0 : 1)
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