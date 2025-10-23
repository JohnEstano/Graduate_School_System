import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { router, usePage } from '@inertiajs/react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { Notification } from '@/types';

// Initialize Echo globally once
if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
    
    if (!(window as any).Echo) {
        (window as any).Echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
            wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
            wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
            forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
            disableStats: true,
        });
    }
}

const echo = typeof window !== 'undefined' ? (window as any).Echo : null;

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (notificationId: number) => void;
    markAllAsRead: () => void;
    refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const page = usePage<{ notifications?: Notification[]; unreadCount?: number; auth?: { user?: { id?: number } } }>();
    const userId = page.props.auth?.user?.id;

    const [notifications, setNotifications] = useState<Notification[]>(
        page.props.notifications || []
    );
    const [unreadCount, setUnreadCount] = useState<number>(
        page.props.unreadCount || 0
    );

    // Update local state when props change (from server)
    useEffect(() => {
        if (page.props.notifications) {
            setNotifications(page.props.notifications);
        }
        if (typeof page.props.unreadCount === 'number') {
            setUnreadCount(page.props.unreadCount);
        }
    }, [page.props.notifications, page.props.unreadCount]);

    // Listen for real-time notification events
    useEffect(() => {
        if (!userId) return;

        const channel = echo.channel(`user.${userId}`);
        
        channel.listen('.NotificationCreated', (event: { notification: Notification }) => {
            const newNotification = event.notification;
            
            // Add new notification to the list
            setNotifications(prev => [newNotification, ...prev]);
            
            // Update unread count if the notification is unread
            if (!newNotification.read) {
                setUnreadCount(prev => prev + 1);
            }

            // Optionally reload props to sync with server
            router.reload({ only: ['notifications', 'unreadCount'] });
        });

        return () => {
            channel.stopListening('.NotificationCreated');
            echo.leave(`user.${userId}`);
        };
    }, [userId]);

    const markAsRead = (notificationId: number) => {
        // Optimistically update UI
        setNotifications(prev =>
            prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Send request to server
        router.post(`/notifications/${notificationId}/read`, {}, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                // Revert on error
                refreshNotifications();
            }
        });
    };

    const markAllAsRead = () => {
        // Optimistically update UI
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        // Send request to server
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                router.reload({ only: ['notifications', 'unreadCount'] });
            },
            onError: () => {
                // Revert on error
                refreshNotifications();
            }
        });
    };

    const refreshNotifications = () => {
        router.reload({ only: ['notifications', 'unreadCount'] });
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                refreshNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
