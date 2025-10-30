"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
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
  approved: {
    label: "Approved",
    color: "#10b981",
  },
  pending: {
    label: "Pending",
    color: "#f59e0b",
  },
} satisfies ChartConfig

export function CoordinatorPerformance() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalCoordinators: 0, totalApproved: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/defense-requests', {
        headers: { 'Accept': 'application/json' }
      }).then(res => res.ok ? res.json() : []),
      fetch('/api/coordinators', {
        headers: { 'Accept': 'application/json' }
      }).then(res => res.ok ? res.json() : [])
    ])
      .then(([defenseData, coordinatorData]) => {
        const requests = Array.isArray(defenseData) ? defenseData : (defenseData.defenseRequests ?? [])
        const coordinators = Array.isArray(coordinatorData) ? coordinatorData : []

        const coordinatorStats: Record<string, { approved: number; pending: number }> = {}
        
        requests.forEach((request: any) => {
          const coordinator = request.coordinator_name || 'Unknown'
          if (!coordinatorStats[coordinator]) {
            coordinatorStats[coordinator] = { approved: 0, pending: 0 }
          }
          
          if (request.workflow_state === 'coordinator-approved' || request.scheduled_date) {
            coordinatorStats[coordinator].approved++
          } else if (request.workflow_state === 'coordinator-review') {
            coordinatorStats[coordinator].pending++
          }
        })

        const formattedData = Object.entries(coordinatorStats)
          .map(([name, stats]) => ({
            coordinator: name.length > 15 ? name.substring(0, 15) + '...' : name,
            approved: stats.approved,
            pending: stats.pending,
          }))
          .sort((a, b) => b.approved - a.approved)
          .slice(0, 6)

        setChartData(formattedData)

        const totalApproved = Object.values(coordinatorStats).reduce((sum, s) => sum + s.approved, 0)
        setStats({
          totalCoordinators: coordinators.length || Object.keys(coordinatorStats).length,
          totalApproved: totalApproved
        })
      })
      .catch((error) => {
        console.error('Error fetching coordinator data:', error)
        setChartData([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Card className="rounded-xl shadow-none border">
        <CardHeader className="items-center pb-4">
          <CardTitle>Coordinator Performance</CardTitle>
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
        <CardHeader className="items-center pb-4">
          <CardTitle>Coordinator Performance</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">No coordinator data found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-none border">
      <CardHeader className="items-center pb-4">
        <CardTitle>Coordinator Performance</CardTitle>
        <CardDescription>Approved vs pending requests per coordinator</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="coordinator" />
            <PolarGrid />
            <Radar
              dataKey="approved"
              fill="var(--color-approved)"
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
            <Radar
              dataKey="pending"
              fill="var(--color-pending)"
              fillOpacity={0.4}
              dot={{
                r: 3,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-4 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {stats.totalApproved} approvals by {stats.totalCoordinators} coordinators
        </div>
      </CardFooter>
    </Card>
  )
}
