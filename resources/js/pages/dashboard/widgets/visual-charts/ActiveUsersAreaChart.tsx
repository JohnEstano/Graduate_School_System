"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

// Dummy data for active users
const chartData = [
  { month: "January", students: 120, advisers: 30, panelists: 15 },
  { month: "February", students: 140, advisers: 32, panelists: 18 },
  { month: "March", students: 135, advisers: 31, panelists: 20 },
  { month: "April", students: 150, advisers: 35, panelists: 22 },
  { month: "May", students: 160, advisers: 36, panelists: 25 },
  { month: "June", students: 170, advisers: 38, panelists: 28 },
];

// Rose color config for chart
const chartConfig = {
  students: {
    label: "Students",
    color: "#e11d48", // rose-500
  },
  advisers: {
    label: "Advisers",
    color: "#fb7185", // rose-400
  },
  panelists: {
    label: "Panelists",
    color: "#fda4af", // rose-300
  },
} satisfies ChartConfig;

export default function ActiveUsersAreaChart() {
  return (
    <Card className="col-span-1 rounded-2xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
      <CardHeader className="px-6 pt-5 pb-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          Active Users
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-end w-full p-0">
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={chartData}
            margin={{ left: 12, right: 12, top: 12, bottom: 0 }}
            stackOffset="expand"
            height={90}
            width={340}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
              stroke="#e11d48"
              fontSize={12}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="panelists"
              type="natural"
              fill="#fda4af"
              fillOpacity={0.2}
              stroke="#fda4af"
              stackId="a"
              isAnimationActive={true}
              animationDuration={900}
            />
            <Area
              dataKey="advisers"
              type="natural"
              fill="#fb7185"
              fillOpacity={0.4}
              stroke="#fb7185"
              stackId="a"
              isAnimationActive={true}
              animationDuration={900}
            />
            <Area
              dataKey="students"
              type="natural"
              fill="#e11d48"
              fillOpacity={0.4}
              stroke="#e11d48"
              stackId="a"
              isAnimationActive={true}
              animationDuration={900}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}