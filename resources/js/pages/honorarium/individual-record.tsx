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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  defense_date?: string;
  payments: Payment[];
}

interface Panelist {
  id: number;
  pfirst_name: string;
  pmiddle_name?: string;
  plast_name: string;
  role: string;
  defense_type: string;
  defense_date?: string;
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  // Modal state
  const [selectedPanelist, setSelectedPanelist] = useState<Panelist | null>(null);

  // Handle manual date input
  const handleStartDateChange = (value: string) => {
    setStartDateInput(value);
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) {
      setDateRange({ from: parsed, to: dateRange?.to });
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDateInput(value);
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) {
      setDateRange({ from: dateRange?.from, to: parsed });
    }
  };

  // Sync input fields when calendar changes
  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setStartDateInput(format(range.from, "yyyy-MM-dd"));
    } else {
      setStartDateInput("");
    }
    if (range?.to) {
      setEndDateInput(format(range.to, "yyyy-MM-dd"));
    } else {
      setEndDateInput("");
    }
  };

  // Filter panelists based on search and date range (defense date)
  const filteredPanelists = panelists.filter((panelist) => {
    const fullName = `${panelist.pfirst_name} ${panelist.pmiddle_name || ""} ${panelist.plast_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    
    // Filter by date range based on defense date
    if (dateRange?.from) {
      const fromDate = dateRange.from;
      const toDate = dateRange.to || fromDate;
      
      // Check if ANY student has a defense date within the range
      const hasStudentInRange = (panelist.students || []).some((student) => {
        const defenseDate = student.defense_date ? new Date(student.defense_date) : null;
        if (!defenseDate) return false;
        return defenseDate >= fromDate && defenseDate <= toDate;
      });
      
      return matchesSearch && hasStudentInRange;
    }
    
    return matchesSearch;
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

        {/* Search and Date Filter */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <SearchInput
            placeholder="Search Panelist Name..."
            className="w-full sm:w-1/3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Date Range Filter */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                        {format(dateRange.to, "MMM dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                  {/* Date Inputs */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="start-date" className="text-xs font-medium text-muted-foreground">
                        From
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDateInput}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="h-9 w-full"
                        placeholder="Start date"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end-date" className="text-xs font-medium text-muted-foreground">
                        To
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDateInput}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="h-9 w-full"
                        placeholder="End date"
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or select from calendar</span>
                    </div>
                  </div>

                  {/* Calendar */}
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from || new Date()}
                    selected={dateRange}
                    onSelect={handleCalendarSelect}
                    numberOfMonths={1}
                    className="rounded-md"
                  />

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    {dateRange?.from ? (
                      <div className="text-xs text-muted-foreground flex-1">
                        {dateRange.to ? (
                          <span className="font-medium">
                            {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                          </span>
                        ) : (
                          <span>{format(dateRange.from, "MMM dd, yyyy")}</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No date selected</div>
                    )}
                    {dateRange && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDateRange(undefined);
                          setStartDateInput("");
                          setEndDateInput("");
                        }}
                        className="h-8 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Panelists Table */}
        <div
          id="honorarium-details"
          className="rounded-md border border-border bg-white dark:bg-[#121212] p-2 max-h-[68vh] overflow-y-auto"
        >
          <Table className="min-w-full text-sm">
            <TableHeader className="sticky top-0 bg-white dark:bg-[#121212] z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[50%] px-4 py-2">Panelist Name</TableHead>
                <TableHead className="w-[25%] px-4 py-2 text-center">Defense Date</TableHead>
                <TableHead className="w-[25%] px-4 py-2 text-center">Receivable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPanelists.length > 0 ? (
                filteredPanelists.map((panelist) => {
                  // Get the latest defense date from all students
                  const defenseDates = (panelist.students || [])
                    .map(s => s.defense_date ? new Date(s.defense_date) : null)
                    .filter(d => d !== null) as Date[];
                  
                  const latestDefenseDate = defenseDates.length > 0 
                    ? new Date(Math.max(...defenseDates.map(d => d.getTime())))
                    : null;

                  return (
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
                        {latestDefenseDate 
                          ? latestDefenseDate.toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        ₱{panelist.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
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



