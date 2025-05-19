"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Define Farmer type based on the provided JSON structure
interface Farmer {
  id: string
  user_id: string
  role_id: string
  created_by: string
  Status: number
  base_id: string
  device_type: string | null
  device_id: string | null
  home_location_id: string | null
  farm_location_id: string | null
  currency: string
  currency_code: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    first_name: string
    middle_name: string
    last_name: string
    authType: string
    gender: string
    emailVerified: boolean
    image: string | null
  }
}

export const description = "A donut chart with text"

interface FarmersPieChartProps {
  maleCount: number
  femaleCount: number
  otherCount: number
}

function FarmersPieChart({ maleCount, femaleCount, otherCount }: FarmersPieChartProps) {
  const [loading, setLoading] = React.useState(false)

  const chartData = [
    { browser: "chrome", visitors: maleCount, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: femaleCount, fill: "var(--color-safari)" },
    { browser: "other", visitors: otherCount, fill: "var(--color-other)" },
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
    const total = chartData.reduce((acc, curr) => acc + curr.visitors, 0)
    return total
  }, [maleCount, femaleCount, otherCount])

  return (
    <Card className="flex flex-col w-full md:w-[30%] box-border">
      <CardHeader className="items-center pb-0">
        <CardTitle>Farmers by Gender</CardTitle>
        {/* <CardDescription>Real-time data</CardDescription> */}
      </CardHeader>
      <CardContent className="flex-1 pb-0 w-full">
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <p>Loading chart data...</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto w-full h-[370px] object-cover">
            <PieChart className="w-full">
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                            {totalVisitors.toLocaleString()}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
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
        )}
      </CardContent>
      <CardFooter className="flex justify-center pt-4">
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--chart-1))]" />
            <p className="text-sm">Male ({maleCount})</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--chart-2))]" />
            <p className="text-sm">Female ({femaleCount})</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--chart-5))]" />
            <p className="text-sm">Other ({otherCount})</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default FarmersPieChart
