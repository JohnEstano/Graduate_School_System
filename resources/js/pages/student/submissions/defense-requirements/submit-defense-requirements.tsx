import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from '@/components/ui/separator';

import React, { useRef, useState, useEffect } from 'react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePage } from '@inertiajs/react';
import { Check, Paperclip, AlertCircle, CalendarIcon } from 'lucide-react';
import { format } from "date-fns";


type FacultyUser = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
};

type PaymentRateRow = {
    program_level: string;
    type: string;
    defense_type: string;
    amount: number;
};

type AdviserSearchInputProps = {
    value: string;
    onChange: (val: string) => void;
};

function AdviserSearchInput({ value, onChange }: AdviserSearchInputProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<FacultyUser[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep query in sync with parent value
    React.useEffect(() => {
        setQuery(value);
    }, [value]);

    // Fetch faculty when query changes
    React.useEffect(() => {
        if (query.length < 4) {
            setResults([]);
            setOpen(false);
            return;
        }
        setLoading(true);
        fetch(`/api/faculty-search?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then((data: FacultyUser[]) => {
                setResults(data);
                setOpen(true);
            })
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    }, [query]);

    // Handle input change
    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val: string = e.target.value;
        setQuery(val);
        onChange(val);
        if (val.length >= 4) setOpen(true);
        else setOpen(false);
    }

    // Handle selection from dropdown
    function handleSelect(user: FacultyUser) {
        const fullName = `${user.first_name} ${user.middle_name ? user.middle_name + " " : ""}${user.last_name}`;
        onChange(fullName);
        setQuery(fullName);
        setOpen(false);
        inputRef.current?.blur();
    }

    // Close dropdown if clicked outside
    function handleBlur() {
        setTimeout(() => setOpen(false), 100);
    }

    return (
        <div style={{ position: "relative" }}>
            <Input
                ref={inputRef}
                value={query}
                onChange={handleInputChange}
                placeholder="Your adviser's name"
                className="h-8 text-sm"
                autoComplete="off"
                onFocus={() => { if (query.length >= 4) setOpen(true); }}
                onBlur={handleBlur}
            />
            {open && (
                <div
                    className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow"
                    style={{ maxHeight: 200, overflowY: "auto" }}
                >
                    {loading && (
                        <div className="px-2 py-1 text-xs text-muted-foreground">Searching...</div>
                    )}
                    {!loading && results.length === 0 && query.length >= 4 && (
                        <div className="px-2 py-1 text-xs text-muted-foreground">No faculty found.</div>
                    )}
                    <ul>
                        {results.map(user => {
                            const fullName = `${user.first_name} ${user.middle_name ? user.middle_name + " " : ""}${user.last_name}`;
                            return (
                                <li
                                    key={user.id}
                                    className="px-2 py-2 cursor-pointer hover:bg-rose-100 text-sm"
                                    onMouseDown={() => handleSelect(user)}
                                >
                                    {fullName}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

type Props = {
    onFinish?: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    acceptDefense?: boolean; // <-- add prop
};

export default function SubmitDefenseRequirements({ onFinish, open, onOpenChange, acceptDefense = true }: Props) {
    // Get logged-in user info from Inertia page props
    const { props } = usePage<any>();
    const user = props?.auth?.user || {};
    const adviser = Array.isArray(user.advisers) && user.advisers.length > 0 ? user.advisers[0] : null;

    const manuscriptRef = useRef<HTMLInputElement>(null);
    const similarityRef = useRef<HTMLInputElement>(null);
    const recEndorsementRef = useRef<HTMLInputElement>(null);
    const proofOfPaymentRef = useRef<HTMLInputElement>(null);
    const aviseeAdviserAttachmentRef = useRef<HTMLInputElement>(null);

    const [paymentRates, setPaymentRates] = useState<PaymentRateRow[]>([]);

    // Add defense_type to form data
    const { data, setData, post, processing, reset } = useForm<{
        first_name: string;
        middle_name: string;
        last_name: string;
        school_id: string;
        program: string;
        thesis_title: string;
        adviser: string;
        adviser_id: number | null;
        status: string;
        defense_type: string;
        rec_endorsement: File | null;
        proof_of_payment: File | null;
        reference_no: string;
        payment_date: Date | null;
        manuscript_proposal: File | null;
        similarity_index: File | null;
        avisee_adviser_attachment: File | null;
        amount: string;
    }>({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        school_id: user.school_id || '',
        program: user.program || '',
        thesis_title: '',
        adviser: adviser ? `${adviser.first_name} ${adviser.middle_name ? adviser.middle_name + " " : ""}${adviser.last_name}` : '',
        adviser_id: adviser ? adviser.id : null,
        status: 'pending',
        defense_type: '',
        rec_endorsement: null,
        proof_of_payment: null,
        reference_no: '',
        payment_date: null,
        manuscript_proposal: null,
        similarity_index: null,
        avisee_adviser_attachment: null,
        amount: '',
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [showSuccessPanel, setShowSuccessPanel] = useState(false);
    const [showValidationAlert, setShowValidationAlert] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');

    // Fetch payment rates on mount
    useEffect(() => {
        fetch('/api/payment-rates')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Payment rates fetched successfully:', data);
                if (data.rates) {
                    setPaymentRates(data.rates);
                }
            })
            .catch(err => {
                console.error('Failed to fetch payment rates:', err);
                console.error('Make sure you are logged in and the route /api/payment-rates is accessible');
            });
    }, []);

    // Auto-calculate payment amount when defense type or program changes
    useEffect(() => {
        if (!data.defense_type || !data.program || paymentRates.length === 0) {
            setData('amount', '');
            return;
        }

        // Map program to program_level using same logic as backend ProgramLevel helper
        let programLevel = 'Masteral'; // Default
        const lowerProgram = data.program.toLowerCase().trim();
        
        // Check for doctorate keywords first (same as backend)
        const doctorateKeywords = ['doctor', 'doctorate', 'doctoral', 'phd', 'ph.d', 'ph. d', 'dba', 'edd', 'ed.d', 'dsc', 'dpm', 'dpa'];
        const isDoctorateProgramMatch = doctorateKeywords.some(kw => lowerProgram.includes(kw));
        
        if (isDoctorateProgramMatch) {
            programLevel = 'Doctorate';
        } else {
            // All other programs (including Bachelors) map to Masteral for testing
            programLevel = 'Masteral';
        }

        // Normalize defense type for comparison - match exact case from database
        const normalizedDefenseType = data.defense_type; // Keep original case: "Proposal", "Pre-final", "Final"

        console.log('Payment calculation:', {
            program: data.program,
            mappedLevel: programLevel,
            defenseType: normalizedDefenseType,
            availableRates: paymentRates
        });

        // Calculate total amount for this program level and defense type
        const matchingRates = paymentRates.filter(rate => {
            const programMatch = rate.program_level === programLevel;
            const defenseMatch = rate.defense_type.toLowerCase() === normalizedDefenseType.toLowerCase();
            return programMatch && defenseMatch;
        });

        console.log('Matching rates:', matchingRates);

        const totalAmount = matchingRates.reduce((sum, rate) => sum + Number(rate.amount), 0);

        console.log('Total calculated amount:', totalAmount);

        setData('amount', totalAmount > 0 ? totalAmount.toFixed(2) : '0.00');
    }, [data.defense_type, data.program, paymentRates]);

    function handleFile(field: keyof typeof data) {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files?.[0]) {
                const file = e.target.files[0];
                
                // Professional file validation
                const maxSize = 200 * 1024 * 1024; // 200MB
                const allowedTypes = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'image/jpeg',
                    'image/png',
                    'image/jpg',
                    'image/gif',
                    'image/webp'
                ];

                // Check file size
                if (file.size > maxSize) {
                    setValidationMessage(`File size too large. Maximum allowed size is 200MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
                    setShowValidationAlert(true);
                    e.target.value = '';
                    return;
                }

                // Check file type
                if (!allowedTypes.includes(file.type)) {
                    setValidationMessage(`File type not allowed. Please upload PDF, Word documents, or images (JPEG, PNG).`);
                    setShowValidationAlert(true);
                    e.target.value = '';
                    return;
                }

                setData(field, file);
            }
        };
    }

    function handleSubmit() {
        // Transform data to match backend expectations
        const formData = {
            firstName: data.first_name,
            middleName: data.middle_name,
            lastName: data.last_name,
            schoolId: data.school_id,
            program: data.program,
            thesisTitle: data.thesis_title,
            defenseAdviser: data.adviser,
            defenseType: data.defense_type,
            recEndorsement: data.rec_endorsement,
            proofOfPayment: data.proof_of_payment,
            referenceNo: data.reference_no,
            paymentDate: data.payment_date ? format(data.payment_date, "yyyy-MM-dd") : null,
            amount: data.amount,
            manuscriptProposal: data.manuscript_proposal,
            similarityIndex: data.similarity_index,
            aviseeAdviserAttachment: data.avisee_adviser_attachment,
        };

        post(route('defense-requirements.store'), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                window.location.reload(); // Refresh the page after successful submission
            },
            onError: (errors) => {
                console.error('Submission failed:', errors);
                
                if (errors.message && errors.message.includes('POST Content-Length')) {
                    setValidationMessage('File upload failed: Files are too large. Please ensure each file is under 200MB and try again.');
                    setShowValidationAlert(true);
                } else if (errors.message && errors.message.includes('PostTooLargeException')) {
                    setValidationMessage('Upload size limit exceeded. Please reduce file sizes and try again.');
                    setShowValidationAlert(true);
                } else {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    setValidationMessage(`Submission failed:\n${errorMessages}`);
                    setShowValidationAlert(true);
                }
            },
            onProgress: (progress) => {
                console.log('Upload progress:', progress);
            }
        });
    }

    // Validation function based on defense type
    function isStepTwoValid() {
        if (!data.defense_type) return false;
        if (!data.thesis_title.trim()) return false;
        if (!data.manuscript_proposal) return false;
        if (!data.similarity_index) return false;
        if (!data.proof_of_payment) return false;
        if (!data.reference_no.trim()) return false;
        if (!data.payment_date) return false;
        if (data.amount === '' || data.amount === null || data.amount === undefined) return false; // Amount must be calculated

        if (data.defense_type === 'Proposal') {
            if (!data.avisee_adviser_attachment) return false;
        }
        if (data.defense_type === 'Pre-final' || data.defense_type === 'Final') {
            if (!data.rec_endorsement) return false;
        }
        return true;
    }

    function handleNext() {
        // If on Step 1, always allow next (since it's read-only)
        if (currentStep === 0) {
            setCurrentStep(currentStep + 1);
            return;
        }
        // If on Step 2, validate required fields
        if (currentStep === 1) {
            if (!isStepTwoValid()) {
                setValidationMessage('Please fill in all required fields and upload all required documents before proceeding.');
                setShowValidationAlert(true);
                return;
            }
            setCurrentStep(currentStep + 1);
            return;
        }
        // If on Step 3, submit
        if (currentStep === 2) {
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
                <div className="flex flex-col gap-6">
                    <div>
                        <h3 className="text-base font-semibold mb-2">Student Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div>
                            <Label className="text-xs">Adviser</Label>
                            <Input
                                value={adviser
                                    ? `${adviser.first_name} ${adviser.middle_name ? adviser.middle_name + " " : ""}${adviser.last_name}`
                                    : 'No adviser registered'}
                                readOnly
                                disabled
                                placeholder="Adviser"
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Defense Type & Thesis Information',
            content: (
                <div className="space-y-6 pb-10">
                    <div>
                        <h3 className="text-base font-semibold mb-2">Defense Details</h3>
                        <div className="flex gap-2 mb-2">
                            {[
                                { value: "Proposal", label: "Proposal" },
                                { value: "Pre-final", label: "Pre-final" },
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
                        <p className="text-xs text-muted-foreground">Select the type of defense you are applying for.</p>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="text-base font-semibold mb-2">Thesis Information</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label className="text-xs">
                                    Thesis Title <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    value={data.thesis_title}
                                    onChange={e => setData('thesis_title', e.target.value)}
                                    placeholder="Thesis Title"
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="text-base font-semibold mb-2">Document Uploads</h3>
                        <p className="text-xs text-gray-600 mb-3">
                            Please upload the required documents below. <strong>PDF files only</strong> are accepted. <br />
                          
                        </p>
                        <div className="space-y-4">
                            {(data.defense_type === 'Pre-final' || data.defense_type === 'Final') && (
                                <div>
                                    <Label className="text-xs">
                                        REC Endorsement <span className="text-rose-500">*</span>
                                    </Label>
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
                                </div>
                            )}
                            <div>
                                <Label className="text-xs">
                                    Manuscript <span className="text-rose-500">*</span>
                                </Label>
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
                            </div>
                            <div>
                                <Label className="text-xs">
                                    Similarity Form <span className="text-rose-500">*</span>
                                </Label>
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
                            {data.defense_type === 'Proposal' && (
                                <div>
                                    <Label className="text-xs">
                                        Avisee-Adviser Attachment <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            readOnly
                                            value={data.avisee_adviser_attachment ? data.avisee_adviser_attachment.name : ''}
                                            placeholder="No file chosen"
                                            className="flex-1 h-8 text-sm"
                                        />
                                        <Button variant="outline" type="button" onClick={() => aviseeAdviserAttachmentRef.current?.click()} className="h-8 px-2 text-xs">
                                            <Paperclip className="mr-1 h-4 w-4" />
                                            Choose File
                                        </Button>
                                        <input
                                            type="file"
                                            ref={aviseeAdviserAttachmentRef}
                                            className="hidden"
                                            onChange={handleFile('avisee_adviser_attachment')}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <Separator className="my-4" />
                    <div>
                        <h3 className="text-base font-semibold mb-2">Payment</h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <Label className="text-xs mb-1">
                                    Proof of Payment <span className="text-rose-500">*</span>
                                </Label>
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
                            </div>
                            <div>
                                <Label className="text-xs mb-1 flex items-center gap-1">
                                    Amount <span className="text-rose-500">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-gray-700">₱</span>
                                    <Input
                                        type="text"
                                        value={
                                            data.amount 
                                                ? parseFloat(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                : data.defense_type 
                                                    ? '0.00' 
                                                    : ''
                                        }
                                        readOnly
                                        disabled
                                        placeholder={data.defense_type ? "Calculating..." : "Select defense type first"}
                                        className="h-8 text-sm w-48 bg-gray-50"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Please ensure that the submitted proof of payment matches the amount reflected above.
                                </p>
                            </div>
                            <div>
                                <Label className="text-xs mb-1">
                                    Payment Date <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={data.payment_date ? format(data.payment_date, "yyyy-MM-dd") : ""}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setData('payment_date', val ? new Date(val) : null);
                                    }}
                                    className="h-8 text-sm w-full"
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1">
                                    Reference No. <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    value={data.reference_no}
                                    onChange={e => setData('reference_no', e.target.value)}
                                    placeholder="Reference No."
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Review Submission',
            content: (
                <div className="space-y-6">
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm space-y-4">
                        <div>
                            <div className="mb-1 font-semibold text-rose-700">Personal Information</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                <div>
                                    <span className="font-medium">Name:</span> {`${data.first_name} ${data.middle_name} ${data.last_name}`}
                                </div>
                                <div>
                                    <span className="font-medium">School ID:</span> {data.school_id}
                                </div>
                                <div>
                                    <span className="font-medium">Program:</span> {data.program}
                                </div>
                                <div>
                                    <span className="font-medium">Adviser:</span> {data.adviser}
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <div className="mb-1 font-semibold text-rose-700">Defense Details</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                <div>
                                    <span className="font-medium">Type of Defense:</span> {data.defense_type}
                                </div>
                                <div>
                                    <span className="font-medium">Thesis Title:</span> {data.thesis_title}
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <div className="mb-1 font-semibold text-rose-700">Document Uploads</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                {(data.defense_type === 'Pre-final' || data.defense_type === 'Final') && (
                                    <div>
                                        <span className="font-medium">REC Endorsement:</span> {data.rec_endorsement?.name || <span className="text-muted-foreground">—</span>}
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium">Manuscript:</span> {data.manuscript_proposal?.name || <span className="text-muted-foreground">—</span>}
                                </div>
                                <div>
                                    <span className="font-medium">Similarity Form:</span> {data.similarity_index?.name || <span className="text-muted-foreground">—</span>}
                                </div>
                                {data.defense_type === 'Proposal' && (
                                    <div>
                                        <span className="font-medium">Avisee-Adviser Attachment:</span> {data.avisee_adviser_attachment?.name || <span className="text-muted-foreground">—</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <div className="mb-1 font-semibold text-rose-700">Payment</div>
                            <div className="grid grid-cols-1 gap-y-1">
                                <div>
                                    <span className="font-medium">Proof of Payment:</span> {data.proof_of_payment?.name || <span className="text-muted-foreground">—</span>}
                                </div>
                                <div>
                                    <span className="font-medium">Reference No.:</span> {data.reference_no}
                                </div>
                                <div>
                                    <span className="font-medium">Payment Date:</span> {data.payment_date ? format(data.payment_date, "PPP") : <span className="text-muted-foreground">—</span>}
                                </div>
                                <div>
                                    <span className="font-medium">Amount:</span>
                                    {data.amount ? (
                                        <span>₱ {parseFloat(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    // If submissions are closed, show a blocking message
    if (!acceptDefense) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Defense Requirement Submission Closed</DialogTitle>
                        <DialogDescription>
                            The coordinator has disabled defense requirement submissions. Please try again later or contact your coordinator.
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogContent className="flex h-[95vh] w-full max-w-3xl flex-col">
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

            {/* Validation Alert Dialog */}
            <AlertDialog open={showValidationAlert} onOpenChange={setShowValidationAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                            <AlertDialogTitle className="text-lg">Required Fields Missing</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="pt-3 text-base whitespace-pre-line">
                            {validationMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction className="bg-rose-600 hover:bg-rose-700">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}