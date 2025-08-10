import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Info, ArrowUp, ArrowDown, ChevronsUpDown, CheckCircle, CircleX, CircleArrowLeft, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Details from './details';
import { getProgramAbbr } from './Index'; // adjust path if needed

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
    <div className="rounded-md overflow-x-auto border border-border bg-white w-full max-w-full">
      <div>
        <Table className="min-w-[900px] text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[4%] py-2">
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              {columns.title && (
                <TableHead className="w-[36%] px-2">Title</TableHead>
              )}
              {columns.date && (
                <TableHead
                  className="w-[16%] text-center cursor-pointer px-1 py-2"
                  onClick={toggleSort}
                >
                  <div className="flex justify-center items-center gap-1">
                    <span>Date</span>
                    {sortDir === 'asc' && <ArrowUp size={12} />}
                    {sortDir === 'desc' && <ArrowDown size={12} />}
                    {!sortDir && (
                      <ChevronsUpDown size={12} className="opacity-50" />
                    )}
                  </div>
                </TableHead>
              )}
              {columns.mode && (
                <TableHead className="w-[12%] text-center px-1 py-2">Mode</TableHead>
              )}
              {columns.type && (
                <TableHead className="w-[12%] text-center px-1 py-2">Type</TableHead>
              )}
              {columns.priority && (
                <TableHead className="w-[12%] text-center px-1 py-2">Priority</TableHead>
              )}
              <TableHead className="w-[14%] px-1 py-2 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((r, i) => (
              <TableRow key={r.id} className="hover:bg-muted/50">
                <TableCell className="px-2 py-2">
                  <Checkbox
                    checked={selected.includes(r.id)}
                    onCheckedChange={() => toggleSelectOne(r.id)}
                  />
                </TableCell>
                {columns.title && (
                  <TableCell
                    className="px-2 py-2 font-semibold truncate leading-tight cursor-pointer"
                    style={{ maxWidth: '260px' }}
                    onClick={() => toggleSelectOne(r.id)}
                  >
                    <div className="truncate" title={r.thesis_title}>
                      {r.thesis_title}
                    </div>
                    <div className="text-xs font-normal text-muted-foreground mt-1 truncate">
                      {r.first_name}{' '}
                      {r.middle_name ? `${r.middle_name[0]}. ` : ''}
                      {r.last_name}
                    </div>
                  </TableCell>
                )}
                {columns.date && (
                  <TableCell className="px-1 py-2 text-center whitespace-nowrap">
                    {format(new Date(r.date_of_defense), 'MMM dd, yyyy')}
                  </TableCell>
                )}
                {columns.mode && (
                  <TableCell className="px-1 py-2 text-center capitalize">
                    {r.mode_defense.replace('-', ' ')}
                  </TableCell>
                )}
                {columns.type && (
                  <TableCell className="px-1 py-2 text-center">
                    <Badge
                      className="bg-white  px-2 py-1"
                      variant="outline"
                    >
                      {r.defense_type || '—'}
                    </Badge>
                  </TableCell>
                )}
                {columns.priority && (
                  <TableCell className="px-1 py-2 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          className={
                            "cursor-pointer rounded-full " +
                            (r.priority === 'High'
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : r.priority === 'Low'
                                ? "bg-sky-100 text-sky-700 border border-sky-200"
                                : "bg-amber-100 text-amber-700 border border-amber-200")
                          }
                          variant="outline"
                        >
                          {r.priority || 'Medium'}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {['Low', 'Medium', 'High'].map((priority) => (
                          <DropdownMenuItem
                            key={priority}
                            onClick={() => onPriorityChange(r.id, priority)}
                            className="flex items-center justify-between"
                          >
                            <span>{priority}</span>
                            {r.priority === priority && <Check size={16} />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
                <TableCell className="px-1 py-2 text-center flex gap-1 justify-center">
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
                      >
                        <Info />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl min-w-260 w-full max-h-[90vh]">
                      <div className="max-h-[80vh] overflow-y-auto px-1">
                        {selectedRequest && (
                          <Details
                            request={selectedRequest as any}
                            onNavigate={(dir) => {
                              const ni =
                                dir === 'next'
                                  ? selectedIndex + 1
                                  : selectedIndex - 1;
                              if (ni >= 0 && ni < sorted.length) {
                                setSelectedRequest(sorted[ni]);
                                setSelectedIndex(ni);
                              }
                            }}
                            disablePrev={selectedIndex === 0}
                            disableNext={selectedIndex === sorted.length - 1}
                            onStatusAction={(id, action) => {
                           
                              if (action === 'approve' && onRowApprove) onRowApprove(id);
                              else if (action === 'reject' && onRowReject) onRowReject(id);
                              else if (action === 'retrieve' && onRowRetrieve) onRowRetrieve(id);
                            }}
                            onPriorityChange={onPriorityChange}
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  {tabType === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRowApprove && onRowApprove(r.id)}
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRowReject && onRowReject(r.id)}
                        title="Reject"
                      >
                        <CircleX size={16} />
                      </Button>
                    </>
                  )}
                  {tabType === 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRowRetrieve && onRowRetrieve(r.id)}
                      title="Retrieve"
                    >
                      <CircleArrowLeft size={16} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={Object.values(columns).filter(Boolean).length + 2}
                  className="text-center align-middle"
                  style={{ height: '280px', minHeight: '200px', padding: 0 }}
                >
                  <div className="flex flex-col items-center justify-center w-full h-full py-12 text-muted-foreground">
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