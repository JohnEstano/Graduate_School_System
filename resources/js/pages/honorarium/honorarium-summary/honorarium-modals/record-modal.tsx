"use client";
import { useState, useEffect } from 'react';
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
  Download
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

import AddPanelistModal from './add-panelist-modal';
import { ProgramRecord } from '@/pages/honorarium/honorarium-summary/Index';

interface IndividualRecordModalProps {
  show: boolean;
  onClose: () => void;
  record: ProgramRecord | null;
}

const programDetails: { [key: string]: any[] } = {
  MIT: [
    {
      id: 1,
      panelistName: 'Dr. Evelyn Cruz',
      role: 'Chair',
      defenseType: 'Final',
      receivedDate: 'May 12, 2025',
      amount: 450.0,
    },
    {
      id: 2,
      panelistName: 'Prof. Marco Reyes',
      role: 'Member',
      defenseType: 'Proposal',
      receivedDate: 'June 4, 2025',
      amount: 450.0,
    },
  ],
  DBM: [
    {
      id: 8,
      panelistName: 'Dr. Peter Drucker',
      role: 'Chair',
      defenseType: 'Final',
      receivedDate: 'June 20, 2025',
      amount: 550.0,
    },
  ],
};

const PAGE_SIZE = 5;

export default function IndividualRecordModal({
  show,
  onClose,
  record,
}: IndividualRecordModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [panelists, setPanelists] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (record) {
      const panelistData = programDetails[record.program] || [];
      setPanelists(panelistData);
      setCurrentPage(1);
      setIsEditing(false);
    }
  }, [record]);

  if (!record) return null;

  const totalPages = Math.ceil(panelists.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedPanelists = panelists.slice(startIndex, endIndex);

  const handleRemovePanelist = (id: number) => {
    const updatedPanelists = panelists.filter((panelist) => panelist.id !== id);
    setPanelists(updatedPanelists);
    if (paginatedPanelists.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAddPanelist = (newPanelistData: {
    panelistName: string;
    role: string;
    defenseType: string;
    receivedDate: string;
    amount: number;
  }) => {
    const newPanelist = {
      ...newPanelistData,
      id: panelists.length > 0 ? Math.max(...panelists.map((p) => p.id)) + 1 : 1,
      amount: parseFloat(newPanelistData.amount.toString()),
    };
    const updatedPanelists = [...panelists, newPanelist];
    setPanelists(updatedPanelists);
    setShowAddModal(false);
    setCurrentPage(Math.ceil(updatedPanelists.length / PAGE_SIZE));
  };

  // 🔹 NEW: Handle CSV Download
const handleDownload = () => {
  if (!record) return;
  const filename = `${record.name}_panelists.csv`;

  // ✅ Use record.name for full program name instead of record.program
  const programInfo = [
    [`Program: ${record.name}`],
    [`Date Edited: ${record.date_edited}`],
    [""], // empty row before panelists
  ];

  // Table headers
  const header = ["Panelist", "Role", "Defense Type", "Received Date", "Amount"];

  // Table rows
  const rows = panelists.map((p) => [
    p.panelistName,
    p.role,
    p.defenseType,
    p.receivedDate,
    p.amount,
  ]);

  // Combine everything
  let csvContent =
    "data:text/csv;charset=utf-8," +
    [...programInfo, header, ...rows].map((e) => e.join(",")).join("\n");

  // Trigger download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <>
      <Dialog open={show} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl min-w-260 min-h-90 w-full max-h-[90vh]">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-bold">
              {record.name}
            </DialogTitle>
            <DialogDescription>
              Honorarium summary for the {record.program} program. Last updated
              on {record.date_edited}.
            </DialogDescription>
            <div className="flex justify-end space-x-2 pt-2">
              {/* 🔹 NEW Download button */}
              <Button
                onClick={handleDownload}
                variant="outline"
                className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1"

                //rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1
              >
                <Download size={16} />
                Download
              </Button>

              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1"
              >
                <Pencil size={16} />
                {isEditing ? "Done" : "Edit Panelists"}
              </Button>
              {isEditing && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  variant="outline"
                  className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1 text-green-500 hover:text-green-600"
                >
                  <Plus size={16} />
                  Add Panelist
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* MODIFIED: Added inner div for scroll and updated parent container conventions */}
          <div className="rounded-md overflow-x-auto border border-border p-2 bg-white dark:bg-card">
            <div className="max-h-[65vh] overflow-y-auto px-1">
              <Table className="min-w-full text-sm">
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    {/* MODIFIED: Applied header width and padding conventions */}
                    <TableHead className="w-[40%] px-1 py-2">Panelist</TableHead>
                    <TableHead className="w-[15%] px-1 py-2">Defense Type</TableHead>
                    <TableHead className="w-[20%] px-1 py-2">Received Date</TableHead>
                    <TableHead className="w-[15%] text-right px-1 py-2">Amount</TableHead>
                    {isEditing && <TableHead className="w-[10%] text-center px-1 py-2">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {paginatedPanelists.length > 0 ? (
                      paginatedPanelists.map((item) => (
                        <motion.tr
                          key={item.id}
                          className="hover:bg-muted/50"
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          {/* MODIFIED: Applied cell padding conventions */}
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
                            <TableCell className="text-center px-1 py-2">
                              {/* MODIFIED: Adjusted icon size for consistency */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleRemovePanelist(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
          </div>
          {totalPages > 1 && (
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