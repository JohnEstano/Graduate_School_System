'use client';

import { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Paperclip,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Clock,
  CheckCircle,
  CircleX,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getProgramAbbr } from './Index';
import { toast } from 'sonner';
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type DefenseRequestFull = {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  school_id: string;
  program: string;
  thesis_title: string;
  date_of_defense: string;
  mode_defense: string;
  defense_type: string;
  defense_adviser: string;
  defense_chairperson: string;
  defense_panelist1: string;
  defense_panelist2?: string;
  defense_panelist3?: string;
  defense_panelist4?: string;
  advisers_endorsement?: string;
  rec_endorsement?: string;
  proof_of_payment?: string;
  reference_no?: string;
  last_status_updated_by?: string;
  last_status_updated_at?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  priority?: 'Low' | 'Medium' | 'High';
};

type DetailsProps = {
  request: DefenseRequestFull;
  onNavigate?: (direction: 'next' | 'prev') => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  onStatusAction?: (id: number, action: 'approve' | 'reject' | 'retrieve') => void;
  onPriorityChange?: (id: number, priority: string) => Promise<void>;
};

export default function Details({
  request,
  onNavigate,
  disablePrev,
  disableNext,
  onStatusAction,
  onPriorityChange,
}: DetailsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [localRequest, setLocalRequest] = useState<DefenseRequestFull>(request);
  const [confirm, setConfirm] = useState<{ open: boolean; action: string | null }>({ open: false, action: null });

  // Keep localRequest in sync with prop changes (e.g. navigating)
  useEffect(() => {
    setLocalRequest(request);
  }, [request]);

  const attachments: { label: string; url?: string }[] = [
    { label: "Adviser’s Endorsement", url: localRequest.advisers_endorsement },
    { label: 'REC Endorsement', url: localRequest.rec_endorsement },
    { label: 'Proof of Payment', url: localRequest.proof_of_payment },
    { label: 'Reference No.', url: localRequest.reference_no },
  ];

  const lastStatusUpdatedBy = localRequest.last_status_updated_by ?? '';
  const lastStatusUpdatedAt = localRequest.last_status_updated_at ?? '';

  // Map dialog action to backend status
  function mapActionToStatus(action: string) {
    if (action === 'Approved') return 'Approved';
    if (action === 'Rejected') return 'Rejected';
    if (action === 'Pending') return 'Pending';
    return action;
  }

  // Directly call backend PATCH for status update
  const handleStatusUpdate = async (action: string) => {
    setLoading(action);
    try {
      const res = await fetch(`/defense-requests/${localRequest.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: mapActionToStatus(action) }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalRequest((prev) => ({
          ...prev,
          status: data.status,
          last_status_updated_by: data.last_status_updated_by,
          last_status_updated_at: data.last_status_updated_at,
        }));
        toast.success(`Request status updated to ${data.status}.`, { duration: 4000, position: 'bottom-right' });
      } else {
        toast.error('Failed to update status', { duration: 4000, position: 'bottom-right' });
      }
    } catch (e) {
      toast.error('Network error', { duration: 4000, position: 'bottom-right' });
    }
    setLoading(null);
    setConfirm({ open: false, action: null });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-0 py-0 h-full flex flex-col" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex flex-row items-start justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <div className="w-8 h-8 rounded-md bg-rose-100 flex items-center justify-center">
            <Info className="size-5 text-rose-500" />
          </div>
          Details
        </div>
        <div className="flex items-center gap-2">
          {localRequest.status && (
            <span
              className={
                "mt-1 text-xs font-bold px-2 py-0.5 rounded-full inline-block " +
                (localRequest.status === "Approved"
                  ? "bg-green-100 text-green-600"
                  : localRequest.status === "Rejected"
                    ? "bg-red-100 text-red-500"
                    : "bg-gray-100 text-gray-500")
              }
            >
              {localRequest.status}
            </span>
          )}
          <Button variant="outline" className="rounded-sm">
            <MoreHorizontal className="size-5" />
          </Button>
          <Button variant="outline" className="rounded-sm">
            Edit
          </Button>
          <Button variant="outline" className="rounded-sm">
            Track Request
          </Button>
          <Button variant="outline" className="rounded-sm">
            <MessageSquare className="size-5" />
          </Button>
          <Button
            variant="outline"
            className="rounded-sm"
            disabled={disablePrev}
            onClick={() => onNavigate?.('prev')}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="rounded-sm"
            disabled={disableNext}
            onClick={() => onNavigate?.('next')}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 w-full rounded-md p-0 min-h-0 h-full">
        <div className="flex flex-col md:flex-row gap-2 mb-4 px-2 py-2">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-6 items-start justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-xs text-zinc-500">Thesis Title</h3>
                <div className="flex flex-row gap-3 items-center">
                  <p className="text-base font-semibold pt-1">{localRequest.thesis_title}</p>
                  {localRequest.defense_type ? (
                    <Badge variant="outline" className="text-xs px-2 py-0 h-5 leading-tight">
                      {localRequest.defense_type}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <div>
                <h4 className="text-xs text-zinc-500 mb-1 max-w-[200px]">Presenter</h4>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {`${localRequest.first_name} ${localRequest.middle_name ?? ''} ${localRequest.last_name}`}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {localRequest.school_id}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-xs text-zinc-500 mb-1">Program</h4>
                <span className="text-sm font-medium  max-w-[50px] ">
                  {getProgramAbbr(localRequest.program)}
                </span>
              </div>
              <div>
                <h4 className="text-xs text-zinc-500 mb-1">Scheduled Date</h4>
                <p className="text-sm font-medium">
                  {format(new Date(localRequest.date_of_defense), 'PPP')}
                </p>
              </div>
              <div>
                <h4 className="text-xs text-zinc-500 mb-1">Mode</h4>
                <p className="text-sm font-medium"> {localRequest.mode_defense.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-stretch">
            <Separator
              orientation="vertical"
              className="mx-2 h-full w-[2px] bg-zinc-300"
            />
          </div>
          <div className="w-full md:w-64 flex-shrink-0 bg-white border rounded-lg p-4 h-fit space-y-4">
            <div>
              <h4 className="text-[10px] text-zinc-500 mb-1">Last Status Updated By</h4>
              <p className="text-xs font-semibold break-words text-zinc-600">
                {lastStatusUpdatedBy || <span className="text-muted-foreground">—</span>}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] text-zinc-500 mb-1">Last Status Updated At</h4>
              <p className="text-xs font-semibold text-zinc-600">
                {lastStatusUpdatedAt
                  ? format(new Date(lastStatusUpdatedAt), 'PPP p')
                  : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-2 pb-2">
          <Separator />
          <div>
            <h4 className="text-xs text-zinc-500 mb-2">Attachments</h4>
            <div className="space-y-2">
              {attachments.map(({ label, url }) =>
                url ? (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md border p-2 hover:bg-muted transition"
                  >
                    <div className="rounded bg-rose-500 p-1.5">
                      <Paperclip className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {url.split('/').pop()}
                      </p>
                    </div>
                  </a>
                ) : null
              )}
              {!attachments.some(att => att.url) && (
                <p className="text-muted-foreground text-sm">
                  No attachments available.
                </p>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-xs text-zinc-500 mb-2">Committee</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="font-medium">Adviser:</span>{' '}
                {localRequest.defense_adviser}
              </li>
              <li>
                <span className="font-medium">Chairperson:</span>{' '}
                {localRequest.defense_chairperson}
              </li>
              <li>
                <span className="font-medium">Panelist I:</span>{' '}
                {localRequest.defense_panelist1}
              </li>
              {localRequest.defense_panelist2 && (
                <li>
                  <span className="font-medium">Panelist II:</span>{' '}
                  {localRequest.defense_panelist2}
                </li>
              )}
              {localRequest.defense_panelist3 && (
                <li>
                  <span className="font-medium">Panelist III:</span>{' '}
                  {localRequest.defense_panelist3}
                </li>
              )}
              {localRequest.defense_panelist4 && (
                <li>
                  <span className="font-medium">Panelist IV:</span>{' '}
                  {localRequest.defense_panelist4}
                </li>
              )}
            </ul>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="w-full rounded-md justify-end flex gap-1 flex-wrap text-xs mt-2 mb-1 flex-shrink-0">
        {localRequest.status === 'Pending' && (
          <>
            <Button
              variant="outline"
              className="px-3 py-2 rounded-md h-auto text-xs flex items-center gap-1"
              disabled={loading === 'Approved'}
              onClick={() => setConfirm({ open: true, action: 'Approved' })}
            >
              <CheckCircle size={12} className="text-green-500" /> Approve
            </Button>
            <Button
              variant="outline"
              className="px-3 py-2 rounded-md h-auto text-xs flex items-center gap-1"
              disabled={loading === 'Rejected'}
              onClick={() => setConfirm({ open: true, action: 'Rejected' })}
            >
              <CircleX size={12} className="text-red-500" /> Reject
            </Button>
          </>
        )}
        {localRequest.status === 'Rejected' && (
          <Button
            variant="outline"
            className="px-3 py-2 rounded-md h-auto text-xs flex items-center gap-1"
            disabled={loading === 'Pending'}
            onClick={() => setConfirm({ open: true, action: 'Pending' })}
          >
            <Clock size={12} className="text-blue-500" /> Retrieve
          </Button>
        )}
        {localRequest.status === 'Approved' && (
          <>
            <Button
              variant="outline"
              className="px-3 py-2 rounded-md h-auto text-xs flex items-center gap-1"
              disabled={loading === 'Pending'}
              onClick={() => setConfirm({ open: true, action: 'Pending' })}
            >
              <Clock size={12} className="text-blue-500" /> Retrieve
            </Button>
            <Button
              variant="outline"
              className="px-3 py-2 rounded-md h-auto text-xs flex items-center gap-1"
              disabled={loading === 'Rejected'}
              onClick={() => setConfirm({ open: true, action: 'Rejected' })}
            >
              <CircleX size={12} className="text-red-500" /> Reject
            </Button>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirm.open} onOpenChange={open => { if (!open) setConfirm({ open: false, action: null }); }}>
        <DialogContent
          className="w-full max-w-4xl min-w-[700px] p-4"
          style={{
            maxHeight: '90vh',
            minHeight: '400px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-2">
              <div className="text-lg font-semibold">
                Confirm Status Update
              </div>
              <div className="text-sm text-muted-foreground">
                Are you sure you want to update the status to <span className="font-semibold">{confirm.action}</span>?
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setConfirm({ open: false, action: null })}>
                  Cancel
                </Button>
                <Button
                  variant={confirm.action === 'Rejected' ? 'destructive' : 'default'}
                  disabled={!!loading}
                  onClick={() => handleStatusUpdate(confirm.action!)}
                >
                  {loading ? 'Updating...' : 'Confirm'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
