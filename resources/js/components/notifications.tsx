import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, CheckCircle, Info } from "lucide-react";
import type { Notification } from "@/types";
import { Link, router, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";

function getTimeAgo(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) === 1 ? "" : "s"} ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) === 1 ? "" : "s"} ago`;
    if (diff < 172800) return "Yesterday";
    if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString();
}

function groupNotifications(notifications: Notification[]) {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const earlier: Notification[] = [];
    const now = new Date();
    notifications.forEach(n => {
        const date = new Date(n.created_at);
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 1 && date.getDate() === now.getDate()) today.push(n);
        else if (diffDays < 2 && date.getDate() === now.getDate() - 1) yesterday.push(n);
        else earlier.push(n);
    });
    return { today, yesterday, earlier };
}

function getIcon(type?: string, read?: boolean) {
    if (type === "defense-request") return read ? <CheckCircle size={18} className="text-muted-foreground" /> : <Info size={18} className="text-rose-500" />;
    return <Bell size={18} className="text-muted-foreground" />;
}

export default function Notifications() {
    const [tab, setTab] = useState<"unread" | "read">("unread");
    const page = usePage<{ notifications?: Notification[]; unreadCount?: number }>();
    const [localNotifications, setLocalNotifications] = useState<Notification[]>(
        page.props.notifications || []
    );

    // Update when props change
    useEffect(() => {
        if (page.props.notifications) {
            setLocalNotifications(page.props.notifications);
        }
    }, [page.props.notifications]);

    const unread = localNotifications.filter(n => !n.read);
    const read = localNotifications.filter(n => n.read);

    const markAllAsRead = () => {
        setLocalNotifications(localNotifications.map(n => ({ ...n, read: true })));
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                router.reload({ only: ['notifications', 'unreadCount'] });
            }
        });
    };

    const handleNotificationClick = useCallback((notification: Notification, e: React.MouseEvent) => {
        if (notification.read || !notification.link) {
            return;
        }

        e.preventDefault();

        setLocalNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );

        router.post(`/notifications/${notification.id}/read`, {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                router.visit(notification.link!);
            }
        });
    }, []);

    const groupedUnread = groupNotifications(unread);
    const groupedRead = groupNotifications(read);

    // Reusable notification item component
    const NotificationItem = ({ notification }: { notification: Notification }) => (
        <Link
            href={notification.link ?? "#"}
            onClick={(e) => handleNotificationClick(notification, e)}
            className="flex items-start gap-2 px-3 py-3 border-b last:border-none hover:bg-muted/70 transition rounded-md"
            style={{ textDecoration: "none" }}
        >
            <div className="pt-1">{getIcon(notification.type, notification.read)}</div>
            <div className="flex-1">
                <div className="flex items-center gap-1">
                    <span className="font-medium text-xs">{notification.title}</span>
                </div>
                <div className="text-xs text-muted-foreground">{notification.message}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{getTimeAgo(notification.created_at)}</div>
            </div>
        </Link>
    );

    return (
        <div className="p-2 ">
            <Tabs value={tab} onValueChange={v => setTab(v as "unread" | "read")}>
                <TabsList className="w-full flex gap-2 mb-2">
                    <TabsTrigger value="unread">
                        Unread
                        {unread.length > 0 && (
                            <Badge variant="secondary" className="ml-2 rounded-full">{unread.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="read">
                        Read
                        {read.length > 0 && (
                            <Badge variant="outline" className="ml-2">{read.length}</Badge>
                        )}
                    </TabsTrigger>

                </TabsList>
                <TabsContent value="unread" className="p-1">
                    <div className="space-y-1">
                        {unread.length === 0 && (
                            <div className="text-center text-xs text-muted-foreground py-6">No unread notifications</div>
                        )}
                        {groupedUnread.today.length > 0 && (
                            <div>
                                <div className="text-[11px] font-semibold  flex justify-between items-center pl-1">
                                    <p className="text-muted-foreground mb-1">
                                        Today
                                    </p>
                                    {unread.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[11px] px-2 py-1 h-auto"
                                            type="button"
                                            onClick={markAllAsRead}
                                        >
                                            <CheckCheck className="w-3 h-3 mr-1" />
                                            Mark all as read
                                        </Button>
                                    )}
                                </div>
                                {groupedUnread.today.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        )}
                        {groupedUnread.yesterday.length > 0 && (
                            <div>
                                <div className="text-[11px] font-semibold text-muted-foreground mb-1 pl-1">Yesterday</div>
                                {groupedUnread.yesterday.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        )}
                        {groupedUnread.earlier.length > 0 && (
                            <div>
                                <div className="text-[11px] font-semibold text-muted-foreground mb-1 pl-1">Earlier</div>
                                {groupedUnread.earlier.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="read" className="p-1">
                    <div className="space-y-1">
                        {read.length === 0 && (
                            <div className="text-center text-xs text-muted-foreground py-6">No read notifications</div>
                        )}
                        {groupedRead.today.length > 0 && (
                            <div>
                                <div className="text-[11px] font-semibold text-muted-foreground mb-1 pl-1">Today</div>
                                {groupedRead.today.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        )}
                        {groupedRead.yesterday.length > 0 && (
                            <div>
                                <div className="text-[11px] font-semibold text-muted-foreground mb-1 pl-1">Yesterday</div>
                                {groupedRead.yesterday.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        )}
                        {groupedRead.earlier.length > 0 && (
                            <div>
                                <div className="text-[11px] font-semibold text-muted-foreground mb-1 pl-1">Earlier</div>
                                {groupedRead.earlier.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}