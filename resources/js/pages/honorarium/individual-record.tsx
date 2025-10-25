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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchInput } from "@/components/ui/search-input";
import PDFDownloadButton from "./honorarium-modals/download-dropdown";
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
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedPanelist, setSelectedPanelist] = useState<Panelist | null>(null);

  // Filter panelists based on search
  const filteredPanelists = panelists.filter((panelist) => {
    const fullName = `${panelist.pfirst_name} ${panelist.pmiddle_name || ""} ${panelist.plast_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <AppLayout breadcrumbs={[...breadcrumbs, { title: record.name, href: "#" }]}>
      <Head title={`Honorarium Summary - ${record.name}`} />

      <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{record.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {record.program} • {record.category}
            </p>
          </div>
        </div>

        {/* Search Filter */}
        <div className="mb-4">
          <SearchInput
            placeholder="Search Panelist Name..."
            className="w-full md:w-1/3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Panelists Table */}
        <div
          id="honorarium-details"
          className="rounded-md border border-border bg-white dark:bg-[#121212] p-2 max-h-[68vh] overflow-y-auto"
        >
          <Table className="min-w-full text-sm">
            <TableHeader className="sticky top-0 bg-white dark:bg-[#121212] z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[70%] px-4 py-2">Panelist Name</TableHead>
                <TableHead className="w-[30%] px-4 py-2 text-center">Receivable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPanelists.length > 0 ? (
                filteredPanelists.map((panelist) => (
                  <TableRow
                    key={panelist.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPanelist(panelist)}
                  >
                    <TableCell className="flex items-center space-x-4 px-4 py-3">
                      <Avatar className="h-10 w-10 flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        <AvatarFallback>{panelist.pfirst_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {panelist.pfirst_name} {panelist.pmiddle_name || ""} {panelist.plast_name}
                        </div>
                        <div className="text-sm text-muted-foreground">{panelist.role}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      ₱{panelist.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No panelists found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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



