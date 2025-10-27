"use client"

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
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
  count: {
    label: "Requests",
    color: "#e11d48",
  },
} satisfies ChartConfig

const WORKFLOW_STATES = [
  { key: 'submitted', label: 'Submitted', color: '#94a3b8' },
  { key: 'adviser-review', label: 'Adviser Review', color: '#64748b' },
  { key: 'adviser-approved', label: 'Adviser Approved', color: '#3b82f6' },
  { key: 'coordinator-review', label: 'Coordinator Review', color: '#f59e0b' },
  { key: 'coordinator-approved', label: 'Coordinator Approved', color: '#10b981' },
  { key: 'panels-assigned', label: 'Panels Assigned', color: '#8b5cf6' },
  { key: 'scheduled', label: 'Scheduled', color: '#ec4899' },
  { key: 'completed', label: 'Completed', color: '#059669' },
]

export function WorkflowStatusFunnel() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalActive, setTotalActive] = useState(0)

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
        
        // Exclude rejected/cancelled requests
        const activeRequests = requests.filter((r: any) => 
          !['adviser-rejected', 'coordinator-rejected', 'cancelled'].includes(r.workflow_state?.toLowerCase())
        )
        
        setTotalActive(activeRequests.length)

        const stateCounts: Record<string, number> = {}
        
        WORKFLOW_STATES.forEach(state => {
          stateCounts[state.key] = 0
        })

        activeRequests.forEach((request: any) => {
          const state = request.workflow_state?.toLowerCase() || 'submitted'
          if (stateCounts[state] !== undefined) {
            stateCounts[state]++
          }
        })

        const formattedData = WORKFLOW_STATES
          .map(state => ({
            stage: state.label,
            count: stateCounts[state.key],
            fill: state.color,
          }))
          .filter(item => item.count > 0)

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
          <CardTitle>Workflow Status Pipeline</CardTitle>
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
          <CardTitle>Workflow Status Pipeline</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">No active defense requests found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Status Pipeline</CardTitle>
        <CardDescription>Defense requests by workflow stage</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20,
            }}
          >
            <YAxis
              dataKey="stage"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar 
              dataKey="count" 
              radius={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {totalActive} active requests in the pipeline
        </div>
      </CardFooter>
    </Card>
  )
}
