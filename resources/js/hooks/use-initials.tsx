import { useCallback } from 'react';

export function useInitials() {
    return useCallback(
        (firstName?: string, middleInitial?: string, lastName?: string): string => {
            const first = (firstName ?? '').trim().charAt(0);
            const middle = (middleInitial ?? '').trim().charAt(0);
            const last = (lastName ?? '').trim().charAt(0);

            return `${first}${middle}${last}`.toUpperCase();
        },
        []
    );
}
