"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  count: {
    label: "Defenses",
    color: "#e11d48",
  },
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
  const [mostCommon, setMostCommon] = useState<{ mode: string; count: number }>({ mode: 'N/A', count: 0 })

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

        const modeCounts: Record<string, number> = {
          'Face-to-face': 0,
          'Online': 0,
        }
        
        scheduled.forEach((request: any) => {
          const mode = request.defense_mode || 'Face-to-face'
          if (modeCounts[mode] !== undefined) {
            modeCounts[mode]++
          }
        })

        const formattedData = [
          { mode: "Face-to-face", count: modeCounts['Face-to-face'] },
          { mode: "Online", count: modeCounts['Online'] },
        ]

        setChartData(formattedData)

        const max = Math.max(...formattedData.map(d => d.count))
        const maxItem = formattedData.find(d => d.count === max)
        if (maxItem) {
          setMostCommon({ mode: maxItem.mode, count: maxItem.count })
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
        <CardHeader className="items-center">
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
    <Card className="rounded-xl shadow-none border">
      <CardHeader className="items-center pb-4">
        <CardTitle>Defense Mode Trends</CardTitle>
        <CardDescription>Distribution by defense mode</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="mode" />
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
          Most common: {mostCommon.mode} ({mostCommon.count} defenses)
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {totalScheduled} scheduled defenses
        </div>
      </CardFooter>
    </Card>
  )
}
