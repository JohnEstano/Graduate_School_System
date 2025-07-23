// EditStudentRecord.tsx
import React, { useState } from "react";
import SuccessPrompt from "./success-prompt"; // Import the prompt component

interface StudentRecord {
  full_name: string;
  program: string;
  or_number: string;
  payment_date: string;
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
  const [formData, setFormData] = useState<StudentRecord>(record);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic goes here
    setShowPrompt(true); // Show confirmation
  };

  const closePrompt = () => {
    setShowPrompt(false);
    onClose(); // Close modal after prompt is dismissed
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
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Full Name"
            />
            <input
              type="text"
              name="program"
              value={formData.program}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Program"
            />
            <input
              type="text"
              name="or_number"
              value={formData.or_number}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="O.R. Number"
            />
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
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
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {showPrompt && (
        <SuccessPrompt
          message="Student record successfully updated."
          onClose={closePrompt}
        />
      )}
    </>
  );
};

export default EditStudentModal;
