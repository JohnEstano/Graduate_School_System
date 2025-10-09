import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search } from 'lucide-react';
import axios from 'axios';

// Configure axios to include CSRF token
const axiosInstance = axios.create();
axiosInstance.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axiosInstance.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

type Student = {
    id: number;
    email: string;
    school_id: string;
    student_number: string;
    program: string;
    display_name: string;
    first_name: string;
    last_name: string;
};

type StudentAutocompleteProps = {
    onSelect: (student: Student) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    value?: string;
    onChange?: (value: string) => void;
};

export default function StudentAutocomplete({
    onSelect,
    placeholder = "Search students by name, email, or ID...",
    className = "",
    disabled = false,
    value: controlledValue,
    onChange: controlledOnChange
}: StudentAutocompleteProps) {
    const [query, setQuery] = useState(controlledValue || '');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Handle controlled vs uncontrolled component
    const value = controlledValue !== undefined ? controlledValue : query;
    const onChange = controlledOnChange || setQuery;
    
    useEffect(() => {
        if (controlledValue !== undefined) {
            setQuery(controlledValue);
        }
    }, [controlledValue]);


    
    useEffect(() => {
        const searchStudents = async () => {
            if (value.length < 2) {
                setStudents([]);
                setShowDropdown(false);
                return;
            }
            
            setLoading(true);
            try {
                const response = await axiosInstance.get('/api/students/search', {
                    params: { q: value }
                });
                setStudents(response.data);
                setShowDropdown(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Failed to search students:', error);
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };
        
        const debounceTimer = setTimeout(searchStudents, 300);
        return () => clearTimeout(debounceTimer);
    }, [value]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        if (!controlledValue) {
            setQuery(newValue);
        }
    };
    
    const handleStudentSelect = (student: Student) => {
        onSelect(student);
        setShowDropdown(false);
        setSelectedIndex(-1);
        // Don't clear the input immediately - let parent component handle it
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || students.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < students.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : students.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < students.length) {
                    handleStudentSelect(students[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                break;
        }
    };
    
    const getInitials = (student: Student) => {
        const first = student.first_name?.trim()?.[0] ?? "";
        const last = student.last_name?.trim()?.[0] ?? "";
        return (first + last).toUpperCase() || "U";
    };
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
                setSelectedIndex(-1);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => value.length >= 2 && students.length > 0 && setShowDropdown(true)}
                    disabled={disabled}
                    className="pr-8"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                        <Search className="h-4 w-4 text-gray-400" />
                    )}
                </div>
            </div>
            
            {showDropdown && students.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto dark:bg-zinc-800 dark:border-zinc-700"
                >
                    {students.map((student, index) => (
                        <div
                            key={student.id}
                            className={`px-3 py-2 cursor-pointer flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-700 ${
                                index === selectedIndex ? 'bg-gray-50 dark:bg-zinc-700' : ''
                            }`}
                            onClick={() => handleStudentSelect(student)}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                    {getInitials(student)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate dark:text-white">
                                    {student.display_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {student.email} • {student.school_id}
                                </div>
                                {student.program && (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                        {student.program}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {showDropdown && !loading && students.length === 0 && value.length >= 2 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 dark:bg-zinc-800 dark:border-zinc-700"
                >
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        No students found for "{value}"
                    </div>
                </div>
            )}
        </div>
    );
}