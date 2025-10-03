import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Calendar,
  Book,
  Eye,
  Download,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/search-input';
import IndividualRecordModal from './honorarium-modals/record-modal';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Honorarium', href: '/honorarium' },
  { title: 'Honorarium Summary', href: '/honorarium-summary' },
];

const programCategories = ['Doctorate', 'Masters'];

export type ProgramRecord = {
   id: number;
  name: string;
  program: string;
  category: string;
  date_edited: string;
  payments?: {
    id: number;
    school_year: string;
    payment_date: string;
    defense_status: string;
    amount: string;
  }[];
};

function generateYearRange(start: number, end: number): number[] {
  const years = [];
  for (let y = end; y >= start; y--) {
    years.push(y);
  }
  return years;
}

export default function Index({ records }: { records: ProgramRecord[] }) {
  const [allRecords] = useState<ProgramRecord[]>(records);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isYearPopoverOpen, setYearPopoverOpen] = useState(false);
  const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProgramRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      const matchYear = selectedYear ? record.date_edited.startsWith(selectedYear) : true;
      const matchCategory = selectedCategory ? record.category === selectedCategory : true;
      const matchSearch = searchQuery ? record.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      return matchYear && matchCategory && matchSearch;
    });
  }, [allRecords, selectedYear, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredRecords, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const handleViewRecordsClick = (record: ProgramRecord) => {
    setSelectedRecord(record);
    setShowRecordModal(true);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Honorarium Summary" />
      <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Honorarium Summary</h1>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          <SearchInput
            placeholder="Search by Program Name..."
            className="w-full md:w-1/3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>

            {/* Year Filter */}
            <Popover open={isYearPopoverOpen} onOpenChange={setYearPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedYear ?? 'All Years'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search years..." />
                  <CommandList>
                    <CommandEmpty>No year found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedYear(null);
                          setYearPopoverOpen(false);
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', selectedYear === null ? 'opacity-100' : 'opacity-0')} />
                        All Years
                      </CommandItem>

                      {generateYearRange(2020, 2025).map((year) => (
                        <CommandItem
                          key={year}
                          onSelect={() => {
                            setSelectedYear(year.toString());
                            setYearPopoverOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', selectedYear === year.toString() ? 'opacity-100' : 'opacity-0')} />
                          {year}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Category Filter */}
            <Popover open={isCategoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <Book className="mr-2 h-4 w-4" />
                  {selectedCategory ?? 'All Programs'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Filter category..." />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {programCategories.map((category) => (
                        <CommandItem
                          key={category}
                          onSelect={() => { setSelectedCategory(category); setCategoryPopoverOpen(false); }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', selectedCategory === category ? 'opacity-100' : 'opacity-0')} />
                          {category}
                        </CommandItem>
                      ))}
                      <CommandItem
                        onSelect={() => { setSelectedCategory(null); setCategoryPopoverOpen(false); }}
                        className="text-red-500"
                      >
                        Clear Filter
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md overflow-x-auto border border-border bg-white dark:bg-[#121212] p-2">
          <Table className="min-w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%] px-1 py-2">Program</TableHead>
                <TableHead className="w-[20%] px-1 py-2 text-center">Date Edited</TableHead>
                <TableHead className="w-[20%] text-center px-1 py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="flex items-center space-x-4 px-1 py-2">
                      <Avatar className="h-10 w-10 flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                        <AvatarFallback>{record.program.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-sm text-muted-foreground">{record.program}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-1 py-2 text-center">{record.date_edited}</TableCell>
                    <TableCell className="px-1 py-2">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1"
                          onClick={() => handleViewRecordsClick(record)}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline-block">View Records</span>
                        </Button>
                        <Button
                            variant="outline"
  size="icon"
  className="rounded-md h-auto p-2"
  onClick={() => {
    window.location.href = route('honorarium-summary.download', record.id);
  }}
>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-end items-center space-x-2 text-sm text-muted-foreground">
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="icon" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <IndividualRecordModal
        show={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        record={selectedRecord}
      />
    </AppLayout>
  );
}
