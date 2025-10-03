import React, { useState, useEffect } from "react";
import SuccessPrompt from "./success-prompt";
import { useForm } from "@inertiajs/react";

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
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-40">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
            Edit Student Record
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <input
              type="text"
              name="first_name"
              value={data.first_name}
              onChange={(e) => setData("first_name", e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="First Name"
            />
            {errors.first_name && (
              <div className="text-red-500 text-xs">{errors.first_name}</div>
            )}

            {/* Middle Name */}
            <input
              type="text"
              name="middle_name"
              value={data.middle_name}
              onChange={(e) => setData("middle_name", e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Middle Name"
            />
            {errors.middle_name && (
              <div className="text-red-500 text-xs">{errors.middle_name}</div>
            )}

            {/* Last Name */}
            <input
              type="text"
              name="last_name"
              value={data.last_name}
              onChange={(e) => setData("last_name", e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Last Name"
            />
            {errors.last_name && (
              <div className="text-red-500 text-xs">{errors.last_name}</div>
            )}

            {/* Program */}
            <input
              type="text"
              name="program"
              value={data.program}
              onChange={(e) => setData("program", e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Program"
            />
            {errors.program && (
              <div className="text-red-500 text-xs">{errors.program}</div>
            )}

            {/* O.R. Number */}
            <input
              type="text"
              name="or_number"
              value={data.or_number}
              onChange={(e) => setData("or_number", e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="O.R. Number"
            />
            {errors.or_number && (
              <div className="text-red-500 text-xs">{errors.or_number}</div>
            )}

            {/* Payment Date */}
            <input
              type="date"
              name="payment_date"
              value={data.payment_date}
              onChange={(e) => setData("payment_date", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            {errors.payment_date && (
              <div className="text-red-500 text-xs">{errors.payment_date}</div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 disabled:bg-pink-300"
              >
                {processing ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
