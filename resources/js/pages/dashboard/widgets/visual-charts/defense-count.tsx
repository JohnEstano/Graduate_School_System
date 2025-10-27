"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useEffect, useState } from "react";

export default function DefenseCountLineChart() {
	const [period, setPeriod] = useState("month");
	const [chartData, setChartData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalDefenses, setTotalDefenses] = useState(0);
	const [percentageChange, setPercentageChange] = useState(0);

	useEffect(() => {
		fetch('/defense-requests', {
			headers: { 'Accept': 'application/json' }
		})
			.then(res => {
				if (!res.ok) throw new Error('Failed to fetch');
				return res.json();
			})
			.then((data) => {
				const requests = Array.isArray(data) ? data : (data.defenseRequests ?? []);
				const scheduled = requests.filter((r: any) => r.scheduled_date !== null);
				setTotalDefenses(scheduled.length);

				let formattedData: any[] = [];

				if (period === "week") {
					const weekCounts: Record<string, number> = {};
					const now = new Date();
					const fourWeeksAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));
					
					scheduled.forEach((request: any) => {
						const date = new Date(request.scheduled_date);
						if (date >= fourWeeksAgo) {
							const weekNum = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
							const weekLabel = `Week ${4 - weekNum}`;
							weekCounts[weekLabel] = (weekCounts[weekLabel] || 0) + 1;
						}
					});

					formattedData = Array.from({ length: 4 }, (_, i) => ({
						label: `Week ${i + 1}`,
						defenses: weekCounts[`Week ${i + 1}`] || 0
					}));
				} else if (period === "month") {
					const monthCounts: Record<string, number> = {};
					
					scheduled.forEach((request: any) => {
						const date = new Date(request.scheduled_date);
						const monthYear = date.toLocaleDateString('en-US', { month: 'short' });
						monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
					});

					const sortedMonths = Object.keys(monthCounts).slice(-6);
					formattedData = sortedMonths.map((month) => ({
						label: month,
						defenses: monthCounts[month]
					}));
				} else if (period === "year") {
					const yearCounts: Record<string, number> = {};
					
					scheduled.forEach((request: any) => {
						const date = new Date(request.scheduled_date);
						const year = date.getFullYear().toString();
						yearCounts[year] = (yearCounts[year] || 0) + 1;
					});

					formattedData = Object.entries(yearCounts)
						.sort(([a], [b]) => a.localeCompare(b))
						.slice(-5)
						.map(([year, count]) => ({
							label: year,
							defenses: count
						}));
				}

				setChartData(formattedData);

				if (formattedData.length > 1) {
					const latest = formattedData[formattedData.length - 1].defenses;
					const previous = formattedData[formattedData.length - 2].defenses;
					const change = previous > 0 ? (((latest - previous) / previous) * 100) : 0;
					setPercentageChange(Number(change.toFixed(1)));
				}
			})
			.catch((error) => {
				console.error('Error fetching defense requests:', error);
				setChartData([]);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [period]);

	return (
		<Card className="col-span-1 rounded-xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
			<div className="flex items-center justify-between px-6 pt-5">
				<div className="text-sm font-medium text-muted-foreground">
					Total Defenses Scheduled
				</div>
				<Select value={period} onValueChange={setPeriod}>
					<SelectTrigger className="w-[120px] h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="week">Weekly</SelectItem>
						<SelectItem value="month">Monthly</SelectItem>
						<SelectItem value="year">Yearly</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="px-6">
				<div className="text-3xl font-bold leading-tight">{totalDefenses}</div>
				<div className="text-sm mt-1 mb-2 text-muted-foreground">
					{percentageChange >= 0 ? '+' : ''}{percentageChange}% from previous period
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
								strokeWidth={2}
								dot={{ fill: "#e11d48", r: 3 }}
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