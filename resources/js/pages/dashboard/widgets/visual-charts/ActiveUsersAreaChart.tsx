"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Dummy data for assigned users
const chartData = [
  { month: "January", students: 100, advisers: 25, panelists: 10 },
  { month: "February", students: 120, advisers: 28, panelists: 12 },
  { month: "March", students: 130, advisers: 30, panelists: 15 },
  { month: "April", students: 140, advisers: 32, panelists: 18 },
  { month: "May", students: 150, advisers: 34, panelists: 20 },
  { month: "June", students: 160, advisers: 36, panelists: 22 },
];

// Rose theme colors
const chartConfig = {
  students: {
    label: "Assigned Students",
    color: "#f43f5e", // rose-500
  },
  advisers: {
    label: "Assigned Advisers",
    color: "#fb7185", // rose-400
  },
  panelists: {
    label: "Assigned Panelists",
    color: "#fda4af", // rose-300
  },
} satisfies ChartConfig;

export default function ActiveAssignedUsersAreaChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Assigned Users</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
            stackOffset="expand"
            height={180}
            width={340}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="panelists"
              type="natural"
              fill="#fda4af"
              fillOpacity={0.2}
              stroke="#fda4af"
              stackId="a"
            />
            <Area
              dataKey="advisers"
              type="natural"
              fill="#fb7185"
              fillOpacity={0.4}
              stroke="#fb7185"
              stackId="a"
            />
            <Area
              dataKey="students"
              type="natural"
              fill="#f43f5e"
              fillOpacity={0.4}
              stroke="#f43f5e"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}