import React, { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import HeadingSmall from '@/components/heading-small';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/Stepper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Check, Plus, X } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish?: () => void;
};

type Subject = {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  offeringId?: number; // persist selected schedule
};

type OfferingOption = {
  id: number;
  program: string;
  school_year: string;
  subject_code: string | null;
  subject_name: string;
  exam_date: string | null;    // YYYY-MM-DD
  start_time: string | null;   // HH:mm
  end_time: string | null;     // HH:mm
  is_active: boolean;
};

export default function CompreExamForm({ open, onOpenChange, onFinish }: Props) {
  const { props } = usePage<any>();
  const user = props?.auth?.user || {};

  const { data, setData, post, processing, reset } = useForm<{
    schoolYear: string;
    program: string;
    officeAddress: string;
    mobileNo: string;
    telephoneNo: string;
    subjects: Subject[];
  }>({
    schoolYear: '',
    program: user.program || '',
    officeAddress: '',
    mobileNo: user.mobile_no || user.contact_number || '',
    telephoneNo: '',
    subjects: [{ subject: '', date: '', startTime: '', endTime: '' }],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessPanel, setShowSuccessPanel] = useState(false);
  const [schedules, setSchedules] = useState<OfferingOption[]>([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    schoolYear?: string;
    officeAddress?: string;
    mobileNo?: string;
    telephoneNo?: string;
    subjects?: string;
  }>({});

  // Build School Year options 2020-2021 ... 2039-2040
  const schoolYearOptions = React.useMemo(
    () => Array.from({ length: 20 }, (_, i) => {
      const start = 2020 + i;
      return `${start}-${start + 1}`;
    }),
    []
  );

  function handleDialogChange(isOpen: boolean) {
    onOpenChange(isOpen);
    if (!isOpen) {
      setCurrentStep(0);
      reset();
      setShowSuccessPanel(false);
      setErrors({});
    }
  }

  function addSubjectRow() {
    setData('subjects', [...data.subjects, { subject: '', date: '', startTime: '', endTime: '' }]);
  }

  function removeSubjectRow(index: number) {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  }

  function updateSubject<T extends keyof Subject>(index: number, field: T, value: Subject[T]) {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  // Batch-apply an offering selection so nothing gets overwritten by stale state
  function applyOfferingSelection(index: number, o: OfferingOption) {
    setData((prev) => {
      const subjects = prev.subjects.slice();
      const cur = subjects[index] || { subject: '', date: '', startTime: '', endTime: '' };
      subjects[index] = {
        ...cur,
        offeringId: o.id,
        subject: o.subject_name,
        date: o.exam_date || '',
        startTime: o.start_time || '',
        endTime: o.end_time || '',
      };
      return { ...prev, subjects };
    });
  }

  function handleSubmit() {
    // Only submit selected schedules (coordinator offerings)
    const selected = (data.subjects || []).filter(s => !!s.offeringId);
    if (selected.length === 0) {
      alert('Please select at least one examination schedule.');
      return;
    }

    router.post(route('comprehensive-exam.store'), {
      schoolYear: data.schoolYear,
      program: data.program,
      officeAddress: data.officeAddress,
      mobileNo: data.mobileNo,
      telephoneNo: data.telephoneNo,
      // Only IDs; backend will snapshot subject/date/time from the offering
      subjects: selected.map(s => ({ offering_id: s.offeringId })),
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        // Ensure dialog stays open to show success panel even if parent re-renders
        try { onOpenChange?.(true); } catch {}
        setShowSuccessPanel(true);
        onFinish?.();
      },
    });
  }

  // Basic per-step validation rules (must be in component scope)
  function validateStep(stepIndex: number): boolean {
    const nextErrors: typeof errors = {};

    if (stepIndex === 0) {
      // Step 1: require School Year only (other fields are read-only/prefilled)
      if (!data.schoolYear?.trim()) {
        nextErrors.schoolYear = 'School Year is required.';
      }
    }

    if (stepIndex === 1) {
      // Step 2: require Office Address and Mobile No. (Email is read-only; Telephone optional)
      if (!data.officeAddress?.trim()) {
        nextErrors.officeAddress = 'Office Address is required.';
      }
      const raw = (data.mobileNo || '').trim();
      const digits = raw.replace(/\D/g, '');
      const hasNonDigits = /\D/.test(raw);
      if (!raw) {
        nextErrors.mobileNo = 'Mobile number is required.';
      } else if (hasNonDigits || digits.length !== 11) {
        nextErrors.mobileNo = 'Please enter a valid 11-digit mobile number';
      }
      // Telephone (optional) – allow only digits, spaces, dashes, parentheses
      const telRaw = (data.telephoneNo || '').trim();
      if (telRaw) {
        const invalidTel = /[^0-9\s()-]/.test(telRaw);
        if (invalidTel) {
          nextErrors.telephoneNo = 'Only digits, spaces, dashes, and parentheses are allowed';
        }
      }
    }

    if (stepIndex === 2) {
      // Step 3: require at least one selected offering
      const selected = (data.subjects || []).filter((s) => !!s.offeringId);
      if (selected.length === 0) {
        nextErrors.subjects = 'Please select at least one examination schedule.';
      }
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function handlePrev() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  // Load coordinator-posted schedules for student's program + selected SY
  React.useEffect(() => {
    const program = data.program?.trim();
    const sy = data.schoolYear?.trim();
    if (!program || !sy) {
      setSchedules([]);
      return;
    }
    setSchedLoading(true);
    setSchedError(null);

    const qs = new URLSearchParams({ program, school_year: sy }).toString();
    const base =
      safeRoute('student.exam-subject-offerings.index') ||
      safeRoute('api.exam-subject-offerings.index') ||
      '/student/exam-subject-offerings';

    fetch(`${base}?${qs}`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'follow',
    })
      .then(async (r) => {
        const ctype = r.headers.get('content-type') || '';
        if (!r.ok || !ctype.includes('application/json')) {
          throw new Error(`HTTP ${r.status}`);
        }
        return (await r.json()) as OfferingOption[];
      })
      .then((rows) => {
        const filtered = (Array.isArray(rows) ? rows : []).filter(
          (r) => r.is_active && r.exam_date && r.start_time && r.end_time
        );
        setSchedules(filtered);
      })
      .catch(() => setSchedError('Failed to load schedules'))
      .finally(() => setSchedLoading(false));
  }, [data.program, data.schoolYear]);

  // When schedules change, hydrate subject fields from offeringId if missing
  React.useEffect(() => {
    if (!Array.isArray(schedules) || !schedules.length) return;
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s: Subject) => {
        if (!s.offeringId) return s;
        if (s.subject && s.date && s.startTime && s.endTime) return s;
        const found = schedules.find((o) => o.id === s.offeringId);
        return found
          ? {
              ...s,
              subject: found.subject_name,
              date: found.exam_date || '',
              startTime: found.start_time || '',
              endTime: found.end_time || '',
            }
          : s;
      }),
    }));
  }, [schedules]);

  const steps = [
    {
      title: 'Personal Information',
      content: (
        <>
          <HeadingSmall title="Step 1: Personal Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-s">First Name</Label>
              <Input
                className="h-10 text-s disabled:opacity-100"
                value={user.first_name || ''} // changed
                readOnly
                disabled
              />
            </div>
            <div>
              <Label className="text-s">Middle Initial</Label>
              <Input
                className="h-10 text-s disabled:opacity-100"
                maxLength={3}
                value={(user.middle_name?.[0] ?? '')} // changed
                readOnly
                disabled
              />
            </div>
            <div>
              <Label className="text-s">Last Name</Label>
              <Input
                className="h-10 text-s disabled:opacity-100"
                value={user.last_name || ''} // changed
                readOnly
                disabled
              />
            </div>
            <div>
              <Label className="text-s">School Year</Label>
              <select
                className="h-10 text-s w-full border border-zinc-300 dark:border-zinc-700 rounded-md px-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
                value={data.schoolYear}
                onChange={(e) => setData('schoolYear', e.target.value)}
                aria-invalid={!!errors.schoolYear}
              >
                <option value="" disabled>
                  Select school year
                </option>
                {schoolYearOptions.map((sy) => (
                  <option key={sy} value={sy}>
                    {sy}
                  </option>
                ))}
              </select>
              {errors.schoolYear && (
                <p className="text-xs text-rose-600 mt-1">{errors.schoolYear}</p>
              )}
            </div>
            <div>
              <Label className="text-s">Program</Label>
              <Input className="h-10 text-s w-105 disabled:opacity-100" value={data.program} readOnly disabled />
            </div>
          </div>
        </>
      ),
    },
    {
      title: 'Contact Information',
      content: (
        <>
            <HeadingSmall title="Step 2: Contact Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
                <Label className="text-s">Office Address <span className="text-rose-500">*</span></Label>
                <Input
                className="h-10 text-s"
                value={data.officeAddress}
                onChange={(e) => {
                  setData('officeAddress', e.target.value);
                  if (errors.officeAddress) setErrors((prev) => ({ ...prev, officeAddress: undefined }));
                }}
                />
                {errors.officeAddress && (
                  <p className="text-xs text-rose-600 mt-1">{errors.officeAddress}</p>
                )}
            </div>
            <div>
                <Label className="text-s">Mobile No. <span className="text-rose-500">*</span></Label>
                <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-10 text-s"
                value={data.mobileNo}
                placeholder="e.g. 09171234567"
                aria-invalid={!!errors.mobileNo}
                onChange={(e) => {
                  const val = e.target.value;
                  setData('mobileNo', val);

                  const digits = (val || '').replace(/\D/g, '');
                  const hasNonDigits = /\D/.test(val);
                  if (hasNonDigits) {
                    setErrors((prev) => ({ ...prev, mobileNo: 'Only numeric digits (0-9) are allowed' }));
                  } else {
                    setErrors((prev) => ({ ...prev, mobileNo: undefined }));
                  }
                }}
                />
                {errors.mobileNo && (
                  <p className="text-xs text-rose-600 mt-1">{errors.mobileNo}</p>
                )}
            </div>
            <div>
                <Label className="text-s">Telephone No. <span className="text-xs text-zinc-500">(optional)</span></Label>
                <Input
                type="tel"
                className="h-10 text-s"
                value={data.telephoneNo}
                placeholder="e.g. (02) 123-4567"
                aria-invalid={!!errors.telephoneNo}
                onChange={(e) => {
                  const val = e.target.value;
                  setData('telephoneNo', val);
                  const invalid = /[^0-9\s()-]/.test(val);
                  if (invalid) {
                    setErrors((prev) => ({ ...prev, telephoneNo: 'Only digits, spaces, dashes, and parentheses are allowed' }));
                  } else {
                    setErrors((prev) => ({ ...prev, telephoneNo: undefined }));
                  }
                }}
                />
                {errors.telephoneNo && (
                  <p className="text-xs text-rose-600 mt-1">{errors.telephoneNo}</p>
                )}
            </div>
            <div className="md:col-span-2">
                <Label className="text-s">Email</Label>
                <Input
                className="h-10 text-s disabled:opacity-100"
                type="email"
                value={user.email}
                readOnly
                disabled
                />
            </div>
            </div>
        </>
      ),
    },
    {
      title: 'Examination Schedules',
      content: (
        <>
          <HeadingSmall title="Step 3: Examination Schedules" />
          <div className="mt-4 mb-6">
            <p className="text-sm text-gray-600 text-justify">
              Select schedules posted by your coordinator for your program and school year.
            </p>
            {errors.subjects && (
              <p className="text-sm text-rose-600 mt-2">{errors.subjects}</p>
            )}
          </div>

          {!data.schoolYear ? (
            <div className="text-sm text-gray-600">Please select a School Year in Step 1.</div>
          ) : schedLoading ? (
            <div className="text-sm text-gray-600">Loading schedules…</div>
          ) : schedError ? (
            <div className="text-sm text-rose-600">{schedError}</div>
          ) : schedules.length === 0 ? (
            <div className="text-sm text-gray-600">No available schedules yet.</div>
          ) : (
            <div className="space-y-6">
              {data.subjects.map((subj, idx) => {
                // Build options; optionally disable already picked ones
                const takenIds = new Set(
                  data.subjects
                    .map((s, i) => (i === idx ? null : s.offeringId))
                    .filter((v): v is number => typeof v === 'number')
                );
                const selectedKey = subj.subject && subj.date && subj.startTime
                  ? `${subj.subject}|${subj.date}|${subj.startTime}` : '';

                return (
                  <div
                    key={idx}
                    className="group relative border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:border-rose-200 dark:hover:border-rose-700 hover:shadow-md"
                  >
                    <div className="absolute -top-3 -left-2 bg-rose-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Subject {idx + 1}
                    </div>
                    {data.subjects.length > 1 && (
                      <button
                        onClick={() => removeSubjectRow(idx)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-950 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-500 dark:hover:text-rose-400 transition-all"
                        title="Remove Subject"
                        type="button"
                      >
                        <span className="sr-only">Remove Subject</span>
                        <span className="text-lg leading-none">&times;</span>
                      </button>
                    )}

                    <div className="space-y-4">
                      <div className="w-full">
                        <Label className="text-sm font-medium text-gray-700">
                          Pick a schedule
                          <span className="text-rose-500 ml-1">*</span>
                        </Label>
                        <Select
                          // use stable id to persist selection across renders/steps
                          value={subj.offeringId ? String(subj.offeringId) : undefined}
                          onValueChange={(val) => {
                            const id = parseInt(val, 10);
                            const found = schedules.find((o) => o.id === id);
                            if (found) {
                              applyOfferingSelection(idx, found);
                            }
                          }}
                        >
                           <SelectTrigger className="mt-1 h-10 w-full">
                             <SelectValue placeholder="Select from available schedules" />
                           </SelectTrigger>
                           <SelectContent className="max-h-72">
                            {schedules.map((o) => {
                              const label = `${o.subject_name}`;
                              const disabled = takenIds.has(o.id);
                              return (
                                <SelectItem key={o.id} value={String(o.id)} disabled={disabled} title={o.subject_name}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Read-only details after selection */}
                      {subj.offeringId && subj.subject && subj.date ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Exam Date</Label>
                            <Input
                              className="mt-1 h-10"
                              value={format(new Date(subj.date), 'MMMM d, yyyy')}
                              readOnly
                              disabled
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Time</Label>
                            <Input
                              className="mt-1 h-10"
                              value={
                                subj.startTime && subj.endTime
                                  ? `${formatTime12hr(subj.startTime)} - ${formatTime12hr(subj.endTime)}`
                                  : '--'
                              }
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                       ) : null}
                    </div>
                  </div>
                );
              })}

              <Button
                type="button"
                onClick={addSubjectRow}
                className="w-full mt-4 py-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950 hover:border-rose-300 dark:hover:border-rose-700 transition-colors flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                variant="outline"
              >
                <Plus className="h-5 w-5" />
                Add Another Subject
              </Button>
            </div>
          )}
        </>
      ),
    },
    {
      title: 'Review Submission',
      content: (
        <>
          <div className="w-full pb-5">
            <HeadingSmall title="Step 4: Review Submission" />
            <div className="rounded-xl border-2 border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 p-8 shadow-lg space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="text-lg font-bold text-rose-700 dark:text-rose-400">Personal Information</div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Name:</span>{' '}
                    {`${user.last_name || ''}, ${user.first_name || ''} ${(user.middle_name?.[0] ?? '')}`}
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">School Year:</span> {data.schoolYear || '--'}
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Program:</span> {data.program || '--'}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-lg font-bold text-rose-700 dark:text-rose-400">Contact Information</div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Office Address:</span> {data.officeAddress || '--'}
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Mobile No.:</span> {data.mobileNo || '--'}
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Telephone No.:</span> {data.telephoneNo || '--'}
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold">Email:</span> {user.email || '--'}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-2">Subjects & Schedules</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-rose-300 dark:border-rose-700 rounded-lg bg-white dark:bg-zinc-900">
                    <thead className="bg-rose-100 dark:bg-rose-950">
                      <tr>
                        <th className="px-4 py-2 text-left text-rose-700 dark:text-rose-400 font-semibold">#</th>
                        <th className="px-4 py-2 text-left text-rose-700 dark:text-rose-400 font-semibold">Subject</th>
                        <th className="px-4 py-2 text-left text-rose-700 dark:text-rose-400 font-semibold">Date</th>
                        <th className="px-4 py-2 text-left text-rose-700 dark:text-rose-400 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                     {data.subjects.filter(s => s.subject && s.date).length === 0 ? (
                       <tr>
                         <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400" colSpan={4}>
                           No schedules selected yet.
                         </td>
                       </tr>
                     ) : (
                       data.subjects
                         .filter(s => s.subject && s.date)
                         .map((subj, idx) => (
                           <tr key={`${subj.subject}-${idx}`} className="border-t border-rose-200 dark:border-rose-800">
                             <td className="px-4 py-2 text-rose-700 dark:text-rose-400 font-bold">{idx + 1}</td>
                             <td className="px-4 py-2 dark:text-zinc-300">{subj.subject}</td>
                             <td className="px-4 py-2 dark:text-zinc-300">
                               {subj.date ? format(new Date(subj.date), 'MMMM d, yyyy') : '--'}
                             </td>
                             <td className="px-4 py-2 dark:text-zinc-300">
                               {subj.startTime && subj.endTime
                                 ? `${formatTime12hr(subj.startTime)} - ${formatTime12hr(subj.endTime)}`
                                 : '--'}
                             </td>
                           </tr>
                         ))
                     )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="flex h-[85vh] w-full max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Comprehensive Exam Application</DialogTitle>
          <DialogDescription>Fill out all required information</DialogDescription>
        </DialogHeader>

        {showSuccessPanel ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 px-4">
            <Check size={48} className="text-rose-500" />
            <h2 className="text-2xl font-semibold">Application Submitted!</h2>
            <p className="text-center text-gray-600">Your comprehensive exam application has been saved successfully.</p>
            <Button
              onClick={() => {
                onOpenChange(false);
                // Scroll to the display card after closing the dialog
                setTimeout(() => {
                  document.getElementById('compre-application-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
              className="bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700"
            >
              Done
            </Button>
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

// Helper to format 24h -> 12h time
function formatTime12hr(timeStr?: string) {
  if (!timeStr) return '--';
  const [hour, minute] = timeStr.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${minute} ${ampm}`;
}

function safeRoute(name: string, params?: Record<string, any>): string | null {
  try {
    const Ziggy = (window as any).Ziggy;
    const routeFn = (window as any).route;
    if (!routeFn || !Ziggy?.routes || !Ziggy.routes[name]) return null;
    return routeFn(name, params);
  } catch {
    return null;
  }
}