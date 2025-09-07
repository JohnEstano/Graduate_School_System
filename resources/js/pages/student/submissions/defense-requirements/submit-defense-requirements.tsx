import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Check, Plus } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Stepper } from '@/components/ui/Stepper';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { usePage } from '@inertiajs/react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import clsx from "clsx";

type Props = {
    onFinish?: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function SubmitDefenseRequirements({ onFinish, open, onOpenChange }: Props) {
    // Get logged-in user info from Inertia page props
    const { props } = usePage<any>();
    const user = props?.auth?.user || {};

    const manuscriptRef = useRef<HTMLInputElement>(null);
    const similarityRef = useRef<HTMLInputElement>(null);
    const recEndorsementRef = useRef<HTMLInputElement>(null);
    const proofOfPaymentRef = useRef<HTMLInputElement>(null);

    // Add defense_type to form data
    const { data, setData, post, processing, reset } = useForm<{
        first_name: string;
        middle_name: string;
        last_name: string;
        school_id: string;
        program: string;
        thesis_title: string;
        adviser: string;
        status: string;
        defense_type: string; // <-- added
        rec_endorsement: File | null;
        proof_of_payment: File | null;
        reference_no: string;
        manuscript_proposal: File | null;
        similarity_index: File | null;
    }>({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        school_id: user.school_id || '',
        program: user.program || '',
        thesis_title: '',
        adviser: '',
        status: 'pending',
        defense_type: '', // <-- added
        rec_endorsement: null,
        proof_of_payment: null,
        reference_no: '',
        manuscript_proposal: null,
        similarity_index: null,
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);

    function handleFile(field: keyof typeof data) {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files?.[0]) {
                setData(field, e.target.files[0]);
            }
        };
    }

    function handleSubmit() {
        post(route('defense-requirements.store'), {
            forceFormData: true,
            onSuccess: () => {
                setShowSuccessPanel(true);
                if (onFinish) onFinish();
            },
        });
    }

    function handleNext() {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    }

    function handlePrev() {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }

    function handleDialogChange(isOpen: boolean) {
        onOpenChange(isOpen);
        if (!isOpen) {
            setCurrentStep(0);
            reset();
            setShowSuccessPanel(false);
        }
    }

    const steps = [
        {
            title: 'Personal Information',
            content: (
                <div className="flex flex-col gap-3">
                    <div>
                        <Label className="text-xs">First Name</Label>
                        <Input
                            value={data.first_name}
                            readOnly
                            disabled
                            placeholder="First Name"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Middle Name</Label>
                        <Input
                            value={data.middle_name}
                            readOnly
                            disabled
                            placeholder="Middle Name"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Last Name</Label>
                        <Input
                            value={data.last_name}
                            readOnly
                            disabled
                            placeholder="Last Name"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">School ID</Label>
                        <Input
                            value={data.school_id}
                            readOnly
                            disabled
                            placeholder="School ID"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Program</Label>
                        <Input
                            value={data.program}
                            readOnly
                            disabled
                            placeholder="Program"
                            className="h-8 text-sm"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'Defense Type & Thesis Information',
            content: (
                <div className="space-y-4">
                    <div>
                        <Label className="text-xs mb-2 block">Type of Defense</Label>
                        <div className="flex gap-2 mb-4">
                            {[
                                { value: "Proposal", label: "Proposal" },
                                { value: "Prefinal", label: "Prefinal" },
                                { value: "Final", label: "Final" },
                            ].map(option => (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => setData('defense_type', option.value)}
                                    className={`rounded-md px-4 py-2 text-xs font-medium cursor-pointer border
                                        ${data.defense_type === option.value
                                            ? "bg-rose-500 text-white border-rose-500"
                                            : "bg-white text-zinc-700 border-zinc-200"
                                        }`}
                                    aria-pressed={data.defense_type === option.value}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs">Thesis Title</Label>
                        <Input
                            value={data.thesis_title}
                            onChange={e => setData('thesis_title', e.target.value)}
                            placeholder="Thesis Title"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Adviser</Label>
                        <Input
                            value={data.adviser}
                            onChange={e => setData('adviser', e.target.value)}
                            placeholder="Adviser"
                            className="h-8 text-sm"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'Attachments',
            content: (
                <div className="space-y-4 mb-4">
                    <Label className="text-xs">Reference No.</Label>
                    <Input
                        value={data.reference_no}
                        onChange={e => setData('reference_no', e.target.value)}
                        placeholder="Reference No."
                        className="h-8 text-sm"
                    />
                    <Label className="text-xs">REC Endorsement</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={data.rec_endorsement ? data.rec_endorsement.name : ''}
                            placeholder="No file chosen"
                            className="flex-1 h-8 text-sm"
                        />
                        <Button variant="outline" type="button" onClick={() => recEndorsementRef.current?.click()} className="h-8 px-2 text-xs">
                            <Paperclip className="mr-1 h-4 w-4" />
                            Choose File
                        </Button>
                        <input
                            type="file"
                            ref={recEndorsementRef}
                            className="hidden"
                            onChange={handleFile('rec_endorsement')}
                        />
                    </div>
                    <Label className="text-xs">Proof of Payment</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={data.proof_of_payment ? data.proof_of_payment.name : ''}
                            placeholder="No file chosen"
                            className="flex-1 h-8 text-sm"
                        />
                        <Button variant="outline" type="button" onClick={() => proofOfPaymentRef.current?.click()} className="h-8 px-2 text-xs">
                            <Paperclip className="mr-1 h-4 w-4" />
                            Choose File
                        </Button>
                        <input
                            type="file"
                            ref={proofOfPaymentRef}
                            className="hidden"
                            onChange={handleFile('proof_of_payment')}
                        />
                    </div>
                    <Label className="text-xs">Manuscript for Proposal</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={data.manuscript_proposal ? data.manuscript_proposal.name : ''}
                            placeholder="No file chosen"
                            className="flex-1 h-8 text-sm"
                        />
                        <Button variant="outline" type="button" onClick={() => manuscriptRef.current?.click()} className="h-8 px-2 text-xs">
                            <Paperclip className="mr-1 h-4 w-4" />
                            Choose File
                        </Button>
                        <input
                            type="file"
                            ref={manuscriptRef}
                            className="hidden"
                            onChange={handleFile('manuscript_proposal')}
                        />
                    </div>
                    <Label className="text-xs">Similarity Index</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={data.similarity_index ? data.similarity_index.name : ''}
                            placeholder="No file chosen"
                            className="flex-1 h-8 text-sm"
                        />
                        <Button variant="outline" type="button" onClick={() => similarityRef.current?.click()} className="h-8 px-2 text-xs">
                            <Paperclip className="mr-1 h-4 w-4" />
                            Choose File
                        </Button>
                        <input
                            type="file"
                            ref={similarityRef}
                            className="hidden"
                            onChange={handleFile('similarity_index')}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'Review Submission',
            content: (
                <div className="space-y-4">
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm">
                        <div className="mb-2 font-semibold">Personal Info</div>
                        <div>Name: {`${data.first_name} ${data.middle_name} ${data.last_name}`}</div>
                        <div>School ID: {data.school_id}</div>
                        <div>Program: {data.program}</div>
                        <div>Type of Defense: {data.defense_type}</div>
                        <div>Thesis Title: {data.thesis_title}</div>
                        <div>Adviser: {data.adviser}</div>
                        <div>Reference No.: {data.reference_no}</div>
                        <div>Recommendation Endorsement: {data.rec_endorsement?.name || '—'}</div>
                        <div>Proof of Payment: {data.proof_of_payment?.name || '—'}</div>
                        <div>Manuscript Proposal: {data.manuscript_proposal?.name || '—'}</div>
                        <div>Similarity Index: {data.similarity_index?.name || '—'}</div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent className="flex h-[95vh] w-full max-w-3xl flex-col"> {/* wider dialog */}
                <DialogHeader>
                    <DialogTitle>Submit Defense Requirements</DialogTitle>
                    <DialogDescription>Fill up all necessary information</DialogDescription>
                </DialogHeader>
                {showSuccessPanel ? (
                    <div className="flex flex-1 flex-col items-center justify-center space-y-6 px-4">
                        <Check size={48} className="text-rose-500" />
                        <h2 className="text-2xl font-semibold">Requirements Submitted!</h2>
                        <p className="text-center text-gray-600">Your defense requirements have been saved successfully.</p>
                        <Button onClick={() => onOpenChange(false)}>Done</Button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto px-2">
                        <Stepper
                            steps={steps}
                            currentStep={currentStep}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            loading={processing}
                            className="h-full"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}