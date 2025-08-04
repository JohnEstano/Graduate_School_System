import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Expect defenseRequests prop from parent (Index.tsx)
import { type DefenseRequestSummary } from "./show-all-requests";

type HonorariumProps = {
	defenseRequests: DefenseRequestSummary[];
};

export default function ShowAllHonorarium({ defenseRequests }: HonorariumProps) {
	const [search, setSearch] = useState("");

	// Dynamically filter approved requests by search
	const approved = useMemo(
		() =>
			(defenseRequests || []).filter(
				(r) =>
					r.status === "Approved" &&
					r.thesis_title.toLowerCase().includes(search.toLowerCase())
			),
		[defenseRequests, search]
	);

	// Show only first 8 cards for now (for demo, adjust as needed)
	const cardsToShow = approved.slice(0, 8);

	return (
		<div className="h-screen p-4 flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between px-2 pt-2">
				<div className="flex flex-1 items-center gap-2">
					<div className="relative">
						<Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search honorarium..."
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
							className="pl-8 h-10 text-base w-[400px]"
						/>
					</div>
				</div>
			</div>
			<Separator className="mb-2 mt-2" />
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-2">
				{cardsToShow.length === 0 ? (
					<div className="col-span-4 text-center text-muted-foreground py-12">
						<span className="text-lg font-medium">
							No approved honorarium requests found.
						</span>
					</div>
				) : (
					cardsToShow.map((r) => (
						<Card
							key={r.id}
							className="p-4 shadow-none flex flex-col  items-start h-28 w-full"
						>
							<CardContent className="flex flex-col  p-0 w-full">
								<span
									className="text-xs font-semibold text-start line-clamp-2 w-full"
									title={r.thesis_title}
								>
									{r.thesis_title.length > 20
										? r.thesis_title.slice(0, 57) + "..."
										: r.thesis_title}
								</span>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}