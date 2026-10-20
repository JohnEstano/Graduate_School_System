import type { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Landing() {
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-black">
            <Head title="Graduate School System" />
            <header className="sticky top-0 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/60">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 font-bold text-white shadow-lg shadow-orange-500/30">
                            GS
                        </span>
                        <div className="leading-tight">
                            <p className="text-sm font-semibold tracking-wide text-slate-800 dark:text-neutral-100">Graduate School System</p>
                            <p className="text-[11px] font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400">University Portal</p>
                        </div>
                    </div>
                    <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700 dark:bg-orange-600 dark:hover:bg-orange-500"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-white dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                >
                                    Login
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-md bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2 text-xs font-semibold text-white shadow shadow-orange-500/30 transition hover:shadow-md"
                                >
                                    Create Account
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            <main className="flex-1">
                <section className="relative overflow-hidden">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30"
                        style={{
                            background:
                                'radial-gradient(circle at 30% 20%, rgba(251,146,60,0.25), transparent 60%), radial-gradient(circle at 80% 70%, rgba(244,63,94,0.25), transparent 55%)',
                        }}
                    />
                    <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
                        <div>
                            <h1 className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-3xl leading-tight font-semibold text-transparent md:text-5xl dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-400">
                                Streamlined Graduate
                                <br className="hidden md:block" /> Program Operations
                            </h1>
                            <p className="mt-5 max-w-prose text-sm text-slate-600 md:text-base dark:text-neutral-400">
                                Manage defense requests, panelists, messaging, notifications and academic workflows in one secure, unified platform.
                                Built for coordinators, Adviser, and graduate students.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {!auth.user && (
                                    <>
                                        <Link
                                            href={route('register')}
                                            className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 px-6 py-3 text-sm font-semibold text-white shadow shadow-orange-500/30 transition hover:shadow-lg"
                                        >
                                            Create a User
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="rounded-lg border border-slate-200 bg-white/70 px-6 py-3 text-sm font-medium text-slate-700 backdrop-blur transition hover:bg-white dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-100 dark:hover:bg-neutral-800"
                                        >
                                            Sign In
                                        </Link>
                                    </>
                                )}
                                {auth.user && (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition dark:bg-orange-600 dark:hover:bg-orange-500"
                                    >
                                        Go to Dashboard
                                    </Link>
                                )}
                            </div>
                            <div className="mt-10 grid gap-5 text-xs md:grid-cols-3">
                                <div className="rounded-lg border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <p className="mb-1 font-semibold text-slate-800 dark:text-neutral-100">Messaging</p>
                                    <p className="text-slate-600 dark:text-neutral-400">
                                        Real-time communication between students, panelists, and coordinators.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <p className="mb-1 font-semibold text-slate-800 dark:text-neutral-100">Defense Tracking</p>
                                    <p className="text-slate-600 dark:text-neutral-400">Submit, monitor, and manage defense requests & statuses.</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <p className="mb-1 font-semibold text-slate-800 dark:text-neutral-100">Role-Based Access</p>
                                    <p className="text-slate-600 dark:text-neutral-400">
                                        Secure role separation for students, coordinators, and deans.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative hidden md:block">
                            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-transparent blur-3xl" />
                            <div className="max-w-md space-y-4 rounded-xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/60">
                                <h2 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-neutral-200">System Highlights</h2>
                                <ul className="space-y-3 text-xs text-slate-600 dark:text-neutral-400">
                                    <li className="flex gap-2">
                                        <span className="text-orange-500">•</span> Optimized PostgreSQL / MySQL support
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-orange-500">•</span> Secure session & notification architecture
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-orange-500">•</span> File submission & tracking flows
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-orange-500">•</span> Real-time unread message count
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-orange-500">•</span> Secure authentication system
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="border-t border-slate-200 py-6 text-center text-[11px] text-slate-500 dark:border-neutral-800 dark:text-neutral-500">
                © {new Date().getFullYear()} Graduate School System. All rights reserved.
            </footer>
        </div>
    );
}
