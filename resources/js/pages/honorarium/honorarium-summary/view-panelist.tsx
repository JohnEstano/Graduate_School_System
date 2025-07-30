// ViewPanelist.tsx
import React from 'react';

interface PanelRow {
  chair: string;
  member: string;
}

interface PanelTableProps {
  onClose: () => void;
}

const panelData: PanelRow[] = [
  { chair: 'Chair Person 1', member: 'Panelist 1' },
  { chair: 'Chair Person 2', member: 'Panelist 2' },
  { chair: 'Chair Person 3', member: 'Panelist 3' },
];

const ViewPanelist: React.FC<PanelTableProps> = ({ onClose }) => {
  return (
    <div className="relative bg-white p-4 rounded shadow-lg">
      {/* Close Button */}
      <button
        className="absolute top-3 right-3 text-xl text-black hover:text-gray-700"
        onClick={onClose}
      >
        ✕
      </button>

      {/* Header Bar */}
      <div className="h-10 bg-rose-500 rounded-t-lg mb-4" />

      {/* Table */}
      <table className="w-full border border-gray-200 text-sm text-gray-700">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Chair Name</th>
            <th className="border px-4 py-2 text-left">Member Name</th>
          </tr>
        </thead>
        <tbody>
          {panelData.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{row.chair}</td>
              <td className="border px-4 py-2">{row.member}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewPanelist;
