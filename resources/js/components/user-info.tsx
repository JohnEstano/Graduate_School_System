import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function getInitials(user: any) {
    const first = user?.first_name?.[0] ?? '';
    const last = user?.last_name?.[0] ?? '';
    return (first + last).toUpperCase() || 'U';
}

export function UserInfo({ user }: { user: any }) {
    if (!user) return null;
    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
                <AvatarFallback className="text-lg font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                    {getInitials(user)}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold">{user.first_name} {user.last_name}</span>
                <span className="text-xs text-muted-foreground">{user.school_id}</span>
            </div>
        </div>
    );
}
