import React, { useState, useEffect } from "react";
import SuccessPrompt from "./success-prompt";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Payment {
  id: number;
  school_year: string;
  payment_date: string;
  defense_status: string;
  amount: string;
}

export interface StudentRecord {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  school_year: string | null;
  student_id: string | null;
  course_section: string | null;
  birthdate: string | null;
  academic_status: string | null;
  program: string;
  or_number: string;
  payment_date: string;
  payments?: Payment[];
}

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: StudentRecord;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { data, setData, put, processing, errors, wasSuccessful, reset } = useForm({
    first_name: record.first_name,
    middle_name: record.middle_name ?? "",
    last_name: record.last_name,
    program: record.program,
    or_number: record.or_number,
    payment_date: record.payment_date,
  });

  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    reset();
    setData({
      first_name: record.first_name,
      middle_name: record.middle_name ?? "",
      last_name: record.last_name,
      program: record.program,
      or_number: record.or_number,
      payment_date: record.payment_date,
    });
  }, [record, reset, setData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route("student-records.update", record.id), {
      onSuccess: () => setShowPrompt(true),
    });
  };

  const closePrompt = () => {
    setShowPrompt(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl min-w-100 w-full overflow-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Student Record</DialogTitle>
            <DialogDescription>
              Make changes to the student's record here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} id="edit-student-form" className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={data.first_name}
                onChange={(e) => setData("first_name", e.target.value)}
              />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                value={data.middle_name}
                onChange={(e) => setData("middle_name", e.target.value)}
              />
              {errors.middle_name && <p className="text-xs text-red-500">{errors.middle_name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={data.last_name}
                onChange={(e) => setData("last_name", e.target.value)}
              />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="program">Program</Label>
              <Input
                id="program"
                value={data.program}
                onChange={(e) => setData("program", e.target.value)}
              />
              {errors.program && <p className="text-xs text-red-500">{errors.program}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="or_number">O.R. Number</Label>
              <Input
                id="or_number"
                value={data.or_number}
                onChange={(e) => setData("or_number", e.target.value)}
              />
              {errors.or_number && <p className="text-xs text-red-500">{errors.or_number}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={data.payment_date}
                onChange={(e) => setData("payment_date", e.target.value)}
              />
              {errors.payment_date && <p className="text-xs text-red-500">{errors.payment_date}</p>}
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="edit-student-form" disabled={processing}>
              {processing ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Prompt */}
      {showPrompt && wasSuccessful && (
        <SuccessPrompt
          message="Student record successfully updated."
          onClose={closePrompt}
        />
      )}
    </>
  );
};

export default EditStudentModal;
