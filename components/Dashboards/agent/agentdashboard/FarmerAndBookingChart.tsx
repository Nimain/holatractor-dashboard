"use client"

import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

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
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover"
import { Button } from "../../../ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../../ui/command"
import { cn } from "@/lib/utils"

export const description = "An interactive line chart"

const chartData = [
  { date: "2024-04-01", farmer: 222, booking: 150 },
  { date: "2024-04-02", farmer: 97, booking: 180 },
  { date: "2024-04-03", farmer: 167, booking: 120 },
  { date: "2024-04-04", farmer: 242, booking: 260 },
  { date: "2024-04-05", farmer: 373, booking: 290 },
  { date: "2024-04-06", farmer: 301, booking: 340 },
  { date: "2024-04-07", farmer: 245, booking: 180 },
  { date: "2024-04-08", farmer: 409, booking: 320 },
  { date: "2024-04-09", farmer: 59, booking: 110 },
  { date: "2024-04-10", farmer: 261, booking: 190 },
  { date: "2024-04-11", farmer: 327, booking: 350 },
  { date: "2024-04-12", farmer: 292, booking: 210 },
  { date: "2024-04-13", farmer: 342, booking: 380 },
  { date: "2024-04-14", farmer: 137, booking: 220 },
  { date: "2024-04-15", farmer: 120, booking: 170 },
  { date: "2024-04-16", farmer: 138, booking: 190 },
  { date: "2024-04-17", farmer: 446, booking: 360 },
  { date: "2024-04-18", farmer: 364, booking: 410 },
  { date: "2024-04-19", farmer: 243, booking: 180 },
  { date: "2024-04-20", farmer: 89, booking: 150 },
  { date: "2024-04-21", farmer: 137, booking: 200 },
  { date: "2024-04-22", farmer: 224, booking: 170 },
  { date: "2024-04-23", farmer: 138, booking: 230 },
  { date: "2024-04-24", farmer: 387, booking: 290 },
  { date: "2024-04-25", farmer: 215, booking: 250 },
  { date: "2024-04-26", farmer: 75, booking: 130 },
  { date: "2024-04-27", farmer: 383, booking: 420 },
  { date: "2024-04-28", farmer: 122, booking: 180 },
  { date: "2024-04-29", farmer: 315, booking: 240 },
  { date: "2024-04-30", farmer: 454, booking: 380 },
  { date: "2024-05-01", farmer: 165, booking: 220 },
  { date: "2024-05-02", farmer: 293, booking: 310 },
  { date: "2024-05-03", farmer: 247, booking: 190 },
  { date: "2024-05-04", farmer: 385, booking: 420 },
  { date: "2024-05-05", farmer: 481, booking: 390 },
  { date: "2024-05-06", farmer: 498, booking: 520 },
  { date: "2024-05-07", farmer: 388, booking: 300 },
  { date: "2024-05-08", farmer: 149, booking: 210 },
  { date: "2024-05-09", farmer: 227, booking: 180 },
  { date: "2024-05-10", farmer: 293, booking: 330 },
  { date: "2024-05-11", farmer: 335, booking: 270 },
  { date: "2024-05-12", farmer: 197, booking: 240 },
  { date: "2024-05-13", farmer: 197, booking: 160 },
  { date: "2024-05-14", farmer: 448, booking: 490 },
  { date: "2024-05-15", farmer: 473, booking: 380 },
  { date: "2024-05-16", farmer: 338, booking: 400 },
  { date: "2024-05-17", farmer: 499, booking: 420 },
  { date: "2024-05-18", farmer: 315, booking: 350 },
  { date: "2024-05-19", farmer: 235, booking: 180 },
  { date: "2024-05-20", farmer: 177, booking: 230 },
  { date: "2024-05-21", farmer: 82, booking: 140 },
  { date: "2024-05-22", farmer: 81, booking: 120 },
  { date: "2024-05-23", farmer: 252, booking: 290 },
  { date: "2024-05-24", farmer: 294, booking: 220 },
  { date: "2024-05-25", farmer: 201, booking: 250 },
  { date: "2024-05-26", farmer: 213, booking: 170 },
  { date: "2024-05-27", farmer: 420, booking: 460 },
  { date: "2024-05-28", farmer: 233, booking: 190 },
  { date: "2024-05-29", farmer: 78, booking: 130 },
  { date: "2024-05-30", farmer: 340, booking: 280 },
  { date: "2024-05-31", farmer: 178, booking: 230 },
  { date: "2024-06-01", farmer: 178, booking: 200 },
  { date: "2024-06-02", farmer: 470, booking: 410 },
  { date: "2024-06-03", farmer: 103, booking: 160 },
  { date: "2024-06-04", farmer: 439, booking: 380 },
  { date: "2024-06-05", farmer: 88, booking: 140 },
  { date: "2024-06-06", farmer: 294, booking: 250 },
  { date: "2024-06-07", farmer: 323, booking: 370 },
  { date: "2024-06-08", farmer: 385, booking: 320 },
  { date: "2024-06-09", farmer: 438, booking: 480 },
  { date: "2024-06-10", farmer: 155, booking: 200 },
  { date: "2024-06-11", farmer: 92, booking: 150 },
  { date: "2024-06-12", farmer: 492, booking: 420 },
  { date: "2024-06-13", farmer: 81, booking: 130 },
  { date: "2024-06-14", farmer: 426, booking: 380 },
  { date: "2024-06-15", farmer: 307, booking: 350 },
  { date: "2024-06-16", farmer: 371, booking: 310 },
  { date: "2024-06-17", farmer: 475, booking: 520 },
  { date: "2024-06-18", farmer: 107, booking: 170 },
  { date: "2024-06-19", farmer: 341, booking: 290 },
  { date: "2024-06-20", farmer: 408, booking: 450 },
  { date: "2024-06-21", farmer: 169, booking: 210 },
  { date: "2024-06-22", farmer: 317, booking: 270 },
  { date: "2024-06-23", farmer: 480, booking: 530 },
  { date: "2024-06-24", farmer: 132, booking: 180 },
  { date: "2024-06-25", farmer: 141, booking: 190 },
  { date: "2024-06-26", farmer: 434, booking: 380 },
  { date: "2024-06-27", farmer: 448, booking: 490 },
  { date: "2024-06-28", farmer: 149, booking: 200 },
  { date: "2024-06-29", farmer: 103, booking: 160 },
  { date: "2024-06-30", farmer: 446, booking: 400 },
]

const chartConfig = {
  views: {
    label: "Page Views",
  },
  farmer: {
    label: "farmer",
    color: "hsl(var(--chart-1))",
  },
  booking: {
    label: "booking",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const frameworks = [
  {
    value: "next.js",
    label: "2024",
  },
]

export function FarmerAndBookingChart() {
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("farmer")
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

  const total = useMemo(
    () => ({
      farmer: chartData.reduce((acc, curr) => acc + curr.farmer, 0),
      booking: chartData.reduce((acc, curr) => acc + curr.booking, 0),
    }),
    []
  )

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
        <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select year..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search year..." />
          <CommandList>
            <CommandEmpty>Year is not available.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
        </div>
        <div className="flex">
          {["farmer", "booking"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
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
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
