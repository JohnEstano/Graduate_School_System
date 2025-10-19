"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Dot, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Data: Total number of students per school year, with rose gradient per point
const chartData = [
  { year: "2019-20", students: 320, fill: "#fb7185" }, // rose-400
  { year: "2020-21", students: 340, fill: "#f43f5e" }, // rose-500
  { year: "2021-22", students: 370, fill: "#e11d48" }, // rose-600
  { year: "2022-23", students: 410, fill: "#be123c" }, // rose-700
  { year: "2023-24", students: 455, fill: "#9f1239" }, // rose-800
]

const chartConfig = {
  students: {
    label: "Students",
    color: "#f43f5e", // rose-500 for the line
  },
} satisfies ChartConfig

export function NumberOfStudentsLineChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Number of Students</CardTitle>
        <CardDescription>Per School Year</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            data={chartData}
            height={300}
            margin={{
              top: 24,
              left: 24,
              right: 24,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  nameKey="students"
                  hideLabel
                />
              }
            />
            <Line
              dataKey="students"
              type="monotone"
              stroke="#f43f5e"
              strokeWidth={3}
              isAnimationActive={true}
              dot={({ payload, ...props }) => (
                <Dot
                  key={payload.year}
                  r={6}
                  cx={props.cx}
                  cy={props.cy}
                  fill={payload.fill}
                  stroke={payload.fill}
                />
              )}
              activeDot={{
                stroke: "#be123c",
                fill: "#be123c",
                r: 8,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 10.9% this year{" "}
          <TrendingUp className="h-4 w-4 text-rose-500" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total enrolled students per school year
        </div>
      </CardFooter>
    </Card>
  )
}