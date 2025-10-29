"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

const chartConfig = {
  total: {
    label: "Total Processed Payments",
    color: "hsl(var(--rose-500))",
  },
  count: {
    label: "Payment Count",
    color: "hsl(var(--rose-500))",
  },
} satisfies ChartConfig

type TimeRange = "week" | "month" | "year"

interface PaymentData {
  date: string
  total: number
  count: number
}

export function PaymentTrendsInteractive() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("total")
  const [timeRange, setTimeRange] = React.useState<TimeRange>("week")
  const [chartData, setChartData] = React.useState<PaymentData[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchPaymentData()
  }, [timeRange])

  const fetchPaymentData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/assistant/payment-trends?range=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch payment data')
      const data = await response.json()
      setChartData(data)
    } catch (error) {
      console.error('Error fetching payment data:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const total = React.useMemo(
    () => ({
      total: chartData.reduce((acc, curr) => acc + curr.total, 0),
      count: chartData.reduce((acc, curr) => acc + curr.count, 0),
    }),
    [chartData]
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (timeRange === "week") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } else if (timeRange === "month") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-6">
          <CardTitle>Payment & Honorarium Trends</CardTitle>
          <CardDescription>
            Showing payment statistics for the selected period
          </CardDescription>
        </div>
        <div className="flex">
          {["total", "count"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {loading ? (
                    <Skeleton className="h-8 w-24 bg-gray-200 dark:bg-gray-700" />
                  ) : chart === "total" ? (
                    formatCurrency(total[chart])
                  ) : (
                    total[chart].toLocaleString()
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="mb-4 flex justify-end items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-[250px] w-full h-8 w-24 bg-gray-200 dark:bg-gray-700"/>
        ) : chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            No payment data available for this period
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDate}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      const date = new Date(value)
                      return date.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    formatter={(value) => {
                      if (activeChart === "total") {
                        return formatCurrency(Number(value))
                      }
                      return value.toLocaleString()
                    }}
                  />
                }
              />
              <Bar 
                dataKey={activeChart} 
                fill="rgb(244 63 94)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
