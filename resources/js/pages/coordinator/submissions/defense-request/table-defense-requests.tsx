import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Info, ArrowUp, ArrowDown, ChevronsUpDown, CheckCircle, CircleX, CircleArrowLeft, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Details from './details';
import { getProgramAbbr } from './Index'; 
import { Progress } from "@/components/ui/progress";

type DefenseRequestSummary = {
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
};

type TableDefenseRequestsProps = {
  paged: DefenseRequestSummary[];
  columns: Record<string, boolean>;
  selected: number[];
  toggleSelectOne: (id: number) => void;
  headerChecked: boolean;
  toggleSelectAll: () => void;
  toggleSort: () => void;
  sortDir: 'asc' | 'desc' | null | undefined;
  setSelectedRequest: (r: DefenseRequestSummary) => void;
  setSelectedIndex: (i: number) => void;
  sorted: DefenseRequestSummary[];
  selectedRequest: DefenseRequestSummary | null;
  selectedIndex: number;
  onStatusChange: (id: number, status: string) => Promise<void>;
  onPriorityChange: (id: number, priority: string) => Promise<void>;
  formatLocalDateTime: (isoString?: string) => string;
  openDropdownId?: number | null;
  setOpenDropdownId?: (id: number | null) => void;
  tabType?: 'pending' | 'rejected' | 'approved';
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
  setSelectedRequest,
  setSelectedIndex,
  sorted,
  selectedRequest,
  selectedIndex,
  onStatusChange,
  onPriorityChange,
  formatLocalDateTime,
  openDropdownId,
  setOpenDropdownId,
  tabType,
  onRowApprove,
  onRowReject,
  onRowRetrieve,
}: TableDefenseRequestsProps) {
  return (
    <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-background dark:border-border w-full max-w-full">
      <div>
        <Table className="min-w-[900px] text-sm dark:text-muted-foreground">
          <TableHeader>
            <TableRow className="dark:bg-muted/40">
              <TableHead className="w-[4%] py-2 dark:bg-muted/30 dark:text-muted-foreground">
                <Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} />
              </TableHead>
              {columns.title && (
                <TableHead className="w-[28%] px-2 dark:bg-muted/30 dark:text-muted-foreground">Title</TableHead>
              )}
              {columns.date && (
                <TableHead
                  className="w-[14%] text-center cursor-pointer px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground"
                  onClick={toggleSort}
                >
                  <div className="flex justify-center items-center gap-1">
                    <span>Date</span>
                    {sortDir === 'asc' && <ArrowUp size={12} />}
                    {sortDir === 'desc' && <ArrowDown size={12} />}
                    {!sortDir && <ChevronsUpDown size={12} className="opacity-50" />}
                  </div>
                </TableHead>
              )}
              {columns.mode && (
                <TableHead className="w-[10%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Mode</TableHead>
              )}
              {columns.type && (
                <TableHead className="w-[10%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Type</TableHead>
              )}
              {columns.priority && (
                <TableHead className="w-[10%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Priority</TableHead>
              )}
              {tabType === 'approved' && columns.progress && (
                <TableHead className="w-[14%] text-center px-1 py-2 dark:bg-muted/30 dark:text-muted-foreground">Progress</TableHead>
              )}
              <TableHead className="w-[10%] px-1 py-2 text-center dark:bg-muted/30 dark:text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged
              .slice()
              .sort((a, b) => new Date(b.date_of_defense).getTime() - new Date(a.date_of_defense).getTime())
              .map((r, i) => (
                <TableRow key={r.id} className="hover:bg-muted/50 dark:hover:bg-muted/70">
                  <TableCell className="px-2 py-2 dark:bg-background dark:text-muted-foreground">
                    <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleSelectOne(r.id)} />
                  </TableCell>
                  {columns.title && (
                    <TableCell
                      className="px-2 py-2 font-semibold truncate leading-tight cursor-pointer dark:bg-background dark:text-foreground"
                      style={{ maxWidth: '180px' }}
                      onClick={() => toggleSelectOne(r.id)}
                    >
                      <div className="truncate" title={r.thesis_title}>{r.thesis_title}</div>
                      <div className="text-xs font-normal text-muted-foreground mt-1 truncate dark:text-muted-foreground">
                        {r.first_name}{' '}{r.middle_name ? `${r.middle_name[0]}. ` : ''}{r.last_name}
                      </div>
                    </TableCell>
                  )}
                  {columns.date && (
                    <TableCell className="px-1 py-2 text-center whitespace-nowrap dark:bg-background dark:text-muted-foreground">
                      {format(new Date(r.date_of_defense), 'MMM dd, yyyy')}
                    </TableCell>
                  )}
                  {columns.mode && (
                    <TableCell className="px-1 py-2 text-center capitalize dark:bg-background dark:text-muted-foreground">
                      {r.mode_defense.replace('-', ' ')}
                    </TableCell>
                  )}
                  {columns.type && (
                    <TableCell className="px-1 py-2 text-center dark:bg-background dark:text-muted-foreground">
                      <Badge className="bg-white dark:bg-background px-2 py-1 dark:text-muted-foreground" variant="outline">
                        {r.defense_type || '—'}
                      </Badge>
                    </TableCell>
                  )}
                  {columns.priority && (
                    <TableCell className="px-1 py-2 text-center dark:bg-background dark:text-muted-foreground">
                      <Badge
                        className={
                          "cursor-pointer rounded-full " +
                          (r.priority === 'High'
                            ? "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900"
                            : r.priority === 'Low'
                              ? "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900"
                              : "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900")
                        }
                        variant="outline"
                      >
                        {r.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                  )}
                  {tabType === 'approved' && columns.progress && (
                    <TableCell className="px-1 py-2 text-center dark:bg-background dark:text-muted-foreground">
                      <div className="flex flex-col gap-1 items-center">
                        <Progress value={40} className="w-full h-2" />
                        <span className="text-xs text-muted-foreground mt-1 block">Processing...</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="px-1 py-2 text-center flex gap-1 justify-center dark:bg-background dark:text-muted-foreground">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(r);
                            setSelectedIndex(i);
                          }}
                          title="Details"
                          className="dark:bg-muted/30 dark:text-muted-foreground"
                        >
                          <Info />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl min-w-260 w-full max-h-[90vh] dark:bg-background dark:text-muted-foreground">
                        <div className="max-h-[80vh] overflow-y-auto px-1">
                          {selectedRequest && (
                            <Details
                              request={selectedRequest as any}
                              onNavigate={(dir) => {
                                const ni = dir === 'next' ? selectedIndex + 1 : selectedIndex - 1;
                                if (ni >= 0 && ni < sorted.length) {
                                  setSelectedRequest(sorted[ni]);
                                  setSelectedIndex(ni);
                                }
                              }}
                              disablePrev={selectedIndex === 0}
                              disableNext={selectedIndex === sorted.length - 1}
                              onStatusAction={() => {}}
                              onPriorityChange={onPriorityChange}
                            />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* Pending: Details, Approve, Reject */}
                    {tabType === 'pending' && (
                      <>
                       
                        <Button
                          size="sm"
                          variant="outline"
                          title="Reject"
                          onClick={() => onRowReject && onRowReject(r.id)}
                          className="text-red-500 hover:text-red-500"
                        >
                          <CircleX size={16} />
                        </Button>
                         <Button
                          size="sm"
                          variant="outline"
                          title="Approve"
                          onClick={() => onRowApprove && onRowApprove(r.id)}
                          className="text-green-500 hover:text-green-500"
                        >
                          <CheckCircle size={16} />
                        </Button>
                      </>
                    )}
                    {/* Rejected: Details, Retrieve */}
                    {tabType === 'rejected' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Retrieve"
                          onClick={() => onRowRetrieve && onRowRetrieve(r.id)}
                          className="text-blue-500 hover:text-blue-500"
                        >
                          <CircleArrowLeft size={16} />
                        </Button>
                      </>
                    )}
                  
                  </TableCell>
                </TableRow>
              ))}
            {paged.length === 0 && (
              <TableRow className="dark:bg-background">
                <TableCell
                  colSpan={Object.values(columns).filter(Boolean).length + (tabType === 'approved' ? 2 : 1)}
                  className="text-center align-middle dark:bg-background dark:text-muted-foreground"
                  style={{ height: '280px', minHeight: '200px', padding: 0 }}
                >
                  <div className="flex flex-col items-center justify-center w-full h-full py-12 text-muted-foreground dark:text-muted-foreground">
                    <span className="">No requests found.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}