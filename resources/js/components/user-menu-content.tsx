import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import axios from '@/lib/axios';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();

    const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        cleanup();
        
        try {
            // Get fresh CSRF token from server
            await axios.get('/sanctum/csrf-cookie');
            
            // Small delay to ensure cookie is set
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Get the fresh token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                console.error('No CSRF token found');
                window.location.href = '/login';
                return;
            }
            
            // Create and submit form with fresh token
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/logout';
            
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = '_token';
            tokenInput.value = csrfToken;
            form.appendChild(tokenInput);
            
            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect on error
            window.location.href = '/login';
        }
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button 
                    className="block w-full text-left cursor-pointer flex items-center"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2" />
                    Log out
                </button>
            </DropdownMenuItem>
        </>
    );
}
