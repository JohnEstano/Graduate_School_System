import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
                <Card className="overflow-hidden p-0 shadow-lg">
                    <div className="flex h-full min-h-[300px] flex-col md:flex-row">
                        <div className="flex w-full flex-col bg-white p-2 md:w-1/2 dark:bg-zinc-900">
                            <div className="flex flex-1 flex-col justify-center">
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
                                className="h-full w-full rounded-none rounded-tr-xl rounded-br-xl bg-zinc-200 object-cover dark:bg-zinc-800"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
