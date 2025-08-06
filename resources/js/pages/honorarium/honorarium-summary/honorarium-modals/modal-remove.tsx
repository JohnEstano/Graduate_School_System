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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface RemoveProgramModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  programToRemove: string | null;
  setProgramToRemove: (program: string) => void;
  uniquePrograms: string[];
}

export default function RemoveProgramModal({
  show,
  onClose,
  onSubmit,
  programToRemove,
  setProgramToRemove,
  uniquePrograms,
}: RemoveProgramModalProps) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Program</DialogTitle>
          <DialogDescription>
            Select a program to permanently delete it from the list. 
            <span className="font-semibold text-destructive"> This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>
        <form id="remove-program-form" onSubmit={onSubmit} className="grid items-start gap-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="program-select">Program</Label>
            {/* The Select component provides a better UX and is fully themeable */}
            <Select
              value={programToRemove ?? ''}
              onValueChange={setProgramToRemove}
              required
            >
              <SelectTrigger id="program-select">
                <SelectValue placeholder="Select a program to remove..." />
              </SelectTrigger>
              <SelectContent>
                {uniquePrograms.map((prog) => (
                  <SelectItem key={prog} value={prog}>
                    {prog}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="remove-program-form"
            variant="destructive"
            disabled={!programToRemove}
          >
            Remove Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}