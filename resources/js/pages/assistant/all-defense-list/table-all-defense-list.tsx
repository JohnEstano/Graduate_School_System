import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Eye, Check, X, AlertCircle, CheckCircle } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProgramAbbreviation } from '@/utils/program-abbreviations';
import { useState } from 'react';

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
  status: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  last_status_updated_by?: string;
  last_status_updated_at?: string;
  workflow_state?: string;
  adviser?: string;
  submitted_at?: string;
  panelists?: any[];
  expected_rate?: number | null; // <-- for Expected Amount
  amount?: number | null;        // <-- for Amount Paid
  reference_no?: string | null;  // <-- for Reference/OR No.
  coordinator?: string | null;   // <-- for Program Coordinator
};

export type TableAllDefenseListProps = {
  paged: DefenseRequestSummary[];
  columns: Record<string, boolean>;
  selected: number[];
  toggleSelectOne: (id: number) => void;
  headerChecked: boolean;
  toggleSelectAll: () => void;
  toggleSort: () => void;
  sortDir: 'asc' | 'desc' | null | undefined;
  onPriorityChange: (id: number, priority: string) => Promise<void>;
  onViewDetails?: (id: number) => void;
  onRowApprove?: (id: number) => void;
  onRowReject?: (id: number) => void;
  onRowRetrieve?: (id: number) => void;
  highlightMissingDateMode?: boolean;
  hideActions?: boolean;
  hideSelect?: boolean;
  isSidebarCollapsed?: boolean;
  sidebarWidth?: number;
  totalCount?: number;
};

function safeFormatDate(dateString?: string, formatStr = 'MMM dd, yyyy') {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TableAllDefenseList({
  paged,
  columns,
  selected,
  toggleSelectOne,
  headerChecked,
  toggleSelectAll,
  toggleSort,
  sortDir,
  onPriorityChange,
  onViewDetails,
  onRowApprove,
  onRowReject,
  onRowRetrieve,
  highlightMissingDateMode,
  hideActions,
  hideSelect,
  isSidebarCollapsed = false,
  sidebarWidth = 260,
  totalCount,
}: TableAllDefenseListProps) {
  // Helper for status indicator with checklist tooltip
  function getIndicator(r: DefenseRequestSummary) {
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

  // Pagination state
  const pageSize = 20;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(paged.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const visibleRows = paged.slice(startIdx, endIdx);

  const isPageHeaderChecked = selected.length === visibleRows.length && visibleRows.length > 0;
  const toggleSelectAllHandler = () => {
    toggleSelectAll();
  };

  return (
    <div
      className="
        w-full
        box-border
        overflow-x-auto
        max-w-full
        border
        border-zinc-200
        rounded-md
        bg-background
        transition-all
        duration-200
      "
    >
      <div className="min-w-full">
        <Table className="w-full text-sm table-auto">
          <TableHeader>
            <TableRow>
              {!hideSelect && (
                <TableHead className="w-[40px] py-2">
                  <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
                </TableHead>
              )}
              {columns.title && <TableHead className="px-3 min-w-[180px]">Thesis Title</TableHead>}
              {columns.presenter && <TableHead className="px-2 min-w-[120px]">Presenter</TableHead>}
              {columns.adviser && <TableHead className="px-2 min-w-[120px]">Adviser</TableHead>}
              {columns.submitted_at && <TableHead className="px-2 min-w-[120px]">Submitted At</TableHead>}
              {columns.program && <TableHead className="px-2 min-w-[100px]">Program</TableHead>}
              {columns.coordinator && <TableHead className="px-2 min-w-[140px]">Program Coordinator</TableHead>}
              {columns.scheduled_date && <TableHead className="px-2 min-w-[120px]">Scheduled Date</TableHead>} {/* moved here */}
              {columns.expected_amount && <TableHead className="px-2 min-w-[120px]">Expected Amount</TableHead>}
              {columns.amount_paid && <TableHead className="px-2 min-w-[120px]">Amount Paid</TableHead>}
              {columns.reference_no && <TableHead className="px-2 min-w-[120px]">Reference/OR No.</TableHead>}
              {columns.priority && <TableHead className="px-2 min-w-[80px]">Priority</TableHead>}
              {columns.status && <TableHead className="px-2 min-w-[100px] text-center">Status</TableHead>}
              {columns.actions && <TableHead className="px-2 min-w-[80px] text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map(r => {
              const isSelected = selected?.includes(r.id);
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
                else router.visit(`/assistant/all-defense-list/${r.id}/details`);
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
                    <TableCell
                      className="px-3 py-2 font-medium truncate leading-tight align-middle flex items-center gap-2"
                      title={r.thesis_title}
                    >
                      <Badge variant="outline" className="shrink-0">{r.defense_type || '—'}</Badge>
                      <span className="truncate">
                        {(r.thesis_title && r.thesis_title.length > 32)
                          ? r.thesis_title.slice(0, 32) + '…'
                          : r.thesis_title}
                      </span>
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
                  {columns.submitted_at && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.submitted_at
                        ? (() => {
                            try {
                              const d = new Date(r.submitted_at);
                              return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            } catch {
                              return r.submitted_at;
                            }
                          })()
                        : '—'}
                    </TableCell>
                  )}
                  {columns.program && (
                    <TableCell
                      className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle"
                      title={r.program || '—'}
                    >
                      {getProgramAbbreviation(r.program || '—')}
                    </TableCell>
                  )}
                  {columns.coordinator && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.coordinator || '—'}
                    </TableCell>
                  )}
                  {columns.scheduled_date && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.scheduled_date
                        ? safeFormatDate(r.scheduled_date)
                        : '—'}
                    </TableCell>
                  )}
                  {columns.expected_amount && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.expected_rate != null
                        ? `₱${Number(r.expected_rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '—'}
                    </TableCell>
                  )}
                  {columns.amount_paid && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.amount != null
                        ? `₱${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '—'}
                    </TableCell>
                  )}
                  {columns.reference_no && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.reference_no || '—'}
                    </TableCell>
                  )}
                  {columns.priority && (
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {r.priority}
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
                            : r.status === 'Completed'
                            ? 'bg-gray-800 text-white border-gray-700'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  )}
                  {columns.actions && (
                    <TableCell className="px-2 py-2 text-xs text-center align-middle">
                      <Button
                        size="sm"
                        variant="outline"
                        className="action-btn"
                        onClick={e => {
                          e.stopPropagation();
                          if (onViewDetails) onViewDetails(r.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={Object.keys(columns).length + (hideSelect ? 0 : 1)}
                  className="py-32 text-center text-sm text-muted-foreground"
                >
                  no results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}