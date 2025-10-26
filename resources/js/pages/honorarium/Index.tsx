"use client";

import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Head, router } from "@inertiajs/react"; // ⬅ add router import
import { useState, useMemo } from "react";

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
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Book } from "lucide-react";
import { cn } from "@/lib/utils";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Honorarium Summary", href: "/honorarium" }];

export type ProgramRecord = {
  id: number;
  name: string;
  program: string;
  category: string;
  date_edited: string;
};

export default function Index({ records }: { records: ProgramRecord[] }) {
  const [allRecords] = useState<ProgramRecord[]>(records);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

  const programCategories = ["All Programs", "Doctorate", "Masteral"];

  const filteredRecords = useMemo(() => {
    return allRecords.filter((record) => {
      const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category
      if (selectedCategory && selectedCategory !== "All Programs") {
        const matchesCategory = record.category?.toLowerCase() === selectedCategory.toLowerCase() ||
                               (selectedCategory === "Masteral" && record.category?.toLowerCase() === "masters");
        return matchesSearch && matchesCategory;
      }
      
      return matchesSearch;
    });
  }, [allRecords, searchQuery, selectedCategory]);

  // ✅ Inertia navigation (no reload)
  const handleViewRecordsClick = (record: ProgramRecord) => {
    router.visit(`/honorarium/individual-record/${record.id}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Honorarium Summary" />

      <div className="container mx-auto p-6 dark:bg-[#0a0a0a] min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Honorarium Summary</h1>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <SearchInput
            placeholder="Search by Program Name..."
            className="w-full sm:w-1/3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Program Category Filter */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>

            <Popover open={isCategoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <Book className="mr-2 h-4 w-4" />
                  {selectedCategory ?? 'All Programs'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Filter program..." />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {programCategories.map((category) => (
                        <CommandItem
                          key={category}
                          onSelect={() => { 
                            setSelectedCategory(category === "All Programs" ? null : category); 
                            setCategoryPopoverOpen(false); 
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', selectedCategory === category || (category === "All Programs" && !selectedCategory) ? 'opacity-100' : 'opacity-0')} />
                          {category}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="rounded-md border border-border bg-white dark:bg-[#121212] p-2">
          <div className="max-h-[68vh] overflow-y-auto">
            <Table className="min-w-full text-sm">
              <TableHeader className="sticky top-0 bg-white dark:bg-[#121212] z-10">
                <TableRow>
                  <TableHead className="w-[70%] px-4 py-2">Program</TableHead>
                  <TableHead className="w-[30%] px-4 py-2 text-center">Date Edited</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewRecordsClick(record)}
                    >
                      <TableCell className="flex items-center space-x-4 px-4 py-3">
                        <Avatar className="h-10 w-10 flex-shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                          <AvatarFallback>{record.program.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{record.name}</div>
                          <div className="text-sm text-muted-foreground">{record.program}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {record.category}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-center">
                        {record.date_edited
                          ? new Date(record.date_edited).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : new Date().toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
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
