// components/SuccessPrompt.tsx
import React from "react";

interface SuccessPromptProps {
  message: string;
  onClose: () => void;
}

const SuccessPrompt: React.FC<SuccessPromptProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 text-center">
        <h2 className="text-xl font-bold text-black-600 mb-4">Save Changes</h2>
        <p className="text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="mt-6 bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessPrompt;
