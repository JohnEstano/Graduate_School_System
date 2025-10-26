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
  requests: {
    label: "Requests",
    color: "#e11d48",
  },
} satisfies ChartConfig

export function CoordinatorMostActivePrograms() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRequests, setTotalRequests] = useState(0)

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
        
        const scheduledApproved = requests.filter((r: any) => 
          r.workflow_state === 'coordinator-approved' || 
          r.scheduled_date !== null
        )

        setTotalRequests(scheduledApproved.length)

        const programCounts: Record<string, number> = {}
        
        scheduledApproved.forEach((request: any) => {
          const program = request.program || request.user?.program || 'Unknown Program'
          programCounts[program] = (programCounts[program] || 0) + 1
        })

        const formattedData = Object.entries(programCounts)
          .map(([program, count]) => ({
            program: program.length > 25 ? program.substring(0, 25) + '...' : program,
            requests: count,
          }))
          .sort((a, b) => b.requests - a.requests)
          .slice(0, 5)

        setChartData(formattedData)
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
      <Card>
        <CardHeader>
          <CardTitle>Most Active Programs</CardTitle>
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
      <Card>
        <CardHeader>
          <CardTitle>Most Active Programs</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">No scheduled or approved defense requests found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Active Programs</CardTitle>
        <CardDescription>Top 5 programs by defense requests</CardDescription>
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
            <XAxis dataKey="requests" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar 
              dataKey="requests" 
              fill="var(--color-requests)"
              radius={5}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Top program: {chartData[0].program} ({chartData[0].requests})
        </div>
      </CardFooter>
    </Card>
  )
}
