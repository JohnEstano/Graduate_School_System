"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useEffect, useState } from "react"
import { Users, Laptop } from "lucide-react"

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const chartConfig = {
  faceToFace: {
    label: "Face-to-face",
    color: "#e11d48",
    icon: Users,
  },
  online: {
    label: "Online",
    color: "#fb7185",
    icon: Laptop,
  },
} satisfies ChartConfig

export function DefenseModeBreakdown() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalScheduled, setTotalScheduled] = useState(0)
  const [period, setPeriod] = useState("month")
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
        
        const scheduled = requests.filter((r: any) => 
          r.scheduled_date !== null && r.defense_mode
        )
        
        setTotalScheduled(scheduled.length)

        let formattedData: any[] = []

        if (period === "week") {
          const weekCounts: Record<string, { faceToFace: number; online: number }> = {}
          const now = new Date()
          const eightWeeksAgo = new Date(now.getTime() - (56 * 24 * 60 * 60 * 1000))
          
          scheduled.forEach((request: any) => {
            const date = new Date(request.scheduled_date)
            if (date >= eightWeeksAgo) {
              const weekNum = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000))
              const weekLabel = `W${8 - weekNum}`
              
              if (!weekCounts[weekLabel]) {
                weekCounts[weekLabel] = { faceToFace: 0, online: 0 }
              }
              
              const mode = request.defense_mode || 'Face-to-face'
              if (mode === 'Online') {
                weekCounts[weekLabel].online++
              } else {
                weekCounts[weekLabel].faceToFace++
              }
            }
          })

          formattedData = Array.from({ length: 8 }, (_, i) => ({
            label: `W${i + 1}`,
            faceToFace: weekCounts[`W${i + 1}`]?.faceToFace || 0,
            online: weekCounts[`W${i + 1}`]?.online || 0,
          }))
        } else if (period === "month") {
          const monthCounts: Record<string, { faceToFace: number; online: number }> = {}
          
          scheduled.forEach((request: any) => {
            const date = new Date(request.scheduled_date)
            const monthYear = date.toLocaleDateString('en-US', { month: 'short' })
            
            if (!monthCounts[monthYear]) {
              monthCounts[monthYear] = { faceToFace: 0, online: 0 }
            }
            
            const mode = request.defense_mode || 'Face-to-face'
            if (mode === 'Online') {
              monthCounts[monthYear].online++
            } else {
              monthCounts[monthYear].faceToFace++
            }
          })

          const sortedMonths = Object.keys(monthCounts).slice(-6)
          formattedData = sortedMonths.map((month) => ({
            label: month,
            faceToFace: monthCounts[month].faceToFace,
            online: monthCounts[month].online,
          }))
        } else if (period === "year") {
          const yearCounts: Record<string, { faceToFace: number; online: number }> = {}
          
          scheduled.forEach((request: any) => {
            const date = new Date(request.scheduled_date)
            const year = date.getFullYear().toString()
            
            if (!yearCounts[year]) {
              yearCounts[year] = { faceToFace: 0, online: 0 }
            }
            
            const mode = request.defense_mode || 'Face-to-face'
            if (mode === 'Online') {
              yearCounts[year].online++
            } else {
              yearCounts[year].faceToFace++
            }
          })

          formattedData = Object.entries(yearCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-5)
            .map(([year, counts]) => ({
              label: year,
              faceToFace: counts.faceToFace,
              online: counts.online,
            }))
        }

        setChartData(formattedData)

        if (formattedData.length > 1) {
          const latestTotal = formattedData[formattedData.length - 1].faceToFace + formattedData[formattedData.length - 1].online
          const previousTotal = formattedData[formattedData.length - 2].faceToFace + formattedData[formattedData.length - 2].online
          const change = previousTotal > 0 ? (((latestTotal - previousTotal) / previousTotal) * 100) : 0
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
  }, [period])

  if (loading) {
    return (
      <Card className="rounded-xl shadow-none border">
        <CardHeader>
          <CardTitle>Defense Mode Trends</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="rounded-xl shadow-none border">
        <CardHeader>
          <CardTitle>Defense Mode Trends</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="text-muted-foreground">No scheduled defenses found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="text-sm font-medium text-muted-foreground">
          Defense Mode Trends
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
        <div className="text-3xl font-bold leading-tight">{totalScheduled}</div>
        <div className="text-sm mt-1 mb-2 text-muted-foreground">
          {percentageChange >= 0 ? '+' : ''}{percentageChange}% from previous period
        </div>
      </div>
      <CardContent className="flex-1 flex items-end w-full p-0 pb-2">
        <ChartContainer config={chartConfig} className="w-full h-[140px]">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="online"
              type="natural"
              fill="var(--color-online)"
              fillOpacity={0.4}
              stroke="var(--color-online)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="faceToFace"
              type="natural"
              fill="var(--color-faceToFace)"
              fillOpacity={0.4}
              stroke="var(--color-faceToFace)"
              strokeWidth={2}
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
