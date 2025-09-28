"use client";

import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head } from "@inertiajs/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DownloadDropdown from "./honorarium-modals/download-dropdown";
import PanelistIndividualRecord from "./panelist-individual-record";

// Types
interface Payment {
  id: number;
  payment_date: string;
  defense_status: string;
  amount: number;
}

interface Student {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  course_section: string;
  school_year: string;
  payments: Payment[];
}

interface Panelist {
  id: number;
  pfirst_name: string;
  pmiddle_name?: string;
  plast_name: string;
  role: string;
  defense_type: string;
  received_date: string;
  students: Student[];
  amount: number;
}

export type ProgramRecord = {
  id: number;
  name: string;
  program: string;
  category: string;
  date_edited: string;
};

interface Props {
  record: ProgramRecord;
  panelists: Panelist[];
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [{ title: "Honorarium Summary", href: "/honorarium" }];

export default function Show({ record, panelists: initialPanelists }: Props) {
  const withAmounts = initialPanelists.map((p) => {
    const total = (p.students || []).reduce(
      (sum, s) =>
        sum +
        (s.payments || []).reduce(
          (pSum, pay) => pSum + Number(pay.amount || 0),
          0
        ),
      0
    );
    return { ...p, amount: total };
  });

  const [panelists, setPanelists] = useState<Panelist[]>(withAmounts);

  // Modal state
  const [selectedPanelist, setSelectedPanelist] = useState<Panelist | null>(null);

  return (
    <AppLayout breadcrumbs={[...breadcrumbs, { title: record.name, href: "#" }]}>
      <Head title={`Honorarium Summary - ${record.name}`} />

      <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{record.name}</h1>
            <p className="text-sm text-gray-500">
              {record.program} • Last updated{" "}
              {record.date_edited
                ? new Date(record.date_edited).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Panelists Table */}
        <div
          id="honorarium-details"
          className="rounded-md border border-border bg-white dark:bg-[#121212] p-2"
        >
          <div className="max-h-[500px] overflow-y-auto">
            <Table className="min-w-full text-sm">
              <TableHeader className="sticky top-0 bg-white dark:bg-[#121212] z-10">
                <TableRow>
                  <TableHead className="w-[40%] px-1 py-2">Panelist Name</TableHead>
                  <TableHead className="w-[20%] px-1 py-2 text-center">Receivable</TableHead>
                  <TableHead className="w-[20%] px-1 py-2 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {panelists.length > 0 ? (
                  panelists.map((panelist) => (
                    <TableRow
                      key={panelist.id}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setSelectedPanelist(panelist)}
                    >
                      <TableCell className="px-1 py-2 font-medium">
                        {panelist.pfirst_name} {panelist.pmiddle_name} {panelist.plast_name}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-center">
                        ₱ {panelist.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="px-1 py-2 text-center">
                        <div className="flex justify-center gap-2">
                          <DownloadDropdown record={record} panelists={panelists} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No panelists found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedPanelist && (
        <PanelistIndividualRecord
          panelist={selectedPanelist}
          onClose={() => setSelectedPanelist(null)}
        />
      )}
    </AppLayout>
  );
}












    //             className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1 text-green-500 hover:text-green-600"
    //           >
    //             <Plus size={16} /> Add Panelist
    //           </Button>
    //         )}
    //       </div>
    //     </div>

    //     {/* Panelists Table */}
    //     <div
    //       id="honorarium-details"
    //       className="rounded-md overflow-x-auto border border-border bg-white dark:bg-[#121212] p-2"
    //     >
    //       <Table className="min-w-full text-sm">
    //         <TableHeader>
    //           <TableRow>
    //             <TableHead className="w-[30%] px-1 py-2">Panelist</TableHead>
    //             <TableHead className="w-[20%] px-1 py-2 text-center">Role</TableHead>
    //             <TableHead className="w-[20%] px-1 py-2 text-center">Defense Type</TableHead>
    //             <TableHead className="w-[20%] px-1 py-2 text-center">Amount</TableHead>
    //             <TableHead className="w-[10%] px-1 py-2 text-center">Date</TableHead>
    //           </TableRow>
    //         </TableHeader>
    //         <TableBody>
    //           {paginatedPanelists.length > 0 ? (
    //             paginatedPanelists.map((panelist) => (
    //               <TableRow key={panelist.id}>
    //                 <TableCell className="px-1 py-2">
    //                   {panelist.pfirst_name} {panelist.pmiddle_name}{" "}
    //                   {panelist.plast_name}
    //                 </TableCell>
    //                 <TableCell className="px-1 py-2 text-center">
    //                   {panelist.role}
    //                 </TableCell>
    //                 <TableCell className="px-1 py-2 text-center">
    //                   {panelist.defense_type}
    //                 </TableCell>
    //                 <TableCell className="px-1 py-2 text-center">
    //                   ₱{panelist.amount.toLocaleString()}
    //                 </TableCell>
    //                 <TableCell className="px-1 py-2 text-center">
    //                   {panelist.received_date
    //                     ? new Date(panelist.received_date).toLocaleDateString()
    //                     : "N/A"}
    //                 </TableCell>
    //               </TableRow>
    //             ))
    //           ) : (
    //             <TableRow>
    //               <TableCell colSpan={5} className="h-24 text-center">
    //                 No panelists found.
    //               </TableCell>
    //             </TableRow>
    //           )}
    //         </TableBody>
    //       </Table>
    //     </div>

    //     {/* Pagination */}
    //     {totalPages > 1 && (
    //       <div className="mt-4 flex justify-end items-center space-x-2 text-sm text-muted-foreground">
    //         <span>
    //           Page {currentPage} of {totalPages}
    //         </span>
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           onClick={() => handlePageChange(1)}
    //           disabled={currentPage === 1}
    //         >
    //           <ChevronsLeft className="w-4 h-4" />
    //         </Button>
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           onClick={() => handlePageChange(currentPage - 1)}
    //           disabled={currentPage === 1}
    //         >
    //           <ChevronLeft className="w-4 h-4" />
    //         </Button>
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           onClick={() => handlePageChange(currentPage + 1)}
    //           disabled={currentPage === totalPages}
    //         >
    //           <ChevronRight className="w-4 h-4" />
    //         </Button>
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           onClick={() => handlePageChange(totalPages)}
    //           disabled={currentPage === totalPages}
    //         >
    //           <ChevronsRight className="w-4 h-4" />
    //         </Button>
    //       </div>
    //     )}

    //     {/* Add Panelist Modal */}
    //     {/* <AddPanelistModal
    //       show={showAddModal}
    //       onClose={() => setShowAddModal(false)}
    //       onAddPanelist={handleAddPanelist}
    //     /> */}
    //   </div>
    // </AppLayout>
