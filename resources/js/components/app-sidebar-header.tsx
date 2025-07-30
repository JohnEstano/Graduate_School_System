import { useState, useRef, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Bell } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const testNotifications = [
	{
		id: 1,
		title: 'Defense Scheduled',
		description: 'Your thesis defense is set for July 31, 2025.',
	},
	{
		id: 2,
		title: 'Panel Approved',
		description: 'Panel members have approved your defense request.',
	},
	{
		id: 3,
		title: 'Reminder',
		description: 'Upload your revised manuscript before August 1.',
	},
];

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
		const [open, setOpen] = useState(false);
		const dropdownRef = useRef<HTMLDivElement>(null);
		const bellBtnRef = useRef<HTMLButtonElement>(null);

		useEffect(() => {
				function handleClick(e: MouseEvent) {
						
						if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
						
						if (bellBtnRef.current && bellBtnRef.current.contains(e.target as Node)) return;
						setOpen(false);
				}
				if (open) {
						document.addEventListener('mousedown', handleClick);
				}
				return () => {
						document.removeEventListener('mousedown', handleClick);
				};
		}, [open]);

		return (
				<header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 relative">
						<div className="flex flex-1 items-center justify-between">
								<div className="flex items-center gap-2">
										<SidebarTrigger className="ml-1" />
										<Breadcrumbs breadcrumbs={breadcrumbs} />
								</div>

								<div className="mr-5 relative">
										<button
												ref={bellBtnRef}
												type="button"
												className="relative p-2 hover:bg-accent rounded-full transition-colors duration-200 focus:outline-none"
												onClick={() => setOpen((v) => !v)} 
												aria-label="Show notifications"
										>
												<Bell className="size-5 stroke-[1.5]" />
										</button>
										{open && (
												<div
														ref={dropdownRef}
														className="absolute right-0 mt-2 w-80 h-100 bg-white border rounded-lg shadow-lg z-50 flex flex-col"
												>
														<div className="px-4 py-2 border-b font-semibold text-sm">Notifications</div>
														<div className="flex-1 overflow-y-auto p-2 space-y-2">
																{testNotifications.map((notif) => (
																		<button
																				key={notif.id}
																				className="w-full text-left rounded transition-colors p-0 hover:bg-accent focus:bg-accent"
																				tabIndex={0}
																				onClick={() => {/* open dialog logic here */}}
																		>
																				<Alert className="bg-white border p-2 pointer-events-none">
																						<AlertTitle className="text-xs font-semibold">{notif.title}</AlertTitle>
																						<AlertDescription className="text-[11px]">{notif.description}</AlertDescription>
																				</Alert>
																		</button>
																))}
														</div>
														<div className="px-4 py-3 border-t flex justify-end">
																<button
																		className="text-xs font-medium text-rose-500 hover:underline px-2 py-1 rounded transition"
																		onClick={() => {/* handle view all action */}}
																>
																		View all
																</button>
														</div>
												</div>
										)}
								</div>
						</div>
				</header>
		);
}
