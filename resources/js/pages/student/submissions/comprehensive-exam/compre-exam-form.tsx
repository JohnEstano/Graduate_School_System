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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish?: () => void;
};

type Subject = { subject: string; date: string; startTime: string; endTime: string };

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
    }
  }

  function addSubjectRow() {
    setData('subjects', [...data.subjects, { subject: '', date: '', startTime: '', endTime: '' }]);
  }

  function removeSubjectRow(index: number) {
    setData('subjects', data.subjects.filter((_, i) => i !== index));
  }

  function updateSubject(index: number, field: keyof Subject, value: string) {
    const next = data.subjects.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    setData('subjects', next);
  }

   function handleSubmit() {
    post(route('comprehensive-exam.store'), {
      preserveScroll: true,
      preserveState: true, // keep modal state so we can show success panel
      onSuccess: () => {
        setShowSuccessPanel(true); // show the success UI like Defense
        onFinish?.();
      },
    });
  }

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  function handlePrev() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

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
                className="h-10 text-s text-black disabled:opacity-100 disabled:bg-white disabled:text-black"
                value={user.first_name || ''} // changed
                readOnly
                disabled
              />
            </div>
            <div>
              <Label className="text-s">Middle Initial</Label>
              <Input
                className="h-10 text-s text-black disabled:opacity-100 disabled:bg-white disabled:text-black"
                maxLength={3}
                value={(user.middle_name?.[0] ?? '')} // changed
                readOnly
                disabled
              />
            </div>
            <div>
              <Label className="text-s">Last Name</Label>
              <Input
                className="h-10 text-s text-black disabled:opacity-100 disabled:bg-white disabled:text-black"
                value={user.last_name || ''} // changed
                readOnly
                disabled
              />
            </div>
            <div>
              <Label className="text-s">School Year</Label>
              <select
                className="h-10 text-s w-full border rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
                value={data.schoolYear}
                onChange={(e) => setData('schoolYear', e.target.value)}
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
            </div>
            <div>
              <Label className="text-s">Program</Label>
              <Input   className="h-10 text-s w-105 text-black disabled:opacity-100 disabled:bg-white disabled:text-black"
 value={data.program} readOnly disabled />
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
                <Label className="text-s">Office Address</Label>
                <Input
                className="h-10 text-s"
                value={data.officeAddress}
                onChange={(e) => setData('officeAddress', e.target.value)}
                />
            </div>
            <div>
                <Label className="text-s">Mobile No.</Label>
                <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="h-10 text-s"
                value={data.mobileNo}
                placeholder="e.g. 09171234567"
                onChange={(e) => setData('mobileNo', e.target.value.replace(/\D/g, ''))}
                />
            </div>
            <div>
                <Label className="text-s">Telephone No.</Label>
                <Input
                type="tel"
                className="h-10 text-s"
                value={data.telephoneNo}
                placeholder="e.g. (02) 123-4567"
                onChange={(e) => {
                    // Allow digits, spaces, dashes, parentheses
                    const cleaned = e.target.value.replace(/[^0-9\s()-]/g, '');
                    setData('telephoneNo', cleaned);
                }}
                />
            </div>
            <div className="md:col-span-2">
                <Label className="text-s">Email</Label>
                <Input
                className="h-10 text-s text-black disabled:opacity-100 disabled:bg-white disabled:text-black"
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
              Add the subjects and schedules for your comprehensive examination. Each subject must have a specific date and time slot.
            </p>
            </div>

            <div className="space-y-6">
            {data.subjects.map((subj, idx) => (
                <div
                key={idx}
                className="group relative border border-gray-200 rounded-lg p-6 bg-white shadow-sm transition-all hover:border-rose-200 hover:shadow-md"
                >
                {/* Subject Number Badge */}
                <div className="absolute -top-3 -left-2 bg-rose-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  Subject {idx + 1}
                </div>

                {/* Remove Button (X) */}
                {data.subjects.length > 1 && (
                  <button
                    onClick={() => removeSubjectRow(idx)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-500 transition-all"
                    title="Remove Subject"
                    type="button"
                  >
                    <span className="sr-only">Remove Subject</span>
                    <span className="text-lg leading-none">&times;</span>
                  </button>
                )}

                <div className="space-y-6">
                  {/* First Row: Subject and Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subject Input */}
                    <div className="w-full">
                      <Label className="text-sm font-medium text-gray-700">
                        Subject Name
                        <span className="text-rose-500 ml-1">*</span>
                      </Label>
                      <Input
                        value={subj.subject}
                        onChange={(e) => updateSubject(idx, 'subject', e.target.value)}
                        placeholder="e.g. Advanced Mathematics"
                        className="mt-1 w-full transition-colors focus:border-rose-300"
                      />
                    </div>

                    {/* Date Picker */}
                    <div className="w-full">
                      <Label className="text-sm font-medium text-gray-700">
                        Exam Date
                        <span className="text-rose-500 ml-1">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            type="button"
                            className={`mt-1 w-full justify-start text-left transition-colors ${
                              subj.date ? 'text-gray-900' : 'text-gray-500'
                            } hover:bg-rose-50 hover:border-rose-300`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {subj.date ? format(new Date(subj.date), 'MMMM d, yyyy') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[9999] pointer-events-auto" align="start" side="bottom">
                          <Calendar
                            mode="single"
                            selected={subj.date ? new Date(subj.date) : undefined}
                            onSelect={(date) => updateSubject(idx, 'date', date ? format(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Second Row: Time Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Start Time
                        <span className="text-rose-500 ml-1">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={subj.startTime || ''}
                        onChange={(e) => updateSubject(idx, 'startTime', e.target.value)}
                        className="mt-1 w-full transition-colors focus:border-rose-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        End Time
                        <span className="text-rose-500 ml-1">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={subj.endTime || ''}
                        onChange={(e) => updateSubject(idx, 'endTime', e.target.value)}
                        className="mt-1 w-full transition-colors focus:border-rose-300"
                      />
                    </div>
                  </div>
                </div>
                </div>
            ))}

            {/* Add Subject Button */}
            <Button
              type="button"
              onClick={addSubjectRow}
              className="w-full mt-4 py-6 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-rose-600"
              variant="outline"
            >
              <Plus className="h-5 w-5" />
              Add Another Subject
            </Button>
            </div>
        </>
      ),
    },
    {
      title: 'Review Submission',
      content: (
        <>
          <div className="w-full pb-5">
            <HeadingSmall title="Step 4: Review Submission" />
            <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-8 shadow-lg space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="text-lg font-bold text-rose-700">Personal Information</div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Name:</span>{' '}
                    {`${user.last_name || ''}, ${user.first_name || ''} ${(user.middle_name?.[0] ?? '')}`} {/* changed */}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">School Year:</span> {data.schoolYear || '--'}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Program:</span> {data.program || '--'}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-lg font-bold text-rose-700">Contact Information</div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Office Address:</span> {data.officeAddress || '--'}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Mobile No.:</span> {data.mobileNo || '--'}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Telephone No.:</span> {data.telephoneNo || '--'}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold">Email:</span> {user.email || '--'}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-lg font-bold text-rose-700 mb-2">Subjects & Schedules</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-rose-300 rounded-lg bg-white">
                    <thead className="bg-rose-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-rose-700 font-semibold">#</th>
                        <th className="px-4 py-2 text-left text-rose-700 font-semibold">Subject</th>
                        <th className="px-4 py-2 text-left text-rose-700 font-semibold">Date</th>
                        <th className="px-4 py-2 text-left text-rose-700 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.subjects.map((subj, idx) => (
                        <tr key={idx} className="border-t border-rose-200">
                          <td className="px-4 py-2 text-rose-700 font-bold">{idx + 1}</td>
                          <td className="px-4 py-2">{subj.subject || '--'}</td>
                          <td className="px-4 py-2">
                            {subj.date ? format(new Date(subj.date), 'MMMM d, yyyy') : '--'}
                          </td>
                          <td className="px-4 py-2">
                            {subj.startTime && subj.endTime
                              ? `${formatTime12hr(subj.startTime)} - ${formatTime12hr(subj.endTime)}`
                              : '--'}
                          </td>
                        </tr>
                      ))}
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
              className="bg-rose-500"
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