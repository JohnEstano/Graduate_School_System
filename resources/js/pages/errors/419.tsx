import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error419() {
    const handleRefresh = () => {
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Head title="Session Expired" />
            
            <div className="max-w-md w-full px-6 py-8 space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <AlertCircle className="w-12 h-12 text-destructive" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Session Expired</h1>
                    <p className="text-muted-foreground">
                        Your session has expired or the security token is invalid. 
                        This can happen when switching between login pages or after being idle for too long.
                    </p>
                </div>
                
                <div className="space-y-3">
                    <Button 
                        onClick={handleRefresh} 
                        className="w-full"
                        size="lg"
                    >
                        Go to Login
                    </Button>
                    
                    <p className="text-xs text-muted-foreground">
                        If this problem persists, try clearing your browser cache and cookies.
                    </p>
                </div>
            </div>
        </div>
    );
}
