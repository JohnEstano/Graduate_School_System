'use client';
import HeadingSmall from '@/components/heading-small';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, Paperclip, Plus } from 'lucide-react';
import * as React from 'react';
import { useRef, useState } from 'react';

type PageProps = {
    auth: {
        user: {
            first_name: string;
            middle_name: string;
            last_name: string;
            program: string;
            school_id: string;
        } | null;
    };
};

type FormValues = {
    firstName: string;
    middleName: string;
    lastName: string;
    schoolId: string;
    program: string;
    thesisTitle: string;
    date: string;
    modeDefense: string;
    defenseType: string;
    advisersEndorsement: File | null;
    recEndorsement: File | null;
    proofOfPayment: File | null;
    referenceNo: File | null;
    defenseAdviser: string;
    defenseChairperson: string;
    defensePanelist1: string;
    defensePanelist2: string;
    defensePanelist3: string;
    defensePanelist4: string;
};

export default function DefenseRequestForm() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const form = useForm<FormValues>({
        firstName: user?.first_name || '',
        middleName: user?.middle_name || '',
        lastName: user?.last_name || '',
        schoolId: user?.school_id || '',
        program: user?.program || '',
        thesisTitle: '',
        date: '',
        modeDefense: '',
        defenseType: '',
        advisersEndorsement: null,
        recEndorsement: null,
        proofOfPayment: null,
        referenceNo: null,
        defenseAdviser: '',
        defenseChairperson: '',
        defensePanelist1: '',
        defensePanelist2: '',
        defensePanelist3: '',
        defensePanelist4: '',
    });

    const advisersRef = useRef<HTMLInputElement>(null);
    const recRef = useRef<HTMLInputElement>(null);
    const paymentRef = useRef<HTMLInputElement>(null);
    const referenceRef = useRef<HTMLInputElement>(null);

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, files } = e.target;
        if (files?.[0]) {
            form.setData(name as keyof FormValues, files[0]);
        }
    }

    function next() {
        setStep((s) => Math.min(s + 1, steps.length - 1));
    }
    function prev() {
        setStep((s) => Math.max(s - 1, 0));
    }

    function submit() {
        if (form.processing) return;
        form.post('/defense-request', {
            onSuccess: () => {
                // keep dialog open, show our success panel
                setShowSuccessPanel(true);
            },
        });
    }

    const onNext = () => (step === steps.length - 1 ? submit() : next());

    const steps = [
        {
            title: 'Personal',
            content: (
                <>
                    <HeadingSmall title="Step 1: Personal Information" />
                    <div className="grid grid-cols-2 gap-5 pt-3 sm:grid-cols-3">
                        <div>
                            <Label>First Name</Label>
                            <Input name="firstName" value={form.data.firstName} onChange={(e) => form.setData('firstName', e.target.value)} />
                        </div>
                        <div>
                            <Label>Middle Name</Label>
                            <Input name="middleName" value={form.data.middleName} onChange={(e) => form.setData('middleName', e.target.value)} />
                        </div>
                        <div>
                            <Label>Last Name</Label>
                            <Input name="lastName" value={form.data.lastName} onChange={(e) => form.setData('lastName', e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Label>School ID</Label>
                        <Input name="schoolId" value={form.data.schoolId} onChange={(e) => form.setData('schoolId', e.target.value)} />
                    </div>
                    <div className="mt-4">
                        <Label>Program</Label>
                        <Input name="program" value={form.data.program} onChange={(e) => form.setData('program', e.target.value)} />
                    </div>
                </>
            ),
        },
        {
            title: 'Thesis Information',
            content: (
                <>
                    <HeadingSmall title="Step 2: Thesis Information" />
                    <div className="grid grid-cols-5 gap-3 pt-3">
                        <div className="col-span-3">
                            <Label>Thesis / Dissertation Title</Label>
                            <Input
                                name="thesisTitle"
                                value={form.data.thesisTitle}
                                placeholder="Title"
                                onChange={(e) => form.setData('thesisTitle', e.target.value)}
                            />
                        </div>
                        <div className="col-span-2">
                            <Label>Date of Defense</Label>
                            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                        {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="bottom" align="start" sideOffset={4} className="pointer-events-auto z-50 w-auto p-0">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => {
                                                setSelectedDate(date || undefined);
                                                if (date) {
                                                    form.setData('date', format(date, 'yyyy-MM-dd'));
                                                }
                                                setDatePickerOpen(false);
                                            }}
                                            captionLayout="dropdown"
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <div>
                            <Label>Mode of Defense</Label>
                            <Select value={form.data.modeDefense} onValueChange={(v) => form.setData('modeDefense', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Face to Face">Face to Face</SelectItem>
                                    <SelectItem value="Online">Online</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Type of Defense</Label>
                            <Select value={form.data.defenseType} onValueChange={(v) => form.setData('defenseType', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Proposal">Proposal</SelectItem>
                                    <SelectItem value="Prefinal">Prefinal</SelectItem>
                                    <SelectItem value="Final">Final</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </>
            ),
        },
        {
            title: 'Required Attachments',
            content: (
                <>
                    <div></div>
                    <HeadingSmall title="Step 3: Required Attachments" />
                    {(
                        [
                            ['advisersEndorsement', 'Adviser’s Endorsement', advisersRef],
                            ['recEndorsement', 'REC Endorsement', recRef],
                            ['proofOfPayment', 'Proof of Payment', paymentRef],
                            ['referenceNo', 'Reference No.', referenceRef],
                        ] as const
                    ).map(([field, label, inputRef]) => (
                        <div key={field}>
                            <Label>{label}</Label>
                            <div className="mb-3 flex items-center gap-2">
                                <Input readOnly value={form.data[field]?.name || ''} placeholder="No file chosen" className="flex-1" />
                                <Button variant="outline" onClick={() => inputRef.current?.click()}>
                                    <Paperclip className="mr-1 h-4 w-4" />
                                    Choose File
                                </Button>
                                <input type="file" name={field} ref={inputRef} className="hidden" onChange={handleFile} />
                            </div>
                        </div>
                    ))}
                </>
            ),
        },
        {
            title: 'Defense Committee',
            content: (
                <>
                    <HeadingSmall title="Step 4: Defense Committee" />
                    <div className="space-y-4 pt-3 pb-5">
                        {(
                            [
                                'defenseAdviser',
                                'defenseChairperson',
                                'defensePanelist1',
                                'defensePanelist2',
                                'defensePanelist3',
                                'defensePanelist4',
                            ] as const
                        ).map((field) => (
                            <div key={field}>
                                <Label>{field.replace('defense', '')}</Label>
                                <Input name={field} value={form.data[field]} onChange={(e) => form.setData(field, e.target.value)} />
                            </div>
                        ))}
                    </div>
                </>
            ),
        },
        {
            title: 'Review Submission',
            content: (
                <div className="w-full space-y-4 pb-5">
                    <HeadingSmall title="Step 5: Review Submission" />
                    <div className="space-y-6 rounded-lg border border-rose-200 bg-rose-50 p-6">
                        <div className="grid grid-cols-1 gap-4 text-gray-700 sm:grid-cols-2">
                            <div>
                                <Label className="text-gray-800">Name</Label>
                                <div>{`${form.data.firstName} ${form.data.middleName} ${form.data.lastName}`}</div>
                            </div>
                            <div className="sm:col-span-2">
                                <Label className="text-gray-800">School ID / Program</Label>
                                <div className="mb-3">{`${form.data.schoolId} / ${form.data.program}`}</div>
                                <Label className="text-gray-800">Thesis Title</Label>
                                <div>{form.data.thesisTitle}</div>
                            </div>
                            <div>
                                <Label className="text-gray-800">Date of Defense</Label>
                                <div>{form.data.date || '—'}</div>
                            </div>
                            <div>
                                <Label className="text-gray-800">Mode / Type</Label>
                                <div>{`${form.data.modeDefense} / ${form.data.defenseType}`}</div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-gray-800">Attachments</Label>
                            <ul className="list-inside list-disc text-gray-700">
                                <li>Adviser’s Endorsement: {form.data.advisersEndorsement?.name || '—'}</li>
                                <li>REC Endorsement: {form.data.recEndorsement?.name || '—'}</li>
                                <li>Proof of Payment: {form.data.proofOfPayment?.name || '—'}</li>
                                <li>Reference No.: {form.data.referenceNo?.name || '—'}</li>
                            </ul>
                        </div>
                        <div>
                            <Label className="text-gray-800">Defense Committee</Label>
                            <ul className="list-inside list-disc text-gray-700">
                                <li>Adviser: {form.data.defenseAdviser || '—'}</li>
                                <li>Chairperson: {form.data.defenseChairperson || '—'}</li>
                                <li>Panelist I: {form.data.defensePanelist1 || '—'}</li>
                                <li>Panelist II: {form.data.defensePanelist2 || '—'}</li>
                                <li>Panelist III: {form.data.defensePanelist3 || '—'}</li>
                                <li>Panelist IV: {form.data.defensePanelist4 || '—'}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    setStep(0);
                    form.reset();
                    setSelectedDate(undefined);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button className="rounded-lg bg-rose-500">
                    <Plus className="mr-2" /> Submit a Defense Request
                </Button>
            </DialogTrigger>
            <DialogContent className="flex h-[95vh] w-full max-w-4xl flex-col">
                <DialogHeader>
                    <DialogTitle>Submit Defense Request</DialogTitle>
                    <DialogDescription>Fill up all necessary information</DialogDescription>
                </DialogHeader>

                {showSuccessPanel ? (
                    <div className="flex flex-1 flex-col items-center justify-center space-y-6 px-4">
                        <Check size={48} className="text-rose-500" />
                        <h2 className="text-2xl font-semibold">Request Submitted!</h2>
                        <p className="text-center text-gray-600">Your defense request has been saved successfully.</p>
                        <Button onClick={() => setOpen(false)}>Done</Button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto px-4">
                        <Stepper steps={steps} currentStep={step} onNext={onNext} onPrev={prev} loading={form.processing} className="h-full" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
