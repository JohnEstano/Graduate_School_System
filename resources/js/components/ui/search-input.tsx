// @/components/ui/search-input.tsx

import * as React from 'react';
import { Search as SearchIcon } from 'lucide-react'; // Import the icon
import { cn } from '@/lib/utils';

export type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                className={cn(
                    
                    'flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-0.5 disabled:cursor-not-allowed disabled:opacity-50',
                    className,
                )}
            >
                <SearchIcon className="h-[16px] w-[16px] text-muted-foreground" />
                <input
                    type="search"
                    className="w-full p-2 bg-transparent focus-visible:outline-none"
                    ref={ref}
                    {...props}
                />
            </div>
        );
    },
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
