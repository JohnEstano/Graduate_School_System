'use client';

import { useState } from "react";
import { Button } from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {
  Paperclip,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Clock,
  CheckCircle,
  BadgeInfo,
  CircleX,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

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
  status?: 'Pending' | 'In progress' | 'Approved' | 'Rejected' | 'Needs-info';
  priority?: 'Low' | 'Medium' | 'High';
};

type DetailsProps = {
  request: DefenseRequestFull;
  onNavigate?: (direction: 'next' | 'prev') => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  onStatusChange: (id: number, status: string) => Promise<void>;
  onPriorityChange: (id: number, priority: string) => Promise<void>;
};

export default function Details({
  request,
  onNavigate,
  disablePrev,
  disableNext,
  onStatusChange, 
}: DetailsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const attachments: { label: string; url?: string }[] = [
    { label: "Adviser’s Endorsement", url: request.advisers_endorsement },
    { label: 'REC Endorsement', url: request.rec_endorsement },
    { label: 'Proof of Payment', url: request.proof_of_payment },
    { label: 'Reference No.', url: request.reference_no },
  ];

  const lastStatusUpdatedBy = request.last_status_updated_by ?? '';
  const lastStatusUpdatedAt = request.last_status_updated_at ?? '';


  const handleStatusUpdate = async (status: string) => {
    setLoading(status);
    await onStatusChange(request.id, status); 
    setLoading(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-row items-start justify-between mb-6">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          Details
        </div>
        <div className="flex items-center gap-2">
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
      <div className="w-full rounded-md p-1 border mb-4 flex gap-1 flex-wrap text-xs">
        <Button
          variant="ghost"
          className=" px-3 py-2 h-auto text-xs flex items-center gap-1"
          disabled={loading === 'In progress'}
          onClick={() => handleStatusUpdate('In progress')}
        >
          <Clock size={12} /> Mark as In Progress
        </Button>
        <Button
          variant="ghost"
          className=" px-3 py-2 h-auto text-xs flex items-center gap-1"
          disabled={loading === 'Approved'}
          onClick={() => handleStatusUpdate('Approved')}
        >
          <CheckCircle size={12} className="text-green-500" /> Mark as Approved
        </Button>
        <Button
          variant="ghost"
          className=" px-3 py-2 h-auto text-xs flex items-center gap-1"
          disabled={loading === 'Needs-info'}
          onClick={() => handleStatusUpdate('Needs-info')}
        >
          <BadgeInfo size={12} className="text-blue-500" /> Mark as Needs Info
        </Button>
        <Button
          variant="ghost"
          className=" px-3 py-2 h-auto text-xs flex items-center gap-1"
          disabled={loading === 'Rejected'}
          onClick={() => handleStatusUpdate('Rejected')}
        >
          <CircleX size={12} className="text-red-500" /> Mark as Rejected
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-8">
    
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h3 className="text-xs text-zinc-500">Thesis Title</h3>

            
            <p className="text-base font-semibold">{request.thesis_title}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-xs text-zinc-500 mb-1">Presenter</h4>
              <p className="text-sm font-medium">
                {`${request.first_name} ${request.middle_name ?? ''} ${request.last_name}`}
                <span className="text-xs text-muted-foreground font-normal">
                  {' '}
                  / {request.school_id}
                </span>
              </p>
            </div>
            <div>
              <h4 className="text-xs text-zinc-500 mb-1">Program</h4>
              <p className="text-sm font-medium">{request.program}</p>
            </div>
            <div>
              <h4 className="text-xs text-zinc-500 mb-1">Date & Mode</h4>
              <p className="text-sm font-medium">
                {format(new Date(request.date_of_defense), 'PPP')} /{' '}
                {request.mode_defense.replace('-', ' ')}
              </p>
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
            <p className="text-xs font-semibold break-words text-muted-foreground">
              {lastStatusUpdatedBy || <span className="text-muted-foreground">—</span>}
            </p>
          </div>
          <div>
            <h4 className="text-[10px] text-zinc-500 mb-1">Last Status Updated At</h4>
            <p className="text-xs font-semibold text-muted-foreground">
              {lastStatusUpdatedAt
                ? format(new Date(lastStatusUpdatedAt), 'PPP p')
                : <span className="text-muted-foreground">—</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
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
              {request.defense_adviser}
            </li>
            <li>
              <span className="font-medium">Chairperson:</span>{' '}
              {request.defense_chairperson}
            </li>
            <li>
              <span className="font-medium">Panelist I:</span>{' '}
              {request.defense_panelist1}
            </li>
            {request.defense_panelist2 && (
              <li>
                <span className="font-medium">Panelist II:</span>{' '}
                {request.defense_panelist2}
              </li>
            )}
            {request.defense_panelist3 && (
              <li>
                <span className="font-medium">Panelist III:</span>{' '}
                {request.defense_panelist3}
              </li>
            )}
            {request.defense_panelist4 && (
              <li>
                <span className="font-medium">Panelist IV:</span>{' '}
                {request.defense_panelist4}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
