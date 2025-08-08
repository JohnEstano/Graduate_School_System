"use client";
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar";
import {
  Button
} from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import {
  AnimatePresence,
  motion
} from "framer-motion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Import the new AddPanelistModal component
import AddPanelistModal from '../honorarium-modals/add-panelist-modal';

interface IndividualRecordModalProps {
  show: boolean;
  onClose: () => void;
  record: {
    name: string;
    program: string;
    recentlyUpdated: string;
    timeLastOpened: string;
    dateEdited: string;
  } | null;
}

// This data should ideally come from an API.
const programDetails = {
  'MIT': [{
    id: 1,
    panelistName: 'Dr. Evelyn Cruz',
    role: 'Chair',
    defenseType: 'Final',
    receivedDate: 'May 12, 2025',
    amount: 450.00
  }, {
    id: 2,
    panelistName: 'Prof. Marco Reyes',
    role: 'Member',
    defenseType: 'Proposal',
    receivedDate: 'June 4, 2025',
    amount: 450.00
  }, {
    id: 3,
    panelistName: 'Dr. Lilia Santos',
    role: 'Chair',
    defenseType: 'Pre-final',
    receivedDate: 'June 4, 2025',
    amount: 450.00
  }, {
    id: 4,
    panelistName: 'Dr. Alan Turing',
    role: 'Member',
    defenseType: 'Final',
    receivedDate: 'July 1, 2025',
    amount: 450.00
  }, {
    id: 5,
    panelistName: 'Ms. Ada Lovelace',
    role: 'Member',
    defenseType: 'Final',
    receivedDate: 'July 1, 2025',
    amount: 450.00
  }, {
    id: 6,
    panelistName: 'Dr. Grace Hopper',
    role: 'Chair',
    defenseType: 'Final',
    receivedDate: 'July 2, 2025',
    amount: 450.00
  }, {
    id: 7,
    panelistName: 'Prof. John Dewey',
    role: 'Chair',
    defenseType: 'Proposal',
    receivedDate: 'July 15, 2025',
    amount: 450.00
  }, ],
  'MBA': [{
    id: 8,
    panelistName: 'Dr. Lilia Santos',
    role: 'Chair',
    defenseType: 'Pre-final',
    receivedDate: 'June 4, 2025',
    amount: 450.00
  }, ],
  'MCS': [{
    id: 9,
    panelistName: 'Dr. Alan Turing',
    role: 'Member',
    defenseType: 'Final',
    receivedDate: 'July 1, 2025',
    amount: 450.00
  }, {
    id: 10,
    panelistName: 'Ms. Ada Lovelace',
    role: 'Member',
    defenseType: 'Final',
    receivedDate: 'July 1, 2025',
    amount: 450.00
  }, {
    id: 11,
    panelistName: 'Dr. Grace Hopper',
    role: 'Chair',
    defenseType: 'Final',
    receivedDate: 'July 2, 2025',
    amount: 450.00
  }, ],
  'MAED': [{
    id: 12,
    panelistName: 'Prof. John Dewey',
    role: 'Chair',
    defenseType: 'Proposal',
    receivedDate: 'July 15, 2025',
    amount: 450.00
  }, ],
};

const PAGE_SIZE = 5;

export default function IndividualRecordModal({
  show,
  onClose,
  record
}: IndividualRecordModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [panelists, setPanelists] = useState < any[] > (
    record ? programDetails[record.program as keyof typeof programDetails] || [] : []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  if (!record) return null;

  const totalPages = Math.ceil(panelists.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedPanelists = panelists.slice(startIndex, endIndex);

  const handleRemovePanelist = (id: number) => {
    const updatedPanelists = panelists.filter(panelist => panelist.id !== id);
    setPanelists(updatedPanelists);
    if (paginatedPanelists.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAddPanelist = (newPanelistData: { panelistName: string; role: string; defenseType: string; receivedDate: string; amount: number; }) => {
    const newPanelist = {
      ...newPanelistData,
      id: panelists.length > 0 ? Math.max(...panelists.map(p => p.id)) + 1 : 1,
      amount: parseFloat(newPanelistData.amount.toString()),
    };
    setPanelists([...panelists, newPanelist]);
    setShowAddModal(false);
    setCurrentPage(Math.ceil((panelists.length + 1) / PAGE_SIZE));
  };


  return (
    <>
      <Dialog open={show} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl min-w-260 w-full max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">{record.name}</DialogTitle>
            <DialogDescription>
              Honorarium summary for the {record.program} program. Last updated: {record.dateEdited}.
            </DialogDescription>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1">
                <Pencil className="h-4 w-4 mr-2" />
                {isEditing ? "Done" : "Edit Panelists"}
              </Button>
              {isEditing && (
                <Button onClick={() => setShowAddModal(true)} variant="outline" className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1 text-green-500 hover:text-green-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Panelist
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-[#121212] p-2">
            <Table className="min-w-full text-sm">
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="w-[250px] px-1 py-2">Panelist</TableHead>
                  <TableHead className="px-1 py-2">Defense Type</TableHead>
                  <TableHead className="px-1 py-2">Received Date</TableHead>
                  <TableHead className="text-right px-1 py-2">Amount Received</TableHead>
                  {isEditing && <TableHead className="text-right px-1 py-2">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {paginatedPanelists.length > 0 ? (
                    paginatedPanelists.map((item) => (
                      <motion.tr
                        key={item.id}
                        className="hover:bg-muted/50"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <TableCell className="px-1 py-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                              <AvatarFallback>{item.panelistName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{item.panelistName}</p>
                              <p className="text-sm text-muted-foreground">{item.role}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-1 py-2">{item.defenseType}</TableCell>
                        <TableCell className="px-1 py-2">{item.receivedDate}</TableCell>
                        <TableCell className="text-right px-1 py-2">₱{item.amount.toFixed(2)}</TableCell>
                        {isEditing && (
                          <TableCell className="text-right px-1 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleRemovePanelist(item.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        )}
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isEditing ? 5 : 4} className="h-24 text-center">
                        No honorarium records found for this program.
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
          {panelists.length > PAGE_SIZE && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink isActive={currentPage === index + 1} onClick={() => setCurrentPage(index + 1)}>
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </DialogContent>
      </Dialog>
      {/* Add Panelist Modal */}
      <AddPanelistModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPanelist={handleAddPanelist}
      />
    </>
  );
}