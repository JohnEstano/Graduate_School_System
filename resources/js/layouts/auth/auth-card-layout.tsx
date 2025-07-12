import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-3xl flex-col gap-6">
                <Card className="p-0 overflow-hidden shadow-lg">
                    <div className="flex flex-col md:flex-row h-full min-h-[300px]">
                        <div className="w-full p-2 md:w-1/2 bg-white dark:bg-zinc-900 flex flex-col">
                            <div className="flex-1 flex flex-col justify-center">
                                <CardHeader className="px-5 pt-8 pb-0 text-center md:text-center">
                                    <CardTitle className="text-xl font-extrabold text-black dark:text-white">{title}</CardTitle>
                                    <CardDescription className="text-muted-foreground dark:text-zinc-300">{description}</CardDescription>
                                </CardHeader>
                                <CardContent className="px-10 py-8">{children}</CardContent>
                            </div>
                        </div>
                        <div className="hidden md:block md:w-1/2">
                            <img
                                src="/grad_logo.png"
                                alt="Banner"
                                className="h-full w-full object-cover rounded-none rounded-tr-xl rounded-br-xl bg-zinc-200 dark:bg-zinc-800"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
