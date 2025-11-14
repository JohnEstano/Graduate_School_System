"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"

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

const chartConfig = {
  defenses: {
    label: "Defenses",
    color: "#e11d48",
  },
} satisfies ChartConfig

export function OverallProgramActivity() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPrograms, setTotalPrograms] = useState(0)

  useEffect(() => {
    fetch('/defense-requests', {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        const requests = Array.isArray(data) ? data : (data.defenseRequests ?? [])
        
        const programCounts: Record<string, number> = {}
        
        requests.forEach((request: any) => {
          const program = request.program || request.user?.program || 'Unknown Program'
          programCounts[program] = (programCounts[program] || 0) + 1
        })

        const formattedData = Object.entries(programCounts)
          .map(([program, count]) => ({
            program: program.length > 30 ? program.substring(0, 30) + '...' : program,
            defenses: count,
          }))
          .sort((a, b) => b.defenses - a.defenses)
          .slice(0, 8)

        setChartData(formattedData)
        setTotalPrograms(Object.keys(programCounts).length)
      })
      .catch((error) => {
        console.error('Error fetching defense requests:', error)
        setChartData([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Card className="rounded-xl shadow-none border">
        <CardHeader>
          <CardTitle>Program Activity Overview</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="rounded-xl shadow-none border">
        <CardHeader>
          <CardTitle>Program Activity Overview</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">No defense requests found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-none border">
      <CardHeader>
        <CardTitle>Program Activity Overview</CardTitle>
        <CardDescription>Defense requests across all programs</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="program"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <XAxis dataKey="defenses" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar 
              dataKey="defenses" 
              fill="var(--color-defenses)"
              radius={5}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {totalPrograms} total programs active
        </div>
      </CardFooter>
    </Card>
  )
}
