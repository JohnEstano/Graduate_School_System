import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface PanelRow {
  chair: string;
  member: string;
}

interface ViewPanelistProps {
  isOpen: boolean;
  onClose: () => void;
}

const panelData: PanelRow[] = [
  { chair: 'Chair Person 1', member: 'Panelist 1' },
  { chair: 'Chair Person 2', member: 'Panelist 2' },
  { chair: 'Chair Person 3', member: 'Panelist 3' },
];

const ViewPanelist: React.FC<ViewPanelistProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-800 w-1/2 h-[60vh] rounded-lg shadow-lg overflow-auto p-6 relative">
        
        {/* Header */}
        <div className="h-10 bg-rose-500 rounded-t-lg mb-4 flex items-center justify-center">
          <h2 className="text-white font-semibold">Panelists</h2>
        </div>

        {/* Table using same interface as IndividualRecord */}
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Chair Name</TableHead>
              <TableHead>Member Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {panelData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.chair}</TableCell>
                <TableCell>{row.member}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Close Button styled like IndividualRecord Cancel */}
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewPanelist;
