import React, { useState, useMemo } from 'react';
import { Mail, MessageSquare, Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getProgramAbbreviation } from "@/utils/program-abbreviations";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface StaffMember {
    id: number;
    name: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    students_count: number;
    advisers_count: number;
    programs?: string[];
}

interface StaffDataTableProps {
    data: StaffMember[];
    type: 'coordinators' | 'assistants';
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedProgram?: string;
    onProgramChange?: (value: string) => void;
    allPrograms?: string[];
}

export default function StaffDataTable({ 
    data, 
    type, 
    searchQuery, 
    onSearchChange,
    selectedProgram = 'all',
    onProgramChange,
    allPrograms: externalPrograms
}: StaffDataTableProps) {
    // Get all unique programs from coordinators (use external if provided)
    const allPrograms = useMemo(() => {
        if (externalPrograms) return externalPrograms;
        
        const programSet = new Set<string>();
        data.forEach(staff => {
            if (staff.programs) {
                staff.programs.forEach(program => programSet.add(program));
            }
        });
        return Array.from(programSet).sort();
    }, [data, externalPrograms]);

    const filteredData = useMemo(() => {
        return data.filter(staff => {
            const searchTerm = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || 
                staff.name.toLowerCase().includes(searchTerm) ||
                staff.email.toLowerCase().includes(searchTerm);
            
            const matchesProgram = selectedProgram === 'all' || 
                (staff.programs && staff.programs.includes(selectedProgram));
            
            return matchesSearch && matchesProgram;
        });
    }, [data, searchQuery, selectedProgram]);

    return (
        <div className="flex flex-col">
            {/* Table */}
            <div className="overflow-hidden">
                <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-3 min-w-[240px]">Name</TableHead>
                                {type === 'coordinators' && (
                                    <>
                                        <TableHead className="px-2 min-w-[200px]">Programs</TableHead>
                                        <TableHead className="px-2 w-[100px] text-center">Students</TableHead>
                                        <TableHead className="px-2 w-[100px] text-center">Advisers</TableHead>
                                    </>
                                )}
                                <TableHead className="text-center px-2 w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell 
                                        colSpan={type === 'coordinators' ? 5 : 2} 
                                        className="py-8 text-center text-sm text-muted-foreground"
                                    >
                                        {searchQuery 
                                            ? 'No results found'
                                            : `No ${type} found.`
                                        }
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((staff) => (
                                    <TableRow 
                                        key={staff.id} 
                                        className="hover:bg-muted/40 transition"
                                    >
                                        <TableCell className="px-3 py-2 align-middle">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-gray-200 dark:border-zinc-700">
                                                    <AvatarFallback className="text-xs font-medium bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                                                        {staff.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {staff.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {staff.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        
                                        {type === 'coordinators' && (
                                            <>
                                                <TableCell className="px-2 py-2 align-middle">
                                                    <div className="flex flex-wrap gap-1">
                                                        {staff.programs && staff.programs.length > 0 ? (
                                                            staff.programs.map((program, idx) => (
                                                                <Badge 
                                                                    key={idx} 
                                                                    variant="outline" 
                                                                    className="text-xs font-medium"
                                                                >
                                                                    {getProgramAbbreviation(program)}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-center align-middle">
                                                    <span className="text-sm font-medium">
                                                        {staff.students_count}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-2 py-2 text-center align-middle">
                                                    <span className="text-sm font-medium">
                                                        {staff.advisers_count}
                                                    </span>
                                                </TableCell>
                                            </>
                                        )}
                                        
                                        <TableCell className="px-2 py-2 text-center">
                                            <div className="flex justify-center gap-2">
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <a
                                                                href={`mailto:${staff.email}`}
                                                                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                            >
                                                                <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                            </a>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200">
                                                            <p className="text-xs">Send Email</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <a
                                                                href={`https://chat.google.com/dm/${staff.email}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                            >
                                                                <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                            </a>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200">
                                                            <p className="text-xs">Google Chat</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
