'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { CircleCheck, Info, Paperclip, BadgeCheck, XCircle, Clock, Info as InfoIcon } from 'lucide-react';

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
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Needs-info' | 'In progress';
};

type Props = {
    request: DefenseRequestFull;
};

function statusBadge(status?: string) {
    switch (status) {
        case 'Approved':
            return (
                <Badge className="bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                    <BadgeCheck size={14} /> Approved
                </Badge>
            );
        case 'Rejected':
            return (
                <Badge className="bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <XCircle size={14} /> Rejected
                </Badge>
            );
        case 'Needs-info':
            return (
                <Badge className="bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <InfoIcon size={14} /> Needs Info
                </Badge>
            );
        case 'In progress':
            return (
                <Badge className="bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock size={14} /> In Progress
                </Badge>
            );
        case 'Pending':
        default:
            return (
                <Badge className="bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
                    <Clock size={14} /> Pending
                </Badge>
            );
    }
}

export default function DisplayRequest({ request }: Props) {
    const [liveRequest, setLiveRequest] = useState<DefenseRequestFull>(request);
    const [showDetails, setShowDetails] = useState(false);


    useEffect(() => {
        const interval = setInterval(async () => {
            try {
             
                const res = await fetch(`/api/defense-request/${request.school_id}`);
                if (res.ok) {
                    const data = await res.json();
                    setLiveRequest(data);
                }
            } catch (e) {
                
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [request.school_id]);

    const attachments: { label: string; url?: string }[] = [
        { label: 'Adviser’s Endorsement', url: liveRequest.advisers_endorsement },
        { label: 'REC Endorsement', url: liveRequest.rec_endorsement },
        { label: 'Proof of Payment', url: liveRequest.proof_of_payment },
        { label: 'Reference No.', url: liveRequest.reference_no },
    ];

    return (
        <Card className="pt-10 pb-10">
            <CardHeader className="col-span-2 flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-3 pl-2 text-2xl font-medium">
                        Your Defense Request Was Sent
                        <CircleCheck className="text-rose-500" />
                    </CardTitle>
                    <div className="pb-5 pl-2 flex items-center gap-2">
                        <h1 className="text-muted-foreground">The request will be reviewed shortly</h1>
                        {statusBadge(liveRequest.status)}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <Separator className="w-full" />

                <div className="pl-3">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div>
                            <h3 className="text-xs text-zinc-600">Thesis Title</h3>
                            <h1 className="text-xl font-bold">{request.thesis_title}</h1>
                        </div>

                        <div className="space-x-2">
                            <Tooltip>
                                <TooltipTrigger>
                                    {' '}
                                    <button
                                        onClick={() => setShowDetails((v) => !v)}
                                        aria-label="Toggle details"
                                        className="rounded-lg p-2 hover:bg-zinc-100"
                                    >
                                        <Info className="size-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>More Info</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="mt-2 space-x-2">
                        <Badge variant="secondary">{request.mode_defense}</Badge>
                        <Badge variant="secondary">{request.defense_type}</Badge>
                    </div>
                </div>

                <div className="flex flex-col items-baseline gap-8 pl-3 md:flex-row">
                    <div className="flex flex-col">
                        <h3 className="mb-1 text-xs text-zinc-600">Presenter</h3>
                        <h1 className="text-sm leading-tight font-bold">
                            {`${request.first_name} ${request.middle_name ?? ''} ${request.last_name}`}{' '}
                            <span className="text-muted-foreground text-xs font-thin">/ {request.school_id}</span>
                        </h1>
                        <p className="text-muted-foreground mt-1 text-xs"></p>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="mb-1 text-xs text-zinc-600">Program</h3>
                        <h1 className="text-sm leading-tight font-bold">{request.program}</h1>
                    </div>
                    <div className="flex flex-col">
                        <div className="mb-1 flex items-center space-x-1">
                            <h3 className="text-xs text-zinc-600">Date Scheduled</h3>
                        </div>
                        <p className="text-sm leading-tight font-bold">{format(new Date(request.date_of_defense), 'PPP')}</p>
                    </div>
                </div>

                {showDetails && (
                    <div className="mt-4 rounded-lg p-5 pt-4">
                        <div className="flex flex-col gap-6 lg:flex-row">
                            <div className="w-full lg:w-1/2">
                                <h3 className="mb-2 text-xs text-zinc-600">Attachments</h3>
                                <div className="flex flex-col space-y-2">
                                    {attachments.map(
                                        ({ label, url }) =>
                                            url && (
                                                <a
                                                    key={label}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex w-full items-center space-x-3 rounded-lg border p-2 transition hover:bg-zinc-50"
                                                >
                                                    <div className="flex-shrink-0 rounded bg-rose-500 p-2">
                                                        <Paperclip className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{label}</span>
                                                        <span className="text-muted-foreground text-xs">{url.split('/').pop()}</span>
                                                    </div>
                                                </a>
                                            ),
                                    )}
                                    {!attachments.some((att) => att.url) && (
                                        <p className="text-muted-foreground text-sm">No attachments available.</p>
                                    )}
                                </div>
                            </div>
                            <div className="w-full lg:w-1/2">
                                <h3 className="mb-2 text-xs text-zinc-600">Committee</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Adviser:</span> {request.defense_adviser}
                                    </div>
                                    <div>
                                        <span className="font-medium">Chair:</span> {request.defense_chairperson}
                                    </div>
                                    <div>
                                        <span className="font-medium">Panelist I:</span> {request.defense_panelist1}
                                    </div>
                                    {request.defense_panelist2 && (
                                        <div>
                                            <span className="font-medium">Panelist II:</span> {request.defense_panelist2}
                                        </div>
                                    )}
                                    {request.defense_panelist3 && (
                                        <div>
                                            <span className="font-medium">Panelist III:</span> {request.defense_panelist3}
                                        </div>
                                    )}
                                    {request.defense_panelist4 && (
                                        <div>
                                            <span className="font-medium">Panelist IV:</span> {request.defense_panelist4}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
