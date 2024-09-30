"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

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

export const description = "A donut chart with text"

function FarmersPieChart({maleCount, femaleCount, otherCount}:{maleCount: number; femaleCount: number; otherCount: number}) {

  const chartData = [
    { browser: "chrome", visitors: maleCount ?? 0, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: femaleCount ?? 0, fill: "var(--color-safari)" },
    { browser: "other", visitors: otherCount ?? 0, fill: "var(--color-other)" },
  ]
  
  const chartConfig = {
    visitors: {
      label: "Visitors",
    },
    chrome: {
      label: "Male",
      color: "hsl(var(--chart-1))",
    },
    safari: {
      label: "Female",
      color: "hsl(var(--chart-2))",
    },
    other: {
      label: "Other",
      color: "hsl(var(--chart-5))",
    },
  } satisfies ChartConfig

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0)
  }, [])

  return (
    <Card className="flex flex-col w-[30%] box-border">
      <CardHeader className="items-center pb-0">
        <CardTitle>Farmers details</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent className="flex-1 pb-0 w-full">
        <ChartContainer
          config={chartConfig}
          className="mx-auto w-full h-[370px] object-cover"
        >
          <PieChart className="w-full">
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
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
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Farmers
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default FarmersPieChart