"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { useEffect, useState } from "react"
import { FileText, FileCheck, Award } from "lucide-react"

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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const chartConfig = {
  count: {
    label: "Requests",
    color: "#e11d48",
  },
  proposal: {
    label: "Proposal",
    color: "#3b82f6",
    icon: FileText,
  },
  prefinal: {
    label: "Prefinal",
    color: "#f59e0b",
    icon: FileCheck,
  },
  final: {
    label: "Final",
    color: "#10b981",
    icon: Award,
  },
} satisfies ChartConfig

export function DefenseTypeDistribution() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRequests, setTotalRequests] = useState(0)
  const [mostCommon, setMostCommon] = useState<{ type: string; count: number }>({ type: 'N/A', count: 0 })

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
        
        setTotalRequests(requests.length)

        const typeCounts: Record<string, number> = {
          'Proposal': 0,
          'Prefinal': 0,
          'Final': 0,
        }
        
        requests.forEach((request: any) => {
          const type = request.defense_type || 'Proposal'
          if (typeCounts[type] !== undefined) {
            typeCounts[type]++
          }
        })

        const formattedData = [
          { type: "Proposal", count: typeCounts['Proposal'] },
          { type: "Prefinal", count: typeCounts['Prefinal'] },
          { type: "Final", count: typeCounts['Final'] },
        ]

        setChartData(formattedData)

        const max = Math.max(...formattedData.map(d => d.count))
        const maxItem = formattedData.find(d => d.count === max)
        if (maxItem) {
          setMostCommon({ type: maxItem.type, count: maxItem.count })
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
        <CardHeader className="items-center">
          <CardTitle>Defense Type Distribution</CardTitle>
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
        <CardHeader className="items-center">
          <CardTitle>Defense Type Distribution</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <div className="text-muted-foreground">No defense requests found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-none border">
      <CardHeader className="items-center pb-4">
        <CardTitle>Defense Type Distribution</CardTitle>
        <CardDescription>Breakdown by defense stage</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="type" />
            <PolarGrid />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-4 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Most common: {mostCommon.type} ({mostCommon.count} requests)
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {totalRequests} defense requests
        </div>
      </CardFooter>
    </Card>
  )
}
