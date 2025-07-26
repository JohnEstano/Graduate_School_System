'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Paperclip,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export type DefenseRequestFull = {
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
  status?: 'pending' | 'approved' | 'rejected' | 'needs-info';
};

type DetailsProps = {
  request: DefenseRequestFull;
  onNavigate?: (direction: 'next' | 'prev') => void;
  disablePrev?: boolean;
  disableNext?: boolean;
};

export default function Details({
  request,
  onNavigate,
  disablePrev,
  disableNext,
}: DetailsProps) {
  const attachments: { label: string; url?: string }[] = [
    { label: "Adviser’s Endorsement", url: request.advisers_endorsement },
    { label: 'REC Endorsement', url: request.rec_endorsement },
    { label: 'Proof of Payment', url: request.proof_of_payment },
    { label: 'Reference No.', url: request.reference_no },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-2xl font-semibold">
            Details
          </div>
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
            Contact Assistant
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
  );
}
