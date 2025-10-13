'use client';

import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings2, Plus, RefreshCw, CheckCircle, X, Send } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TableAllDefenseBatch, { DefenseBatchSummary } from './table-all-defense-batch';

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

export default function DefenseBatchIndex() {
  const [batches, setBatches] = useState<DefenseBatchSummary[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [createError, setCreateError] = useState('');

  // Fetch batches
  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/aa/payment-batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      } else {
        toast.error('Failed to fetch batches');
      }
    } catch {
      toast.error('Error fetching batches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Filtered batches
  const filtered = batches.filter(b =>
    (!search || b.name.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter.length || statusFilter.includes(b.status))
  );

  // Create batch
  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      setCreateError('Batch name is required');
      return;
    }
    setIsLoading(true);
    setCreateError('');
    try {
      const res = await fetch('/aa/payment-batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ name: newBatchName }),
      });
      if (res.ok) {
        setCreateDialog(false);
        setNewBatchName('');
        fetchBatches();
        toast.success('Batch created');
      } else {
        const data = await res.json();
        setCreateError(data?.error || 'Failed to create batch');
      }
    } catch {
      setCreateError('Error creating batch');
    } finally {
      setIsLoading(false);
    }
  };

  // Update batch status
  const handleUpdateStatus = async (batchId: number, status: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/aa/payment-batches/${batchId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBatches(prev =>
          prev.map(b => (b.id === batchId ? { ...b, status } : b))
        );
        toast.success('Status updated');
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Error updating status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'Defense Batches', href: '/assistant/defense-batch' }
    ]}>
      <Head title="Defense Batches" />
      <Toaster richColors position="bottom-right" />
      <div className="flex flex-col gap-4 pt-5 pr-3 pl-3">
        {/* Header */}
        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500">
                <Send className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <span className="text-base font-semibold">Defense Batches</span>
                <span className="block text-xs text-muted-foreground">
                  Grouped defense requests for finance processing.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchBatches} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
              <Button variant="default" size="sm" onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Batch
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="text"
              placeholder="Search batch name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs text-sm h-8"
              disabled={isLoading}
            />
            <div className="flex gap-1">
              {STATUS_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={statusFilter.includes(opt.value) ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() =>
                    setStatusFilter(f =>
                      f.includes(opt.value)
                        ? f.filter(x => x !== opt.value)
                        : [...f, opt.value]
                    )
                  }
                >
                  {opt.label}
                </Button>
              ))}
              {statusFilter.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStatusFilter([])}>
                  <X className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>
          </div>
        </Card>
        {/* Table */}
        <TableAllDefenseBatch
          batches={filtered}
          onUpdateStatus={handleUpdateStatus}
          isLoading={isLoading}
        />
      </div>
      {/* Create Batch Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogDescription>
            Enter a name for the new batch.
          </DialogDescription>
          <Input
            value={newBatchName}
            onChange={e => setNewBatchName(e.target.value)}
            placeholder="Batch name"
            className="mt-2"
            disabled={isLoading}
          />
          {createError && <div className="text-red-600 text-xs mt-1">{createError}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBatch} disabled={isLoading}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}