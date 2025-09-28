"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddPanelistModalProps {
  show: boolean;
  onClose: () => void;
  onAddPanelist: (newPanelist: any) => void;
  programId: number;
}

interface NewPanelistData {
  pfirst_name: string;
  pmiddle_name: string;
  plast_name: string;
  role: string;
  defense_type: string;
  received_date: string;
}

const initialNewPanelistState: NewPanelistData = {
  pfirst_name: '',
  pmiddle_name: '',
  plast_name: '',
  role: 'Member',
  defense_type: 'Proposal',
  received_date: '',
};

export default function AddPanelistModal({ show, onClose, onAddPanelist, programId }: AddPanelistModalProps) {
  const [newPanelist, setNewPanelist] = useState<NewPanelistData>(initialNewPanelistState);
  const [errors, setErrors] = useState<Partial<Record<keyof NewPanelistData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) {
      setNewPanelist(initialNewPanelistState);
      setErrors({});
      setIsLoading(false);
      setServerError(null);
    }
  }, [show]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof NewPanelistData, string>> = {};
    if (!newPanelist.pfirst_name.trim()) newErrors.pfirst_name = 'First name is required';
    if (!newPanelist.plast_name.trim()) newErrors.plast_name = 'Last name is required';
    if (!newPanelist.received_date) {
      newErrors.received_date = 'Received date is required';
    } else {
      const selectedDate = new Date(newPanelist.received_date);
      const today = new Date();
      selectedDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      if (selectedDate > today) newErrors.received_date = 'Received date cannot be in the future';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof NewPanelistData, value: string) => {
    setNewPanelist((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) setServerError(null);
  };

  const postToUrl = async (url: string, body: any, signal: AbortSignal) => {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify(body),
      signal,
    });
  };

  const handleAddPanelist = async () => {
    setServerError(null);
    if (!validateForm()) return;
    if (!programId) {
      setServerError('Program ID is missing. Cannot add panelist.');
      return;
    }

    setIsLoading(true);

    const url = `/programs/${programId}/panelists`;

    console.log('Posting panelist to:', url, 'programId:', programId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await postToUrl(url, newPanelist, controller.signal);

      if (controller.signal.aborted) throw new Error('Request aborted (timeout).');

      if (response.ok) {
        const data = await response.json();
        onAddPanelist(data.panelist);
        setNewPanelist(initialNewPanelistState);
        onClose();
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      let payload: any = null;
      try {
        payload = contentType.includes('application/json') ? await response.json() : { text: await response.text() };
      } catch {
        payload = { text: 'Unable to parse response body' };
      }

      if (response.status === 422 && payload.errors) {
        const newErrors: Partial<Record<keyof NewPanelistData, string>> = {};
        for (const key of Object.keys(payload.errors)) {
          const messages = payload.errors[key];
          newErrors[key as keyof NewPanelistData] = Array.isArray(messages) ? messages.join(' ') : String(messages);
        }
        setErrors(newErrors);
        setServerError('Please fix the validation errors.');
      } else if (response.status === 419) {
        setServerError('CSRF token mismatch or session expired.');
      } else if (response.status === 404) {
        setServerError('Endpoint not found (404). Check backend route.');
      } else {
        setServerError(payload?.message || payload?.text || `Server returned status ${response.status}`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setServerError('Request timed out. The server did not respond within 15 seconds.');
      } else {
        setServerError(err.message || 'An unknown error occurred.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAddButtonDisabled && !isLoading) {
      e.preventDefault();
      handleAddPanelist();
    }
  };

  const isAddButtonDisabled =
    !newPanelist.pfirst_name ||
    !newPanelist.plast_name ||
    !newPanelist.received_date ||
    isLoading;

  return (
    <Dialog open={show} onOpenChange={isLoading ? undefined : onClose}>
      <DialogContent className="max-w-3xl min-w-100 w-full overflow-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Panelist</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new panelist to the system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please fix the errors below before submitting.</AlertDescription>
            </Alert>
          )}

          {/* First Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pfirst_name" className="text-right">First Name <span className="text-destructive">*</span></Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                id="pfirst_name"
                value={newPanelist.pfirst_name}
                onChange={(e) => handleInputChange("pfirst_name", e.target.value)}
                className={errors.pfirst_name ? "border-destructive" : ""}
                placeholder="Enter first name"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              {errors.pfirst_name && (
                <p className="text-destructive text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.pfirst_name}
                </p>
              )}
            </div>
          </div>

          {/* Middle Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pmiddle_name" className="text-right">Middle Name</Label>
            <div className="col-span-3 flex flex-col gap-1">
            <Input
              id="pmiddle_name"
              value={newPanelist.pmiddle_name}
              onChange={(e) => handleInputChange("pmiddle_name", e.target.value)}
              className={errors.pmiddle_name || errors.pmiddle_name ? "border-destructive" : ""}
              placeholder="Enter middle name (optional)"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            </div>
          </div>

          {/* Last Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plast_name" className="text-right">Last Name <span className="text-destructive">*</span></Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                id="plast_name"
                value={newPanelist.plast_name}
                onChange={(e) => handleInputChange("plast_name", e.target.value)}
                className={errors.plast_name ? "border-destructive" : ""}
                placeholder="Enter last name"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              {errors.plast_name && (
                <p className="text-destructive text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.plast_name}
                </p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Role</Label>
            <Select
              value={newPanelist.role}
              onValueChange={(value) => handleInputChange("role", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chair">Chair</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Defense Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Defense Type</Label>
            <Select
              value={newPanelist.defense_type}
              onValueChange={(value) => handleInputChange("defense_type", value)}
              disabled={isLoading}
            >
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

          {/* Received Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="received_date" className="text-right">Received Date <span className="text-destructive">*</span></Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                id="received_date"
                type="date"
                value={newPanelist.received_date}
                onChange={(e) => handleInputChange("received_date", e.target.value)}
                className={errors.received_date ? "border-destructive" : ""}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              {errors.received_date && (
                <p className="text-destructive text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.received_date}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddPanelist}
            disabled={isAddButtonDisabled}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Save Panelist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
