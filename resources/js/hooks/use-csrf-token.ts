import { useCallback, useEffect, useRef } from 'react';
import { refreshCSRFToken } from '@/lib/axios';

/**
 * Custom hook for CSRF token management
 * 
 * Features:
 * - Auto-refreshes token on component mount
 * - Provides manual refresh function
 * - Handles token refresh on page visibility change
 * - Prevents multiple simultaneous refreshes
 * 
 * @param options Configuration options
 * @returns Object with refresh function and loading state
 */
export function useCSRFToken(options: {
    refreshOnMount?: boolean;
    refreshOnVisibilityChange?: boolean;
} = {}) {
    const {
        refreshOnMount = false,
        refreshOnVisibilityChange = true,
    } = options;

    const isRefreshing = useRef(false);

    // Manual refresh function
    const refresh = useCallback(async () => {
        if (isRefreshing.current) {
            console.log('CSRF token refresh already in progress');
            return;
        }

        isRefreshing.current = true;
        try {
            await refreshCSRFToken();
            console.log('✓ CSRF token refreshed via hook');
        } catch (error) {
            console.error('✗ Failed to refresh CSRF token via hook:', error);
            throw error;
        } finally {
            isRefreshing.current = false;
        }
    }, []);

    // Refresh on mount if requested
    useEffect(() => {
        if (refreshOnMount) {
            refresh();
        }
    }, [refreshOnMount, refresh]);

    // Refresh on visibility change
    useEffect(() => {
        if (!refreshOnVisibilityChange) return;

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('Page became visible - refreshing CSRF token');
                refresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [refreshOnVisibilityChange, refresh]);

    return {
        refresh,
        isRefreshing: isRefreshing.current,
    };
}

/**
 * Hook that auto-refreshes CSRF token before making form submissions
 * Use this in forms that might be open for a long time
 * 
 * @example
 * const { beforeSubmit } = useCSRFProtection();
 * 
 * const handleSubmit = async (data) => {
 *   await beforeSubmit(); // Refresh token before submitting
 *   // ... submit form
 * };
 */
export function useCSRFProtection() {
    const { refresh } = useCSRFToken();

    const beforeSubmit = useCallback(async () => {
        console.log('Ensuring fresh CSRF token before submission...');
        await refresh();
    }, [refresh]);

    return {
        beforeSubmit,
        refreshToken: refresh,
    };
}
