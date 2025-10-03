import { Head, Link, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export default function Landing() {
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-black">
            <Head title="Graduate School System" />
            <header className="w-full border-b border-slate-200/60 dark:border-neutral-800/70 backdrop-blur bg-white/70 dark:bg-neutral-900/60 sticky top-0">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 text-white font-bold flex items-center justify-center shadow-lg shadow-orange-500/30">GS</span>
                        <div className="leading-tight">
                            <p className="font-semibold text-slate-800 dark:text-neutral-100 text-sm tracking-wide">Graduate School System</p>
                            <p className="text-[11px] uppercase tracking-wider text-orange-600 dark:text-orange-400 font-medium">University Portal</p>
                        </div>
                    </div>
                    <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="px-4 py-2 rounded-md bg-slate-900 text-white dark:bg-orange-600 dark:hover:bg-orange-500 hover:bg-slate-700 transition font-medium text-xs">Dashboard</Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="px-4 py-2 rounded-md border border-slate-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 transition text-xs font-medium">Login</Link>
                                <Link href={route('register')} className="px-4 py-2 rounded-md bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow hover:shadow-md shadow-orange-500/30 text-xs font-semibold transition">Create Account</Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 opacity-60 dark:opacity-30 pointer-events-none" style={{background:"radial-gradient(circle at 30% 20%, rgba(251,146,60,0.25), transparent 60%), radial-gradient(circle at 80% 70%, rgba(244,63,94,0.25), transparent 55%)"}} />
                    <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-semibold leading-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                                Streamlined Graduate<br className="hidden md:block" /> Program Operations
                            </h1>
                            <p className="mt-5 text-sm md:text-base text-slate-600 dark:text-neutral-400 max-w-prose">
                                Manage defense requests, panelists, messaging, notifications and academic workflows in one secure, unified platform.
                                Built for coordinators, faculty, and graduate students.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {!auth.user && (
                                    <>
                                        <Link href={route('register')} className="px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 text-white font-semibold text-sm shadow hover:shadow-lg shadow-orange-500/30 transition">
                                            Create a User
                                        </Link>
                                        <Link href={route('login')} className="px-6 py-3 rounded-lg bg-white/70 backdrop-blur border border-slate-200 text-slate-700 font-medium text-sm hover:bg-white dark:bg-neutral-800/60 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800 transition">
                                            Sign In
                                        </Link>
                                        <Link href={route('google.redirect')} className="px-6 py-3 rounded-lg bg-white flex items-center gap-2 border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-700 transition">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3h8.5c-.3 2-2.3 6-8.5 6-5.2 0-9.5-4.3-9.5-9.5S6.8 1 12 1c3 0 5 1.3 6.2 2.5L20.5 1C18.3-.9 15.4-1 12-1 5.4-1 0 4.4 0 11s5.4 12 12 12c6.9 0 11.5-4.8 11.5-11.5 0-.8-.1-1.4-.2-2.1H12Z" /><path fill="#34A853" d="M1.7 6.7 4.9 9c1-2.4 3.3-4 6.1-4 1.8 0 3.4.6 4.6 1.7l3.4-3.4C16.9 1.1 14.6 0 11 0 6.4 0 2.5 2.6 1 6.2l.7.5Z" /><path fill="#FBBC05" d="M12 24c3.2 0 6.2-1.1 8.4-3.1l-3.9-3.2c-1.1.8-2.5 1.3-4.5 1.3-3.5 0-6.4-2.4-7.4-5.6l-3.8 2.9C2.3 21.4 6.8 24 12 24Z" /><path fill="#4285F4" d="M23.8 10.4H12v4.4h6.8c-.5 1.6-1.5 2.8-3 3.6l3.9 3.1c-2.3 2.1-5.3 3.3-8.7 3.3-5.2 0-9.7-2.6-11.4-7l3.8-2.9c.8 2.4 3.3 4.3 6.6 4.3 1.9 0 3.5-.6 4.5-1.3.8-.5 1.4-1.2 1.8-2.1.4-.9.6-1.8.6-2.7 0-.9-.2-1.7-.4-2.4Z" /></svg>
                                            Google Login
                                        </Link>
                                    </>
                                )}
                                {auth.user && (
                                    <Link href={route('dashboard')} className="px-6 py-3 rounded-lg bg-slate-900 text-white dark:bg-orange-600 dark:hover:bg-orange-500 font-semibold text-sm shadow transition">Go to Dashboard</Link>
                                )}
                            </div>
                            <div className="mt-10 grid gap-5 md:grid-cols-3 text-xs">
                                <div className="p-4 rounded-lg bg-white/70 backdrop-blur border border-slate-200 dark:bg-neutral-900/50 dark:border-neutral-800">
                                    <p className="font-semibold text-slate-800 dark:text-neutral-100 mb-1">Messaging</p>
                                    <p className="text-slate-600 dark:text-neutral-400">Real-time communication between students, panelists, and coordinators.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/70 backdrop-blur border border-slate-200 dark:bg-neutral-900/50 dark:border-neutral-800">
                                    <p className="font-semibold text-slate-800 dark:text-neutral-100 mb-1">Defense Tracking</p>
                                    <p className="text-slate-600 dark:text-neutral-400">Submit, monitor, and manage defense requests & statuses.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/70 backdrop-blur border border-slate-200 dark:bg-neutral-900/50 dark:border-neutral-800">
                                    <p className="font-semibold text-slate-800 dark:text-neutral-100 mb-1">Role-Based Access</p>
                                    <p className="text-slate-600 dark:text-neutral-400">Secure role separation for students, coordinators, and deans.</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative hidden md:block">
                            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-transparent blur-3xl" />
                            <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-sm shadow-xl p-6 space-y-4 max-w-md">
                                <h2 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-neutral-200">System Highlights</h2>
                                <ul className="space-y-3 text-xs text-slate-600 dark:text-neutral-400">
                                    <li className="flex gap-2"><span className="text-orange-500">•</span> Optimized PostgreSQL / MySQL support</li>
                                    <li className="flex gap-2"><span className="text-orange-500">•</span> Secure session & notification architecture</li>
                                    <li className="flex gap-2"><span className="text-orange-500">•</span> File submission & tracking flows</li>
                                    <li className="flex gap-2"><span className="text-orange-500">•</span> Real-time unread message count</li>
                                    <li className="flex gap-2"><span className="text-orange-500">•</span> Google SSO (institutional enforced)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="border-t border-slate-200 dark:border-neutral-800 py-6 text-center text-[11px] text-slate-500 dark:text-neutral-500">
                © {new Date().getFullYear()} Graduate School System. All rights reserved.
            </footer>
        </div>
    );
}
