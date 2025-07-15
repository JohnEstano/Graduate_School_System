import { useState } from 'react';
import { Stepper } from '@/components/ui/Stepper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import HeadingSmall from '@/components/heading-small';
import { Plus, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function DefenseRequestForm() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setStep(0);
  };

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const steps = [
    {
      title: 'Personal',
      content: (
        <form className="space-y-4 pb-5 text-sm">
          <HeadingSmall title="Step 1: Personal Information" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 pt-3">
            <div><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" placeholder="John" /></div>
            <div><Label htmlFor="middleName">Middle Name</Label><Input id="middleName" name="middleName" placeholder="Juntilo" /></div>
            <div><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" placeholder="Doe" /></div>
          </div>
          <div><Label htmlFor="schoolId">School ID</Label><Input id="schoolId" name="schoolId" placeholder="202512345" /></div>
          <div><Label htmlFor="program">Program</Label><Input id="program" name="program" placeholder="Master in Information Technology" /></div>
        </form>
      ),
    },
    {
      title: 'Thesis Information',
      content: (
        <form className="space-y-4 pb-5 text-sm">
          <HeadingSmall title="Step 2: Thesis Information" />
          <div className="flex flex-col gap-3 pt-3">
            <div><Label htmlFor="thesis_title">Thesis / Dissertation Title</Label><Input id="thesis_title" name="thesis_title" placeholder="Title." /></div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-5">
              <div><Label htmlFor="datetime">Date & Time</Label><Input id="datetime" name="datetime" placeholder="14/07/2025" /></div>
              <div><Label htmlFor="mode_defense">Mode of Defense</Label><Input id="mode_defense" name="mode_defense" placeholder="Face to Face" /></div>
              <div><Label htmlFor="defense_type">Type of Defense</Label><Input id="defense_type" name="defense_type" placeholder="Proposal" /></div>
            </div>
          </div>
        </form>
      ),
    },
    {
      title: 'Attachments',
      content: (
        <form className="space-y-4 pb-5 text-sm">
          <HeadingSmall title="Step 3: Required Attachments" />
          <div className="flex flex-col gap-3 pt-3">
            <div><Label htmlFor="attachment_notes">Sample Attachment</Label><Input id="attachment_notes" name="attachment_notes" placeholder="Link or File" /></div>
          </div>
        </form>
      ),
    },
    {
      title: 'Defense Committee',
      content: (
        <form className="space-y-4 pb-5 text-sm">
          <HeadingSmall title="Step 4: Defense Committee" />
          <div className="flex flex-col gap-3 pt-3">
            <div><Label htmlFor="defense_adviser">Adviser</Label><Input id="defense_adviser" name="defense_adviser" placeholder="Sheena Cloribel" /></div>
            <div><Label htmlFor="defense_chairperson">Chairperson</Label><Input id="defense_chairperson" name="defense_chairperson" placeholder="Table T. Chair" /></div>
            <div><Label htmlFor="defense_panelist_1">Panelist I</Label><Input id="defense_panelist_1" name="defense_panelist_1" placeholder="Panel I" /></div>
            <div><Label htmlFor="defense_panelist_2">Panelist II</Label><Input id="defense_panelist_2" name="defense_panelist_2" placeholder="Panel II" /></div>
          </div>
        </form>
      ),
    },
    {
      title: 'Review',
      content: (
        <div className="space-y-4 pb-5 text-sm">
          <HeadingSmall title="Step 5: Review Submission" />
          <p>Double check all the fields before submitting your defense request.</p>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-rose-500 rounded-lg">
          <Plus className="mr-2" /> Submit a Defense Request
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full !max-w-xl h-[95vh] max-h-[95vh] flex flex-col">
        <DialogHeader className="text-left">
          <DialogTitle>Submit Defense Request</DialogTitle>
          <DialogDescription>Fill up all necessary information</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <Stepper
            steps={steps}
            currentStep={step}
            onNext={next}
            onPrev={prev}
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
