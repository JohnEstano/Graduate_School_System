"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts"
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
    label: "Defense Requests",
    color: "#e11d48",
  },
} satisfies ChartConfig

export function CoordinatorMostActivePrograms() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRequests, setTotalRequests] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)

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
            program: program.length > 40 ? program.substring(0, 40) + '...' : program,
            requests: count,
            fill: "#e11d48",
          }))
          .sort((a, b) => b.requests - a.requests)
          .slice(0, 8)

        setChartData(formattedData)
        // Set the highest value as active
        if (formattedData.length > 0) {
          setActiveIndex(0)
        }
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
      <Card className="rounded-xl shadow-none border">
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
    <Card className="rounded-xl shadow-none border">
      <CardHeader>
        <CardTitle>Most Active Programs</CardTitle>
        <CardDescription>Top programs by defense requests</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px]">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="program"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="requests"
              strokeWidth={2}
              radius={8}
              activeIndex={activeIndex}
              activeBar={({ ...props }) => {
                return (
                  <Rectangle
                    {...props}
                    fillOpacity={0.8}
                    stroke={props.payload.fill}
                    strokeDasharray={4}
                    strokeDashoffset={4}
                  />
                )
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by {((chartData[0].requests / totalRequests) * 100).toFixed(1)}% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Top program: {chartData[0].program} with {chartData[0].requests} defense requests
        </div>
      </CardFooter>
    </Card>
  )
}
