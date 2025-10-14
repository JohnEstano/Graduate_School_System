import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Pencil, CheckCircle, Send } from 'lucide-react';
import { useState } from 'react';

export type DefenseBatchSummary = {
  id: number;
  name: string;
  created_by: string;
  created_at: string;
  status: string;
  count: number;
};

const STATUS_OPTIONS = [
  { value: 'ready', label: 'Ready for Finance', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200' },
];

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  if (!opt) return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
  return <Badge className={opt.color}>{opt.label}</Badge>;
}

export default function TableAllDefenseBatch({
  batches,
  onUpdateStatus,
  isLoading,
}: {
  batches: DefenseBatchSummary[];
  onUpdateStatus: (batchId: number, status: string) => void;
  isLoading: boolean;
}) {
  const [editId, setEditId] = useState<number | null>(null);

  return (
    <div className="w-full box-border overflow-x-auto max-w-full border border-zinc-200 rounded-md bg-background transition-all duration-200">
      <Table className="w-full text-sm table-auto">
        <TableHeader>
          <TableRow>
            <TableHead className="px-3 min-w-[180px]">Batch Name</TableHead>
            <TableHead className="px-2 min-w-[120px]">Created By</TableHead>
            <TableHead className="px-2 min-w-[120px]">Created At</TableHead>
            <TableHead className="px-2 min-w-[100px]">Status</TableHead>
            <TableHead className="px-2 min-w-[80px] text-center">Requests</TableHead>
            <TableHead className="px-2 min-w-[120px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map(b => (
            <TableRow key={b.id}>
              <TableCell className="px-3 py-2 font-medium truncate leading-tight align-middle flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-500" />
                <span>{b.name}</span>
              </TableCell>
              <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                {b.created_by}
              </TableCell>
              <TableCell className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap align-middle">
                {new Date(b.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="px-2 py-2 text-xs whitespace-nowrap align-middle">
                {getStatusBadge(b.status)}
              </TableCell>
              <TableCell className="px-2 py-2 text-xs text-center align-middle">
                {b.count}
              </TableCell>
              <TableCell className="px-2 py-2 text-xs text-center align-middle">
                {editId === b.id ? (
                  <div className="flex gap-1 justify-center">
                    {STATUS_OPTIONS.map(opt => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={b.status === opt.value ? 'default' : 'outline'}
                        className="text-xs"
                        onClick={() => {
                          onUpdateStatus(b.id, opt.value);
                          setEditId(null);
                        }}
                        disabled={isLoading}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="action-btn"
                    onClick={() => setEditId(b.id)}
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {batches.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-32 text-center text-sm text-muted-foreground">
                No batches found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}