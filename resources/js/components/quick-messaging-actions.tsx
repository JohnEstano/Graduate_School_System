import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { MessageSquare, Send, UserPlus, Users } from 'lucide-react';

export default function QuickMessagingActions() {
    return (
        <Card className="h-full p-4">
            <div className="mb-4 flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Quick Actions</h3>
            </div>

            <div className="space-y-3">
                <Link href="/messages" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Open Messages
                    </Button>
                </Link>

                <Link href="/messages?action=new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Send className="mr-2 h-4 w-4" />
                        New Message
                    </Button>
                </Link>

                <Link href="/messages?action=group" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <Users className="mr-2 h-4 w-4" />
                        Create Group
                    </Button>
                </Link>

                <Link href="/messages?action=contacts" className="block">
                    <Button variant="outline" className="w-full justify-start">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Find Contacts
                    </Button>
                </Link>
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                    💡 <strong>Tip:</strong> Use messaging to communicate with Adviser, coordinators, and fellow students about your academic
                    progress.
                </p>
            </div>
        </Card>
    );
}
