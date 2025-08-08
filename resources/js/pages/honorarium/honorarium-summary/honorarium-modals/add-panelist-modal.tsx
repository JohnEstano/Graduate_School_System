"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AddPanelistModalProps {
  show: boolean;
  onClose: () => void;
  onAddPanelist: (newPanelist: NewPanelistData) => void;
}

interface NewPanelistData {
  panelistName: string;
  role: string;
  defenseType: string;
  receivedDate: string;
  amount: number;
}

const initialNewPanelistState = {
  panelistName: '',
  role: 'Member',
  defenseType: 'Proposal',
  receivedDate: '',
  amount: 450.00,
};

export default function AddPanelistModal({ show, onClose, onAddPanelist }: AddPanelistModalProps) {
  const [newPage, setNewPage] = useState(initialNewPanelistState);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hasChanged, setHasChanged] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // Reset state when the modal is closed
    if (!show) {
      setNewPage(initialNewPanelistState);
      setDate(undefined);
      setHasChanged(false);
    }
  }, [show]);

  const handleInputChange = (field: keyof NewPanelistData, value: string | number) => {
    setNewPage(prev => ({ ...prev, [field]: value }));
    setHasChanged(true);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    setHasChanged(true);
  };

  const handleCloseModal = () => {
    if (hasChanged) {
      setShowConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    onClose();
    setShowConfirmation(false);
  };

  const handleAddPanelist = () => {
    if (!newPage.panelistName || !date || newPage.amount <= 0) return;

    const newPanelist = {
      ...newPage,
      receivedDate: date ? format(date, "PPP") : '',
    };
    onAddPanelist(newPanelist);
    setNewPage(initialNewPanelistState);
    setDate(undefined);
    setHasChanged(false);
  };

  const isAddButtonDisabled = !newPage.panelistName || !date || newPage.amount <= 0;

  return (
    <>
      <Dialog open={show} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl min-w-150 w-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Panelist</DialogTitle>
            <DialogDescription>
              Enter the details for the new panelist. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="panelistName" className="text-right">
                  Name
                </Label>
                <Input
                  id="panelistName"
                  value={newPage.panelistName}
                  onChange={(e) => handleInputChange('panelistName', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select onValueChange={(value) => handleInputChange('role', value)} defaultValue={newPage.role}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chair">Chair</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="defenseType" className="text-right">
                  Defense Type
                </Label>
                <Select onValueChange={(value) => handleInputChange('defenseType', value)} defaultValue={newPage.defenseType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a defense type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proposal">Proposal</SelectItem>
                    <SelectItem value="Pre-final">Pre-final</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="receivedDate" className="text-right">
                  Received Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={2100}
                    />
                    <div className="p-2">
                      <Button variant="ghost" onClick={() => handleDateChange(undefined)} className="w-full">
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPage.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                  className="col-span-3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseModal} variant="ghost" className="rounded-md px-3 py-2 h-auto text-xs">
              Cancel
            </Button>
            <Button onClick={handleAddPanelist} disabled={isAddButtonDisabled} className="rounded-md px-3 py-2 h-auto text-xs">
              Save Panelist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showConfirmation && (
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="max-w-md">
            <Alert className="border-0 p-0">
              <AlertTitle>Discard changes?</AlertTitle>
              <AlertDescription>
                Are you sure you want to discard your changes? Your unsaved changes will be lost.
              </AlertDescription>
            </Alert>
            <DialogFooter className="mt-4">
              <Button onClick={() => setShowConfirmation(false)} variant="ghost" className="rounded-md px-3 py-2 h-auto text-xs">
                Keep Editing
              </Button>
              <Button onClick={handleDiscard} className="rounded-md px-3 py-2 h-auto text-xs">
                Discard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}