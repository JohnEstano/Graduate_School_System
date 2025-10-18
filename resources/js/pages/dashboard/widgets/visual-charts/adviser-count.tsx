"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

type AdviserCountRadialProps = {
  count: number;
};

export default function AdviserCountRadial({ count }: AdviserCountRadialProps) {
  // We render a radial chart but center shows the actual adviser count.
  // Percent is mostly for visual dial; when count is zero show 0%.
  const percent = count > 0 ? 100 : 0;
  const chartData = [
    {
      name: "Advisers",
      value: percent,
      fill: "#0ea5a4", // teal-ish
    },
  ];

  return (
    <Card className="col-span-1 rounded-2xl shadow-none border flex flex-col justify-between p-0 min-h-[220px]">
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="text-sm font-medium text-muted-foreground">Advisers Linked</div>
      </div>
      <CardContent className="flex-1 flex items-center justify-center w-full p-0">
        <div className="w-full h-[140px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="80%"
              outerRadius="100%"
              barSize={18}
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarGrid gridType="circle" radialLines={false} stroke="none" />
              <RadialBar dataKey="value" cornerRadius={10} fill="#0ea5a4" background />
              <PolarRadiusAxis type="number" domain={[0, 100]} tick={false} axisLine={false}>
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-4xl font-bold"
                          >
                            {count}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 28}
                            className="fill-muted-foreground text-base"
                          >
                            Adviser{count === 1 ? "" : "s"}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}