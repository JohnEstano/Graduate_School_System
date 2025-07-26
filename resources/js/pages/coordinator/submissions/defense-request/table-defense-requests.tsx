import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import Details from './details';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, CircleCheckBig, CircleX, BadgeInfo, Circle } from 'lucide-react';
import type { DefenseRequestSummary } from './show-all-requests';

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
  onStatusChange: (id: number, status: string) => void;
  onPriorityChange: (id: number, priority: string) => void;
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
}: TableDefenseRequestsProps) {
  const statusIcon = (status: string) => {
    switch (status) {
      case 'In progress':
        return <Clock size={16} className="mr-1" />;
      case 'Approved':
        return <CircleCheckBig size={16} className="mr-1" />;
      case 'Rejected':
        return <CircleX size={16} className="mr-1" />;
      case 'Needs-info':
        return <BadgeInfo size={16} className="mr-1" />;
      default:
        return <Circle size={16} className="mr-1" />; // Pending
    }
  };

  return (
    <div className="rounded-lg overflow-x-auto border border-border">
      <Table className="min-w-full text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[5%] px-2 py-2">
              <Checkbox
                checked={headerChecked}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            {columns.title && (
              <TableHead className="w-[30%] px-2 py-2">Title</TableHead>
            )}
            {columns.presenter && (
              <TableHead className="w-[20%] px-2 py-2">Presenter</TableHead>
            )}
            {columns.date && (
              <TableHead
                className="w-[15%] text-center cursor-pointer px-2 py-2"
                onClick={toggleSort}
              >
                <div className="flex justify-center items-center gap-1">
                  <span>Scheduled Date</span>
                  {sortDir === 'asc' && <ArrowUp size={12} />}
                  {sortDir === 'desc' && <ArrowDown size={12} />}
                  {!sortDir && (
                    <ChevronsUpDown size={12} className="opacity-50" />
                  )}
                </div>
              </TableHead>
            )}
            {columns.mode && (
              <TableHead className="w-[10%] text-center px-2 py-2">Mode</TableHead>
            )}
            {columns.status && (
              <TableHead className="w-[10%] text-center px-2 py-2">Status</TableHead>
            )}
            {columns.priority && (
              <TableHead className="w-[10%] text-center px-2 py-2">Priority</TableHead>
            )}
            <TableHead className="w-[5%] text-center px-2 py-2" />
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
                  className="px-2 py-2 font-semibold truncate cursor-pointer"
                  style={{ maxWidth: '300px' }}
                  onClick={() => toggleSelectOne(r.id)}
                >
                  {r.thesis_title}
                </TableCell>
              )}
              {columns.presenter && (
                <TableCell className="px-2 py-2 truncate">
                  {r.first_name}{' '}
                  {r.middle_name ? `${r.middle_name[0]}. ` : ''}
                  {r.last_name}
                </TableCell>
              )}
              {columns.date && (
                <TableCell className="px-2 py-2 text-center whitespace-nowrap">
                  {format(new Date(r.date_of_defense), 'MMM dd, yyyy')}
                </TableCell>
              )}
              {columns.mode && (
                <TableCell className="px-2 py-2 text-center capitalize">
                  {r.mode_defense.replace('-', ' ')}
                </TableCell>
              )}
              {columns.status && (
                <TableCell className="px-2 py-2 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-1">
                          {statusIcon(r.status)}
                          {(r.status || 'Pending').replace('-', ' ')}
                        </div>
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {['Pending', 'In progress', 'Approved', 'Rejected', 'Needs-info'].map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onStatusChange(r.id, status)}
                          className="flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1">
                            {statusIcon(status)}
                            {status.replace('-', ' ')}
                          </span>
                          {r.status === status && <Check size={16} />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
              {columns.priority && (
                <TableCell className="px-2 py-2 text-center">
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
                          {r.priority === priority && <Check size={16}/>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
              <TableCell className="px-2 py-2 text-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(r);
                        setSelectedIndex(i);
                      }}
                    >
                      <Info />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl min-w-260 w-full max-h-[90vh]">
                    <div className="max-h-[80vh] overflow-y-auto px-1">
                      {selectedRequest && (
                         
                        <Details
                          request={selectedRequest as unknown as import('./details').DefenseRequestFull}
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
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}