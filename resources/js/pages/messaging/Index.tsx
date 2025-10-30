import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserSearch from '@/components/user-search';
import { 
    Send, 
    Plus, 
    Search,
    MessageSquare,
    Users,
    MoreVertical,
    Phone,
    Video,
    Paperclip,
    Smile
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Messages',
        href: '/messages',
    },
];

interface User {
    id: number;
    name: string;
    role: string;
    email?: string;
    avatar?: string;
}

interface Participant {
    id: number;
    name: string;
    role: string;
    avatar?: string;
}

interface Message {
    id: number;
    content: string;
    type: string;
    user: {
        id: number;
        name: string;
        role: string;
    };
    is_own: boolean;
    created_at: string;
    formatted_time: string;
    formatted_date: string;
}

interface Conversation {
    id: number;
    type: string;
    title: string;
    participants: Participant[];
    latest_message?: {
        content: string;
        user_name: string;
        created_at: string;
        formatted_time: string;
    };
    unread_count: number;
    last_message_at: string;
}

interface Props extends Record<string, unknown> {
    conversations: Conversation[];
    users: User[];
}

export default function MessagingIndex() {
    const { conversations: initialConversations, users } = usePage<Props>().props;
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newConversationOpen, setNewConversationOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [conversationType, setConversationType] = useState<'private' | 'group'>('private');
    const [groupTitle, setGroupTitle] = useState('');
    const [initialMessage, setInitialMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async (conversationId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/messages/conversations/${conversationId}/messages`);
            const data = await response.json();
            setMessages(data.messages);
            
            // Update conversation as read
            setConversations(prev => 
                prev.map(conv => 
                    conv.id === conversationId 
                        ? { ...conv, unread_count: 0 }
                        : conv
                )
            );
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const response = await fetch('/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    conversation_id: selectedConversation.id,
                    content: newMessage,
                    type: 'text',
                }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, data.message]);
            setNewMessage('');
            
            // Update conversation list
            setConversations(prev => 
                prev.map(conv => 
                    conv.id === selectedConversation.id 
                        ? { 
                            ...conv, 
                            latest_message: {
                                content: data.message.content,
                                user_name: data.message.user.name,
                                created_at: data.message.created_at,
                                formatted_time: data.message.formatted_time,
                            },
                            last_message_at: data.message.created_at
                        }
                        : conv
                ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
            );
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const createConversation = async () => {
        if (!initialMessage.trim() || selectedUsers.length === 0) return;

        try {
            const response = await fetch('/messages/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    participants: selectedUsers,
                    message: initialMessage,
                    type: conversationType,
                    title: conversationType === 'group' ? groupTitle : null,
                }),
            });

            const data = await response.json();
            
            if (data.exists) {
                // Conversation already exists, just select it
                const existingConv = conversations.find(c => c.id === data.conversation_id);
                if (existingConv) {
                    setSelectedConversation(existingConv);
                    loadMessages(existingConv.id);
                }
            } else {
                // Refresh conversations list
                window.location.reload();
            }

            setNewConversationOpen(false);
            setSelectedUsers([]);
            setInitialMessage('');
            setGroupTitle('');
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleUserSelect = (user: User) => {
        if (conversationType === 'private') {
            setSelectedUsers([user.id]);
        } else {
            setSelectedUsers(prev => 
                prev.includes(user.id)
                    ? prev.filter(id => id !== user.id)
                    : [...prev, user.id]
            );
        }
    };

    const handleRemoveUser = (userId: number) => {
        setSelectedUsers(prev => prev.filter(id => id !== userId));
    };

    const filteredConversations = conversations.filter(conversation =>
        conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const formatMessageTime = (date: string) => {
        return new Date(date).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const isNewDate = (currentMessage: Message, previousMessage: Message | null) => {
        if (!previousMessage) return true;
        return currentMessage.formatted_date !== previousMessage.formatted_date;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Messages" />
            
            <div className="h-full flex-1 flex-col gap-4 overflow-hidden rounded-xl">
                <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-700 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-80 border-r dark:border-zinc-700 flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Messages</h2>
                                <Dialog open={newConversationOpen} onOpenChange={setNewConversationOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="h-8 w-8 p-0">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Start New Conversation</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium">Type</label>
                                                <Select value={conversationType} onValueChange={(value: 'private' | 'group') => setConversationType(value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="private">Private</SelectItem>
                                                        <SelectItem value="group">Group</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {conversationType === 'group' && (
                                                <div>
                                                    <label className="text-sm font-medium">Group Title</label>
                                                    <Input
                                                        value={groupTitle}
                                                        onChange={(e) => setGroupTitle(e.target.value)}
                                                        placeholder="Enter group title"
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    {conversationType === 'private' ? 'Select User' : 'Select Users'}
                                                </label>
                                                <UserSearch
                                                    selectedUsers={selectedUsers}
                                                    onUserSelect={handleUserSelect}
                                                    onUserRemove={handleRemoveUser}
                                                    conversationType={conversationType}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium">Initial Message</label>
                                                <Input
                                                    value={initialMessage}
                                                    onChange={(e) => setInitialMessage(e.target.value)}
                                                    placeholder="Type your message..."
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" onClick={() => {
                                                    setNewConversationOpen(false);
                                                    setSelectedUsers([]);
                                                    setInitialMessage('');
                                                    setGroupTitle('');
                                                }}>
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    onClick={createConversation}
                                                    disabled={selectedUsers.length === 0 || !initialMessage.trim()}
                                                >
                                                    Start Conversation
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search conversations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredConversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    {searchTerm ? 'No conversations found' : 'No conversations yet'}
                                </div>
                            ) : (
                                filteredConversations.map(conversation => (
                                    <div
                                        key={conversation.id}
                                        onClick={() => {
                                            setSelectedConversation(conversation);
                                            loadMessages(conversation.id);
                                        }}
                                        className={cn(
                                            "p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                                            selectedConversation?.id === conversation.id && "bg-blue-50 border-blue-200"
                                        )}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="relative">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>
                                                        {conversation.type === 'group' ? (
                                                            <Users className="h-5 w-5" />
                                                        ) : (
                                                            getInitials(conversation.participants[0]?.name || 'U')
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {conversation.unread_count > 0 && (
                                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                                                        {conversation.unread_count}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                                        {conversation.title}
                                                    </h3>
                                                    {conversation.latest_message && (
                                                        <span className="text-xs text-gray-500">
                                                            {conversation.latest_message.formatted_time}
                                                        </span>
                                                    )}
                                                </div>
                                                {conversation.latest_message && (
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {conversation.latest_message.user_name}: {conversation.latest_message.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b dark:border-zinc-700 bg-white dark:bg-zinc-900">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback>
                                                    {selectedConversation.type === 'group' ? (
                                                        <Users className="h-5 w-5" />
                                                    ) : (
                                                        getInitials(selectedConversation.participants[0]?.name || 'U')
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold">{selectedConversation.title}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {selectedConversation.type === 'group' 
                                                        ? `${selectedConversation.participants.length} members`
                                                        : selectedConversation.participants[0]?.role
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="ghost" size="sm">
                                                <Phone className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <Video className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {isLoading ? (
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        messages.map((message, index) => {
                                            const previousMessage = index > 0 ? messages[index - 1] : null;
                                            const showDate = isNewDate(message, previousMessage);
                                            
                                            return (
                                                <div key={message.id}>
                                                    {showDate && (
                                                        <div className="flex justify-center my-4">
                                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                                                                {message.formatted_date}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={cn(
                                                            "flex",
                                                            message.is_own ? "justify-end" : "justify-start"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                                                                message.is_own
                                                                    ? "bg-blue-600 text-white"
                                                                    : "bg-gray-100 text-gray-900"
                                                            )}
                                                        >
                                                            {!message.is_own && selectedConversation.type === 'group' && (
                                                                <p className="text-xs font-medium mb-1 opacity-70">
                                                                    {message.user.name}
                                                                </p>
                                                            )}
                                                            <p className="text-sm">{message.content}</p>
                                                            <p
                                                                className={cn(
                                                                    "text-xs mt-1",
                                                                    message.is_own ? "text-blue-100" : "text-gray-500"
                                                                )}
                                                            >
                                                                {message.formatted_time}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t dark:border-zinc-700 bg-white dark:bg-zinc-900">
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" size="sm">
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                        <div className="flex-1 relative">
                                            <Input
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        sendMessage();
                                                    }
                                                }}
                                                className="pr-10"
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="absolute right-1 top-1 h-8 w-8 p-0"
                                            >
                                                <Smile className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button 
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim()}
                                            size="sm"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* No conversation selected */
                            <div className="flex-1 flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Select a conversation
                                    </h3>
                                    <p className="text-gray-500">
                                        Choose a conversation from the sidebar to start messaging
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
