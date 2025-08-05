import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
    MessageSquare,
    Users,
    Send,
    UserPlus
} from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function QuickMessagingActions() {
    return (
        <Card className="p-4 h-full">
            <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Quick Actions</h3>
            </div>

            <div className="space-y-3">
                <Link href="/messages" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Open Messages
                    </Button>
                </Link>

                <Link href="/messages?action=new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Send className="h-4 w-4 mr-2" />
                        New Message
                    </Button>
                </Link>

                <Link href="/messages?action=group" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Create Group
                    </Button>
                </Link>

                <Link href="/messages?action=contacts" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Find Contacts
                    </Button>
                </Link>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                    💡 <strong>Tip:</strong> Use messaging to communicate with faculty, 
                    coordinators, and fellow students about your academic progress.
                </p>
            </div>
        </Card>
    );
}
