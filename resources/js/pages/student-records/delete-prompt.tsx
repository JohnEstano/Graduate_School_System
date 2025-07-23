import React from 'react';

interface DeletePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeletePrompt: React.FC<DeletePromptProps> = ({ isOpen, onClose, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white w-[400px] p-6 rounded-xl shadow-lg text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Delete Data</h2>
        <p className="text-gray-600 mb-6">The current data will be permanently deleted</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePrompt;
