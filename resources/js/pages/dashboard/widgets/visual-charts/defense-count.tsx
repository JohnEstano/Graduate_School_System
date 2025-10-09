"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const chartData = [
	{ week: "Week 1", defenses: 5 },
	{ week: "Week 2", defenses: 8 },
	{ week: "Week 3", defenses: 12 },
	{ week: "Week 4", defenses: 7 },
	{ week: "Week 5", defenses: 15 },
];

export default function DefenseCountLineChart() {
	return (
		<Card className="col-span-1 rounded-2xl  shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
			<div className="flex items-center justify-between px-6 pt-5 ">
				<div className="text-sm font-medium text-muted-foreground">
					Total Defenses Scheduled
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="text-sm font-semibold px-3 py-1"
					type="button"
				>
					View More
				</Button>
			</div>
			<div className="px-6">
				<div className="text-3xl font-bold leading-tight">+2,350</div>
				<div className="text-sm  mt-1 mb-2 text-muted-foreground">
					+180.1% from last month
				</div>
			</div>
			<CardContent className="flex-1 flex items-end w-full p-0">
				<div className="w-full h-[90px]">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={chartData}
							margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="roseArea" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#e11d48" stopOpacity={0.16} />
									<stop offset="100%" stopColor="#e11d48" stopOpacity={0.06} />
								</linearGradient>
							</defs>
							<Area
								type="monotone"
								dataKey="defenses"
								stroke="#e11d48"
								fill="url(#roseArea)"
								strokeWidth={3}
								dot={false}
								isAnimationActive={true}
								animationDuration={900}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}