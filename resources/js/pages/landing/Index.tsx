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
                                    <li className="flex gap-2"><span className="text-orange-500">•</span> Secure authentication system</li>
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
