"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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

export const description = "A multiple bar chart"

const chartData = [
  { month: "January", male: 186, female: 80 },
  { month: "February", male: 305, female: 200 },
  { month: "March", male: 237, female: 120 },
  { month: "April", male: 73, female: 190 },
  { month: "May", male: 209, female: 130 },
  { month: "June", male: 214, female: 140 },
  { month: "July", male: 207, female: 110 },
  { month: "August", male: 114, female: 149 },
  { month: "September", male: 214, female: 140 },
  { month: "October", male: 289, female: 190 },
  { month: "November", male: 200, female: 100 },
  { month: "December", male: 214, female: 140 },
]

const chartConfig = {
  male: {
    label: "Male",
    color: "hsl(var(--chart-1))",
  },
  female: {
    label: "Female",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig
function BookingChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Farmers joied</CardTitle>
        <CardDescription>2024</CardDescription>
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 rounded bg-[hsl(var(--chart-1))]" />
          <p>Male</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 rounded bg-[hsl(var(--chart-2))]" />
          <p>Female</p>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="male" fill="var(--color-male)" radius={4} />
            <Bar dataKey="female" fill="var(--color-female)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default BookingChart