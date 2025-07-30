import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare,
    Send,
    Users,
    Plus
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface UnreadMessage {
    id: number;
    conversation_id: number;
    conversation_title: string;
    sender_name: string;
    content: string;
    created_at: string;
}

export default function MessagingWidget() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<UnreadMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUnreadMessages();
        // Poll for new messages every 30 seconds
        const interval = setInterval(fetchUnreadMessages, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadMessages = async () => {
        try {
            const response = await fetch('/messages/unread-count');
            const data = await response.json();
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to fetch unread messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Messages</h3>
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
                <Link href="/messages">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </Link>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                ) : unreadCount === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No new messages</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-600">
                                You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}

                <div className="flex justify-center">
                    <Link href="/messages">
                        <Button className="w-full">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Open Messages
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
}
