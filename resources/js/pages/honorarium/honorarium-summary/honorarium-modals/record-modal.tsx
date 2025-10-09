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
import { ProgramRecord } from '@/pages/honorarium/honorarium-summary/Index';

type Payment = {
  id: number;
  panelist_name: string;
  role: string;
  defense_type?: string;
  payment_date?: string;
  amount: number | string;
};

interface IndividualRecordModalProps {
  show: boolean;
  onClose: () => void;
  record: (ProgramRecord & { payments: Payment[] }) | null;
}

const PAGE_SIZE = 5;

export default function IndividualRecordModal({
  show,
  onClose,
  record,
}: IndividualRecordModalProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!record) return null;

  const panelists = record.payments || [];
  const totalPages = Math.ceil(panelists.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedPanelists = panelists.slice(startIndex, endIndex);

  const handleDownload = () => {
    if (!record) return;
    const filename = `${record.name}_panelists.csv`;
    const programInfo = [
      [`Program: ${record.name}`],
      [`Date Edited: ${record.date_edited}`],
      [""],
    ];
    const header = ["Panelist", "Role", "Defense Status", "Received Date", "Amount"];
    const rows = panelists.map((p) => [
      // Replace with actual property names or fallback values
      (p as any).panelist_name || "", // or use "" if not available
      (p as any).role || "", // or use "" if not available
      p.defense_status || "",
      p.payment_date || "",
      p.amount,
    ]);
    let csvContent =
      "data:text/csv;charset=utf-8," +
      [...programInfo, header, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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
            <Button
              onClick={handleDownload}
              variant="outline"
              className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1"
            >
              <Download size={16} />
              Download
            </Button>
          </div>
        </DialogHeader>
        <div className="rounded-md overflow-x-auto border border-border p-2 bg-white dark:bg-card">
          <div className="max-h-[65vh] overflow-y-auto px-1">
            <Table className="min-w-full text-sm">
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="w-[40%] px-1 py-2">Panelist</TableHead>
                  <TableHead className="w-[15%] px-1 py-2">Defense Type</TableHead>
                  <TableHead className="w-[20%] px-1 py-2">Received Date</TableHead>
                  <TableHead className="w-[15%] text-right px-1 py-2">Amount</TableHead>
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
                        <TableCell className="px-1 py-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
                              <AvatarFallback>
                                {(typeof (item as any).panelist_name === "string" && (item as any).panelist_name.charAt(0)) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{(item as any).panelist_name ?? "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{(item as any).role ?? ""}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-1 py-2">{(item as any).defense_type ?? item.defense_status ?? ""}</TableCell>
                        <TableCell className="px-1 py-2">{item.payment_date || ""}</TableCell>
                        <TableCell className="text-right px-1 py-2">₱{Number(item.amount).toFixed(2)}</TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
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
  );
}