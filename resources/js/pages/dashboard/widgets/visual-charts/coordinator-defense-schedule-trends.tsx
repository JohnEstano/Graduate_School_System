"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
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

export function CoordinatorDefenseScheduleTrends() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalScheduled, setTotalScheduled] = useState(0)
  const [percentageChange, setPercentageChange] = useState(0)

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
        
        const scheduled = requests.filter((r: any) => r.scheduled_date !== null)
        setTotalScheduled(scheduled.length)

        const monthCounts: Record<string, number> = {}
        
        scheduled.forEach((request: any) => {
          const date = new Date(request.scheduled_date)
          const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1
        })

        const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
          const dateA = new Date(a)
          const dateB = new Date(b)
          return dateA.getTime() - dateB.getTime()
        })

        const recentMonths = sortedMonths.slice(-6)

        const formattedData = recentMonths.map((month) => ({
          month: month.split(' ')[0],
          defenses: monthCounts[month],
        }))

        setChartData(formattedData)

        if (formattedData.length > 1) {
          const latest = formattedData[formattedData.length - 1].defenses
          const previous = formattedData[formattedData.length - 2].defenses
          const change = previous > 0 ? (((latest - previous) / previous) * 100) : 0
          setPercentageChange(Number(change.toFixed(1)))
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
      <Card>
        <CardHeader>
          <CardTitle>Defense Schedule Trends</CardTitle>
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
          <CardTitle>Defense Schedule Trends</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">No scheduled defense requests found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defense Schedule Trends</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="defenses"
              type="natural"
              stroke="var(--color-defenses)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-defenses)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Total of {totalScheduled} scheduled defenses
        </div>
      </CardFooter>
    </Card>
  )
}
