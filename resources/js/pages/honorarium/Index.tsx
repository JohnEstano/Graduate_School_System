"use client";

import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router } from "@inertiajs/react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchInput } from "@/components/ui/search-input";
import {
  // ChevronsLeft,
  // ChevronLeft,
  // ChevronRight,
  // ChevronsRight,
  Eye,
} from "lucide-react";

// Breadcrumbs for the layout
const breadcrumbs: BreadcrumbItem[] = [{ title: "Honorarium Summary", href: "/honorarium" }];

// Type for each program record
export type ProgramRecord = {
  id: number;
  name: string;
  program: string;
  category: string;
  date_edited: string;
};

export default function Index({ records }: { records: ProgramRecord[] }) {
  // State
  const [allRecords] = useState<ProgramRecord[]>(records);
  const [searchQuery, setSearchQuery] = useState("");
  // const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 6;

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) =>
      record.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allRecords, searchQuery]);

  // // Pagination
  // const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  // const paginatedRecords = useMemo(() => {
  //   const startIndex = (currentPage - 1) * itemsPerPage;
  //   return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  // }, [currentPage, filteredRecords]);

  // // Change page
  // const handlePageChange = (page: number) => {
  //   if (page > 0 && page <= totalPages) setCurrentPage(page);
  // };

  // Navigate to record details (FIXED - use route helper if available, fallback to direct URL)
const handleViewRecordsClick = (record: ProgramRecord) => {
  window.location.href = `/honorarium/individual-record/${record.id}`;
};

  return (
 <AppLayout breadcrumbs={breadcrumbs}>
  <Head title="Honorarium Summary" />

  <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
    {/* Title */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
      <h1 className="text-2xl font-bold tracking-tight">Honorarium Summary</h1>
    </div>

    {/* Search */}
    <div className="mb-4">
      <SearchInput
        placeholder="Search by Program Name..."
        className="w-full md:w-1/3"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>

    {/* Table */}
    <div className="rounded-md border border-border bg-white dark:bg-[#121212] p-2">
      <div className="max-h-[68vh] overflow-y-auto">
        <Table className="min-w-full text-sm">
          <TableHeader className="sticky top-0 bg-white dark:bg-[#121212] z-10">
            <TableRow>
              <TableHead className="w-[60%] px-1 py-2">Program</TableHead>
              <TableHead className="w-[20%] px-1 py-2 text-center">Date Edited</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {records.length > 0 ? (
              records.map((record) => (
                <TableRow
                  key={record.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleViewRecordsClick(record)}
                >
                  {/* Program Info */}
                  <TableCell className="flex items-center space-x-4 px-1 py-2">
                    <Avatar className="h-10 w-10 flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      <AvatarFallback>{record.program.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{record.name}</div>
                      <div className="text-sm text-muted-foreground">{record.program}</div>
                    </div>
                  </TableCell>

                  {/* Date Edited */}
                  <TableCell className="px-1 py-2 text-center">
                    {record.date_edited
                      ? new Date(record.date_edited).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</AppLayout>

  );
}




   // <AppLayout breadcrumbs={breadcrumbs}>
    //   <Head title="Honorarium Summary" />

    //   <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
    //     {/* Title */}
    //     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
    //       <h1 className="text-2xl font-bold tracking-tight">Honorarium Summary</h1>
    //     </div>

    //     {/* Search */}
    //     <div className="mb-4">
    //       <SearchInput
    //         placeholder="Search by Program Name..."
    //         className="w-full md:w-1/3"
    //         value={searchQuery}
    //         onChange={(e) => setSearchQuery(e.target.value)}
    //       />
    //     </div>

    //     {/* Table */}
    //     <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-[#121212] p-2">
    //       <Table className="min-w-full text-sm">
    //         <TableHeader>
    //           <TableRow>
    //             <TableHead className="w-[60%] px-1 py-2">Program</TableHead>
    //             <TableHead className="w-[20%] px-1 py-2 text-center">Date Edited</TableHead>
    //             <TableHead className="w-[20%] text-center px-1 py-2">Actions</TableHead>
    //           </TableRow>
    //         </TableHeader>

    //         <TableBody>
    //           {paginatedRecords.length > 0 ? (
    //             paginatedRecords.map((record) => (
    //               <TableRow
    //                 key={record.id}
    //                 className="hover:bg-muted/50 cursor-pointer"
    //                 onClick={() => handleViewRecordsClick(record)}
    //               >
    //                 {/* Program Info */}
    //                 <TableCell className="flex items-center space-x-4 px-1 py-2">
    //                   <Avatar className="h-10 w-10 flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
    //                     <AvatarFallback>{record.program.charAt(0)}</AvatarFallback>
    //                   </Avatar>
    //                   <div>
    //                     <div className="font-medium">{record.name}</div>
    //                     <div className="text-sm text-muted-foreground">{record.program}</div>
    //                   </div>
    //                 </TableCell>

    //                 {/* Date Edited */}
    //                 <TableCell className="px-1 py-2 text-center">
    //                   {record.date_edited
    //                     ? new Date(record.date_edited).toLocaleDateString()
    //                     : "N/A"}
    //                 </TableCell>

    //                 {/* Action Button */}
    //                 <TableCell className="px-1 py-2 text-center">
    //                   <Button
    //                     size="icon"
    //                     variant="outline"
    //                     onClick={(e) => {
    //                       e.stopPropagation();
    //                       console.log('Navigating to record:', record.id); // Debug log
    //                       handleViewRecordsClick(record);
    //                     }}
    //                     title={`View details for ${record.name}`}
    //                   >
    //                     <Eye className="w-4 h-4" />
    //                   </Button>
    //                 </TableCell>
    //               </TableRow>
    //             ))
    //           ) : (
    //             <TableRow>
    //               <TableCell colSpan={3} className="h-24 text-center">
    //                 No results found.
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

    //         {/* First Page */}
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           onClick={() => handlePageChange(1)}
    //           disabled={currentPage === 1}
    //         >
    //           <ChevronsLeft className="w-4 h-4" />
    //         </Button>

    //         {/* Previous Page */}
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           onClick={() => handlePageChange(currentPage - 1)}
    //           disabled={currentPage === 1}
    //         >
    //           <ChevronLeft className="w-4 h-4" />
    //         </Button>

    //         {/* Next Page */}
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           onClick={() => handlePageChange(currentPage + 1)}
    //           disabled={currentPage === totalPages}
    //         >
    //           <ChevronRight className="w-4 h-4" />
    //         </Button>

    //         {/* Last Page */}
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
    //   </div>
    // </AppLayout>