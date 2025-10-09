"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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

// UIC Graduate School Programs (sample)
const chartData = [
  { program: "MBA", students: 120 },
  { program: "MPA", students: 85 },
  { program: "MAEd", students: 60 },
  { program: "PhD Ed", students: 30 },
  { program: "MSCS", students: 45 },
  { program: "MSPharm", students: 25 },
  { program: "PhD Pharm", students: 10 },
]

const chartConfig = {
  students: {
    label: "Students",
    color: "var(--rose-500)",
  },
} satisfies ChartConfig

export function StudentsPerProgramBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Students per Program</CardTitle>
        <CardDescription>UIC Graduate School Programs</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} height={300}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="program"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="students" fill="var(--rose-500)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 3.8% this semester <TrendingUp className="h-4 w-4 text-rose-500" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total enrolled students per program
        </div>
      </CardFooter>
    </Card>
  )
}