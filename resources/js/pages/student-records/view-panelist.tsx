import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface Panelist {
  id: number;
  pfirst_name: string;
  pmiddle_name: string | null;
  plast_name: string;
  role: string;
}

interface ViewPanelistProps {
  isOpen: boolean;
  onClose: () => void;
  panelists: Panelist[];
}

const ViewPanelist: React.FC<ViewPanelistProps> = ({ isOpen, onClose, panelists }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-800 w-1/2 h-[60vh] rounded-lg shadow-lg overflow-auto p-6 relative">
        
        {/* Header */}
        <div className="h-10 bg-rose-500 rounded-t-lg mb-4 flex items-center justify-center">
          <h2 className="text-white font-semibold">Panelists</h2>
        </div>

        {/* Table */}
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {panelists.length > 0 ? (
              panelists.map((panelist) => (
                <TableRow key={panelist.id}>
                  <TableCell>
                    {panelist.pfirst_name}{" "}
                    {panelist.pmiddle_name ? panelist.pmiddle_name + " " : ""}
                    {panelist.plast_name}
                  </TableCell>
                  <TableCell>{panelist.role}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-gray-500">
                  No panelists found123
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Close Button */}
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
