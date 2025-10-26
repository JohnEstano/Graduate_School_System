import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CircleCheck, Clock, ArrowRight, Banknote, Hourglass } from 'lucide-react';
import { router } from '@inertiajs/react';
import { getProgramAbbreviation } from '@/utils/program-abbreviations';

export type DefenseRequestSummary = {
  id: number;
  aa_verification_id?: number | null;
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
  status: string;
  priority: string;
  last_status_updated_by?: string;
  last_status_updated_at?: string;
  workflow_state?: string;
  adviser?: string;
  submitted_at?: string;
  panelists?: any[];
  expected_rate?: number | null;
  amount?: number | null;
  reference_no?: string | null;
  coordinator?: string | null;
  aa_verification_status?: 'pending' | 'ready_for_finance' | 'in_progress' | 'paid' | 'completed';
};

export type TableAllDefenseListProps = {
  paged: DefenseRequestSummary[];
  setPaged: React.Dispatch<React.SetStateAction<DefenseRequestSummary[]>>;
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

function getAaStatusBadge(status?: 'pending' | 'ready_for_finance' | 'in_progress' | 'paid' | 'completed') {
  if (status === 'completed') {
    return <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1"><CircleCheck className="h-3 w-3" />Completed</Badge>;
  }
  if (status === 'paid') {
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1"><Banknote className="h-3 w-3" />Paid</Badge>;
  }
  if (status === 'ready_for_finance') {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1"><ArrowRight className="h-3 w-3" />Ready for Finance</Badge>;
  }
  if (status === 'in_progress') {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1"><Hourglass className="h-3 w-3" />In Progress</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
}

// Helper to get status color for the indicator dot
function getStatusDotColor(status?: 'pending' | 'ready_for_finance' | 'in_progress' | 'paid' | 'completed') {
  if (status === 'completed') return 'bg-green-500';
  if (status === 'paid') return 'bg-emerald-500';
  if (status === 'ready_for_finance') return 'bg-blue-500';
  if (status === 'in_progress') return 'bg-amber-500';
  return 'bg-yellow-500'; // pending
}

export default function TableAllDefenseList({
  paged,
  setPaged,
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
  return (
    <div className="w-full box-border overflow-x-auto max-w-full border border-zinc-200 rounded-md bg-background transition-all duration-200">
      <div className="min-w-full">
        <Table className="w-full text-sm table-auto">
          <TableHeader>
            <TableRow>
              {!hideSelect && (
                <TableHead
                  className="w-[56px] py-2 sticky left-0 z-20 bg-background"
                  style={{
                    boxShadow: '2px 0 4px -2px rgba(0,0,0,0.04)',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                  }}
                >
                  <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
                </TableHead>
              )}
              {columns.title && <TableHead className="px-3 min-w-[180px]">Thesis Title</TableHead>}
              {columns.presenter && <TableHead className="px-2 min-w-[120px]">Presenter</TableHead>}
              {columns.adviser && <TableHead className="px-2 min-w-[120px]">Adviser</TableHead>}
              {columns.submitted_at && <TableHead className="px-2 min-w-[120px]">Submitted At</TableHead>}
              {columns.program && <TableHead className="px-2 min-w-[100px]">Program</TableHead>}
              {columns.coordinator && <TableHead className="px-2 min-w-[140px]">Program Coordinator</TableHead>}
              {columns.scheduled_date && <TableHead className="px-2 min-w-[120px]">Scheduled Date</TableHead>}
              {columns.amount_paid && <TableHead className="px-2 min-w-[120px]">Amount</TableHead>}
              {columns.reference_no && <TableHead className="px-2 min-w-[120px]">Reference/OR No.</TableHead>}
              {columns.priority && <TableHead className="px-2 min-w-[80px]">Priority</TableHead>}
              {columns.status && <TableHead className="px-2 min-w-[100px] text-center">AA Status</TableHead>}
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
                    <TableCell
                      className="px-3 py-2 sticky left-0 z-10 bg-background"
                      style={{
                        boxShadow: '2px 0 4px -2px rgba(0,0,0,0.04)',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                      }}
                    >
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
                      <div className="flex items-center gap-2">
                        {/* Status indicator dot */}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDotColor(r.aa_verification_status)}`} />
                        <Badge variant="outline" className="flex-shrink-0">{r.defense_type || '—'}</Badge>
                        <span className="truncate">
                          {(r.thesis_title && r.thesis_title.length > 32)
                            ? r.thesis_title.slice(0, 32) + '…'
                            : r.thesis_title}
                        </span>
                      </div>
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
                    <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle" title={r.program || '—'}>
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
                        ? new Date(r.scheduled_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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
                      {getAaStatusBadge(r.aa_verification_status)}
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