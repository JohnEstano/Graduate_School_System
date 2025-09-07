'use client';
import HeadingSmall from '@/components/heading-small';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, usePage } from '@inertiajs/react';
import { Check, Paperclip, Plus, RefreshCcw } from 'lucide-react';
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
    defenseType: string;
    advisersEndorsement: File | null;
    recEndorsement: File | null;
    proofOfPayment: File | null;
    referenceNo: string;
    defenseAdviser: string;
};

export default function DefenseRequestForm() {
    const {
        auth: { user },
    } = usePage<PageProps>().props;
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [adviserSuggestion, setAdviserSuggestion] = useState<string | null>(null);
    const [adviserSource, setAdviserSource] = useState<string | null>(null);
    const [adviserLoading, setAdviserLoading] = useState(false);
    const [adviserCandidates, setAdviserCandidates] = useState<string[]>([]);
    const [showAdviserDropdown, setShowAdviserDropdown] = useState(false);
    const [submissionAttempted, setSubmissionAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        firstName: user?.first_name || '',
        middleName: user?.middle_name || '',
        lastName: user?.last_name || '',
        schoolId: user?.school_id || '',
        program: user?.program || '',
        thesisTitle: '',
        defenseType: '',
        advisersEndorsement: null,
        recEndorsement: null,
        proofOfPayment: null,
        referenceNo: '',
        defenseAdviser: '',
    });

    React.useEffect(() => {
        if (!form.data.defenseAdviser) {
            fetchAdviserSuggestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function fetchAdviserSuggestion() {
        setAdviserLoading(true);
        fetch('/defense-requests/adviser-suggestion')
            .then(r => r.json())
            .then(data => {
                if (data?.suggestion) {
                    setAdviserSuggestion(data.suggestion);
                    setAdviserSource(data.source || null);
                    if (!form.data.defenseAdviser) {
                        form.setData('defenseAdviser', data.suggestion);
                    }
                }
            })
            .catch(() => {})
            .finally(() => setAdviserLoading(false));
    }

    function fetchAdviserCandidates() {
        fetch('/defense-requests/adviser-candidates')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data?.instructors)) {
                    setAdviserCandidates(data.instructors);
                }
            })
            .catch(() => {});
    }

    const advisersRef = useRef<HTMLInputElement>(null);
    const recRef = useRef<HTMLInputElement>(null);
    const paymentRef = useRef<HTMLInputElement>(null);

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, files } = e.target;
        if (files?.[0]) {
            form.setData(name as keyof FormValues, files[0]);
        }
    }

    function next() {
        setStep((s) => {
            const next = Math.min(s + 1, steps.length - 1);
            if (next === 1) {
                fetchAdviserCandidates();
            }
            return next;
        });
    }
    function prev() {
        setStep((s) => Math.max(s - 1, 0));
    }

    async function submit() {
        if (submitting) return;
        setSubmissionAttempted(true);
        setSubmitting(true);
        form.clearErrors();
        try {
            const fd = new FormData();
            const data = form.data;
            (Object.keys(data) as (keyof FormValues)[]).forEach((key) => {
                const value = data[key];
                if (value !== null && value !== undefined && value !== '') {
                    if (value instanceof File) {
                        fd.append(key, value);
                    } else {
                        fd.append(key, String(value));
                    }
                }
            });
            // CSRF token (Laravel) - required for POST
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/defense-request?json=1', {
                method: 'POST',
                body: fd,
                headers: {
                    'Accept': 'application/json',
                    ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (res.status === 419) {
                (form as any).setError('general', 'Session expired. Please refresh the page and try again.');
                return;
            }
            if (res.status === 201) {
                setShowSuccessPanel(true);
                return;
            }
            if (res.status === 422) {
                const payload = await res.json().catch(() => ({}));
                if (payload?.errors) {
                    const errorsObj: Record<string,string> = {};
                    Object.entries(payload.errors).forEach(([field, messages]) => {
                        if (Array.isArray(messages) && messages.length) errorsObj[field] = messages[0] as string;
                    });
                    if (Object.keys(errorsObj).length) {
                        (form as any).setErrors(errorsObj);
                        const errorKeys = Object.keys(errorsObj);
                        if (errorKeys.some(k => ['thesisTitle','defenseType','defenseAdviser'].includes(k))) {
                            setStep(1);
                        } else if (errorKeys.some(k => ['advisersEndorsement','recEndorsement','proofOfPayment','referenceNo'].includes(k))) {
                            setStep(2);
                        }
                    }
                }
                return;
            }
            if (res.status >= 500) {
                (form as any).setError('general', 'Server error while saving. Please try again.');
                return;
            }
            try {
                const json = await res.json();
                if (json?.success) {
                    setShowSuccessPanel(true);
                } else {
                    (form as any).setError('general', 'Unexpected response. Please verify your data and retry.');
                }
            } catch {
                (form as any).setError('general', 'Unexpected non-JSON response from server.');
            }
        } catch (e) {
            (form as any).setError('general', 'Network error. Please check your connection and retry.');
        } finally {
            setSubmitting(false);
        }
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
            title: 'Defense Details',
            content: (
                <>
                    <HeadingSmall title="Step 2: Defense Request Details" />
                    <div className="grid grid-cols-1 gap-5 pt-3 sm:grid-cols-2">
                        <div>
                            <Label>Thesis / Dissertation Title</Label>
                            <Input
                                name="thesisTitle"
                                value={form.data.thesisTitle}
                                placeholder="Enter your thesis/dissertation title"
                                onChange={(e) => form.setData('thesisTitle', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Type of Defense *</Label>
                            <Select value={form.data.defenseType} onValueChange={(v) => form.setData('defenseType', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select defense type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Proposal">Proposal Defense</SelectItem>
                                    <SelectItem value="Prefinal">Pre-final Defense</SelectItem>
                                    <SelectItem value="Final">Final Defense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Label>Research Adviser *</Label>
                        <div className="flex gap-2">
                            <Input
                                name="defenseAdviser"
                                value={form.data.defenseAdviser}
                                onChange={(e) => {
                                    form.setData('defenseAdviser', e.target.value);
                                    if (!showAdviserDropdown) setShowAdviserDropdown(true);
                                }}
                                onFocus={() => {
                                    if (!adviserCandidates.length) fetchAdviserCandidates();
                                    setShowAdviserDropdown(true);
                                }}
                                onBlur={() => setTimeout(() => setShowAdviserDropdown(false), 150)}
                                placeholder={adviserLoading ? 'Loading…' : 'Enter your adviser\'s full name'}
                            />
                            <Button type="button" variant="outline" disabled={adviserLoading} onClick={fetchAdviserSuggestion} className="shrink-0">
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                        </div>
                        {showAdviserDropdown && adviserCandidates.length > 0 && (
                            <div className="mt-1 max-h-40 w-full overflow-auto rounded border bg-white p-1 text-sm shadow">
                                {adviserCandidates.map(name => (
                                    <button
                                        type="button"
                                        key={name}
                                        onMouseDown={(e) => { e.preventDefault(); form.setData('defenseAdviser', name); setShowAdviserDropdown(false); }}
                                        className={`block w-full rounded px-2 py-1 text-left hover:bg-rose-100 ${name === form.data.defenseAdviser ? 'bg-rose-50 font-medium' : ''}`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {adviserSuggestion && (
                            <p className="mt-1 text-xs text-gray-500">Suggested: {adviserSuggestion} {adviserSource ? `(from ${adviserSource.replace('-', ' ')})` : ''}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-600">
                            <strong>Important:</strong> Only your named adviser will be able to review and approve this request.
                        </p>
                    </div>
                </>
            ),
        },
        {
            title: 'Required Attachments',
            content: (
                <>
                    <HeadingSmall title="Step 3: Required Attachments" />
                    {([
                        ['advisersEndorsement', "Adviser's Endorsement", advisersRef],
                        ['recEndorsement', 'REC Endorsement', recRef],
                        ['proofOfPayment', 'Proof of Payment', paymentRef],
                    ] as const).map(([field, label, inputRef]) => (
                        <div key={field}>
                            <Label>{label}</Label>
                            <div className="mb-3 flex items-center gap-2">
                                <Input readOnly value={(form.data as any)[field]?.name || ''} placeholder="No file chosen" className="flex-1" />
                                <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                                    <Paperclip className="mr-1 h-4 w-4" />
                                    Choose File
                                </Button>
                                <input type="file" name={field} ref={inputRef} className="hidden" onChange={handleFile} />
                            </div>
                        </div>
                    ))}
                    <div>
                        <Label>Reference No.</Label>
                        <Input
                            name="referenceNo"
                            value={form.data.referenceNo}
                            placeholder="Enter reference number"
                            onChange={(e) => form.setData('referenceNo', e.target.value)}
                        />
                    </div>
                </>
            ),
        },
        {
            title: 'Review Submission',
            content: (
                <div className="w-full space-y-4 pb-5">
                    <HeadingSmall title="Step 4: Review Submission" />
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
                                <Label className="text-gray-800">Defense Type</Label>
                                <div>{form.data.defenseType || '—'}</div>
                            </div>
                            <div>
                                <Label className="text-gray-800">Research Adviser</Label>
                                <div>{form.data.defenseAdviser || '—'}</div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-gray-800">Attachments</Label>
                            <ul className="list-inside list-disc text-gray-700">
                                <li>Adviser's Endorsement: {form.data.advisersEndorsement?.name || '—'}</li>
                                <li>REC Endorsement: {form.data.recEndorsement?.name || '—'}</li>
                                <li>Proof of Payment: {form.data.proofOfPayment?.name || '—'}</li>
                                <li>Reference No.: {form.data.referenceNo || '—'}</li>
                            </ul>
                        </div>
                        <div className="rounded border border-blue-200 bg-blue-50 p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Next Step:</strong> Upon submission, this request will be sent directly to your research adviser 
                                ({form.data.defenseAdviser || 'TBD'}) for initial review and approval. Once approved by your adviser, 
                                it will be forwarded to the Coordinator for final approval and scheduling.
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    const hasErrors = Object.keys(form.errors).length > 0;

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    setStep(0);
                    form.reset();
                    setShowSuccessPanel(false);
                    setSubmissionAttempted(false);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button className="rounded-lg bg-rose-500">
                    <Plus className="mr-2" /> Submit a Defense Request
                </Button>
            </DialogTrigger>
            <DialogContent className="flex h-[95vh] w-full max-w-4xl flex-col relative">
                <DialogHeader>
                    <DialogTitle>Submit Defense Request</DialogTitle>
                    <DialogDescription>Fill up all necessary information</DialogDescription>
                </DialogHeader>

                {showSuccessPanel ? (
                    <div className="flex flex-1 flex-col items-center justify-center space-y-6 px-4">
                        <Check size={48} className="text-rose-500" />
                        <h2 className="text-2xl font-semibold">Request Submitted!</h2>
                        <p className="text-center text-gray-600 max-w-md">Your defense request has been saved successfully and sent for Adviser review. You will receive a notification once it progresses.</p>
                        <div className="flex gap-3">
                            <Button onClick={() => setOpen(false)}>Close</Button>
                            <Button variant="outline" onClick={() => { setShowSuccessPanel(false); setStep(0); form.reset(); }}>Submit Another</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto px-4">
                        {submissionAttempted && hasErrors && (
                            <div className="mb-4 rounded border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700">
                                <p className="font-semibold mb-1">Please fix the following:</p>
                                <ul className="list-disc ml-4 space-y-0.5">
                                    {Object.entries(form.errors).map(([field, msg]) => (
                                        <li key={field}>{msg as string}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <Stepper steps={steps} currentStep={step} onNext={onNext} onPrev={prev} loading={submitting} className="h-full" />
                    </div>
                )}

                {submitting && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                        <div className="animate-spin h-8 w-8 rounded-full border-2 border-rose-500 border-t-transparent" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
