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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  students: {
    label: "Students",
    color: "#e11d48",
  },
  capacity: {
    label: "Capacity",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig

export function CoordinatorAdviserStudentRatio() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalAdvisers: 0, totalStudents: 0, avgRatio: 0 })

  useEffect(() => {
    fetch('/api/coordinator/advisers', {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        const advisers = Array.isArray(data) ? data : (data.advisers ?? [])
        
        const adviserData = advisers
          .filter((adviser: any) => adviser.status === 'active')
          .map((adviser: any) => {
            const studentCount = adviser.assigned_students_count || 0
            const adviserName = `${adviser.first_name} ${adviser.last_name}`.trim()
            const idealCapacity = 10
            
            return {
              adviser: adviserName.length > 15 ? adviserName.substring(0, 15) + '...' : adviserName,
              students: studentCount,
              capacity: idealCapacity,
            }
          })
          .slice(0, 6)

        setChartData(adviserData)

        const totalStudents = advisers.reduce((sum: number, a: any) => 
          sum + (a.assigned_students_count || 0), 0)
        const activeAdvisers = advisers.filter((a: any) => a.status === 'active').length
        const avgRatio = activeAdvisers > 0 ? (totalStudents / activeAdvisers).toFixed(1) : 0

        setStats({
          totalAdvisers: activeAdvisers,
          totalStudents: totalStudents,
          avgRatio: Number(avgRatio)
        })
      })
      .catch((error) => {
        console.error('Error fetching advisers:', error)
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
          <CardTitle>Adviser-Student Distribution</CardTitle>
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
          <CardTitle>Adviser-Student Distribution</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">No active advisers found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-none border">
      <CardHeader className="items-center pb-4">
        <CardTitle>Adviser-Student Distribution</CardTitle>
        <CardDescription>
          Student load per adviser vs ideal capacity
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart
            data={chartData}
            margin={{
              top: -40,
              bottom: -10,
            }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis dataKey="adviser" />
            <PolarGrid />
            <Radar
              dataKey="students"
              fill="var(--color-students)"
              fillOpacity={0.6}
            />
            <Radar 
              dataKey="capacity" 
              fill="var(--color-capacity)" 
              fillOpacity={0.3}
            />
            <ChartLegend className="mt-8" content={<ChartLegendContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-4 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {stats.totalStudents} students across {stats.totalAdvisers} advisers
        </div>
      </CardFooter>
    </Card>
  )
}
