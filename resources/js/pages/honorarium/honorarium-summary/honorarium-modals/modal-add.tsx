import { type FormEvent } from 'react';

// Shadcn/ui component imports
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddProgramModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  newProgramName: string;
  setNewProgramName: (name: string) => void;
  newProgramAcronym: string;
  setNewProgramAcronym: (acronym: string) => void;
}

export default function AddProgramModal({
  show,
  onClose,
  onSubmit,
  newProgramName,
  setNewProgramName,
  newProgramAcronym,
  setNewProgramAcronym,
}: AddProgramModalProps) {
  return (
    // The Dialog component handles the open/closed state and the overlay.
    // `onOpenChange` is the idiomatic way to handle close events.
    <Dialog open={show} onOpenChange={onClose}>
      {/* Changed sm:max-w-[425px] to sm:max-w-lg to make the modal wider */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Program</DialogTitle>
          <DialogDescription>
            Enter the details for the new academic program. Click Add Program when you're done.
          </DialogDescription>
        </DialogHeader>
        {/* We use a form with an ID to link it to the submit button in the footer. */}
        <form id="add-program-form" onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="programName" className="text-right">
              Name
            </Label>
            <Input
              id="programName"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Bachelor of Science in Information Technology"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="programAcronym" className="text-right">
              Acronym
            </Label>
            <Input
              id="programAcronym"
              value={newProgramAcronym}
              onChange={(e) => setNewProgramAcronym(e.target.value)}
              className="col-span-3"
              placeholder="e.g., BSIT"
              required
            />
          </div>
        </form>
        <DialogFooter>
          {/* Using the "outline" variant for the cancel button provides visual distinction. */}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {/* The submit button is linked to the form via the `form` attribute. */}
          <Button type="submit" form="add-program-form">
            Add Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}