"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useEffect, useState } from "react"
import { DollarSign, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
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
  amount: {
    label: "Amount",
    color: "#e11d48",
    icon: DollarSign,
  },
} satisfies ChartConfig

export function HonorariumPaymentTrends() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)
  const [period, setPeriod] = useState("month")
  const [percentageChange, setPercentageChange] = useState(0)

  useEffect(() => {
    // Fetch honorarium data
    fetch('/api/honorariums', {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        const honorariums = Array.isArray(data) ? data : (data.honorariums ?? [])
        
        const paid = honorariums.filter((h: any) => h.status === 'paid' || h.payment_date)
        
        const total = paid.reduce((sum: number, h: any) => sum + (parseFloat(h.amount) || 0), 0)
        setTotalAmount(total)

        let formattedData: any[] = []

        if (period === "week") {
          const weekCounts: Record<string, number> = {}
          const now = new Date()
          const eightWeeksAgo = new Date(now.getTime() - (56 * 24 * 60 * 60 * 1000))
          
          paid.forEach((honorarium: any) => {
            const date = new Date(honorarium.payment_date || honorarium.created_at)
            if (date >= eightWeeksAgo) {
              const weekNum = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000))
              const weekLabel = `W${8 - weekNum}`
              weekCounts[weekLabel] = (weekCounts[weekLabel] || 0) + (parseFloat(honorarium.amount) || 0)
            }
          })

          formattedData = Array.from({ length: 8 }, (_, i) => ({
            label: `W${i + 1}`,
            amount: weekCounts[`W${i + 1}`] || 0,
          }))
        } else if (period === "month") {
          const monthCounts: Record<string, number> = {}
          
          paid.forEach((honorarium: any) => {
            const date = new Date(honorarium.payment_date || honorarium.created_at)
            const monthYear = date.toLocaleDateString('en-US', { month: 'short' })
            monthCounts[monthYear] = (monthCounts[monthYear] || 0) + (parseFloat(honorarium.amount) || 0)
          })

          const sortedMonths = Object.keys(monthCounts).slice(-6)
          formattedData = sortedMonths.map((month) => ({
            label: month,
            amount: monthCounts[month],
          }))
        } else if (period === "year") {
          const yearCounts: Record<string, number> = {}
          
          paid.forEach((honorarium: any) => {
            const date = new Date(honorarium.payment_date || honorarium.created_at)
            const year = date.getFullYear().toString()
            yearCounts[year] = (yearCounts[year] || 0) + (parseFloat(honorarium.amount) || 0)
          })

          formattedData = Object.entries(yearCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-5)
            .map(([year, amount]) => ({
              label: year,
              amount: amount,
            }))
        }

        setChartData(formattedData)

        if (formattedData.length > 1) {
          const latestTotal = formattedData[formattedData.length - 1].amount
          const previousTotal = formattedData[formattedData.length - 2].amount
          const change = previousTotal > 0 ? (((latestTotal - previousTotal) / previousTotal) * 100) : 0
          setPercentageChange(Number(change.toFixed(1)))
        }
      })
      .catch((error) => {
        console.error('Error fetching honorariums:', error)
        setChartData([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [period])

  if (loading) {
    return (
      <Card className="rounded-xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="rounded-xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="text-muted-foreground">No honorarium payment data found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="text-sm font-medium text-muted-foreground">
          Honorarium Payment Trends
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
        <div className="text-3xl font-bold leading-tight">₱{totalAmount.toLocaleString()}</div>
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
              dataKey="amount"
              type="natural"
              fill="var(--color-amount)"
              fillOpacity={0.4}
              stroke="var(--color-amount)"
              strokeWidth={2}
              dot={{ fill: "#e11d48", r: 3 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
