"use client"

import { useEffect, useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Check, ChevronsUpDown, RefreshCw, TrendingUp, Tractor, CalendarCheck2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Types definitions
interface Booking {
  id: string
  user_id: string
  store_id: string | null
  start_date: string
  end_date: string | null
  base_id: string
  total_cost: number
  total_tractor_cost: number
  total_attachment_cost: number
  total_service_charge: number
  total_tax: number | null
  total_distance_cost: number
  booking_hours: string
  booking_location_lan: string | null
  booking_location_lat: string | null
  farm_id: string
  confirm: boolean
  owner_confirm: boolean
  distance: number | null
  location_id: string | null
  created_by: string
  bookingType: string
  bookingStatus: string
  createdAt: string
  updatedAt: string
  attachments: any[]
  tractors: any[]
  payment: any[]
}

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

interface ChartDataPoint {
  date: string
  month: string // Added month name for better display
  farmer: number
  booking: number
}

const chartConfig = {
  farmer: {
    label: "Farmers",
    color: "#6366f1", // Indigo color
  },
  booking: {
    label: "Bookings",
    color: "#ec4899", // Pink color
  },
} satisfies ChartConfig

// Generate years array dynamically to ensure future compatibility
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const startYear = 2022 // Start from 2022

  const years = []
  for (let year = startYear; year <= currentYear; year++) {
    years.push({ value: year.toString(), label: year.toString() })
  }

  return years.reverse() // Most recent years first
}

// Array of month names for display
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function FarmerAndBookingChart() {
  const [activeTab, setActiveTab] = useState<keyof typeof chartConfig>("farmer")
  const [open, setOpen] = useState(false)
  const currentYear = new Date().getFullYear().toString()
  const [value, setValue] = useState(currentYear)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [totalFarmers, setTotalFarmers] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)
  const [growthRate, setGrowthRate] = useState({ farmer: 0, booking: 0 })
  const yearOptions = useMemo(() => generateYearOptions(), [])

  // Custom gradient for chart areas
  const gradientFarmer = "url(#colorFarmer)"
  const gradientBooking = "url(#colorBooking)"

  useEffect(() => {
    fetchData()
  }, [value])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch farmers data
      const farmersResponse = await renderInstance.get("/farmer")
      const farmers: Farmer[] = farmersResponse.data

      // Fetch bookings data
      const bookingsResponse = await renderInstance.get("/booking")
      const bookings: Booking[] = bookingsResponse.data

      // Process data for the chart
      const processedData = processChartData(farmers, bookings)
      setChartData(processedData)

      // Set totals
      setTotalFarmers(farmers.length)
      setTotalBookings(bookings.length)

      // Calculate growth rates (comparing to previous month)
      calculateGrowthRates(farmers, bookings)
    } catch (err) {
      errorMessage("Error fetching data for chart")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const calculateGrowthRates = (farmers: Farmer[], bookings: Booking[]) => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const currentYear = Number.parseInt(value)

    // Count farmers by month
    const farmersByMonth = [0, 0] // [previousMonth, currentMonth]
    farmers.forEach((farmer) => {
      const createdAt = new Date(farmer.createdAt)
      if (createdAt.getFullYear() === currentYear) {
        const month = createdAt.getMonth()
        if (month === currentMonth) farmersByMonth[1]++
        else if (month === previousMonth) farmersByMonth[0]++
      }
    })

    // Count bookings by month
    const bookingsByMonth = [0, 0] // [previousMonth, currentMonth]
    bookings.forEach((booking) => {
      const createdAt = new Date(booking.createdAt)
      if (createdAt.getFullYear() === currentYear) {
        const month = createdAt.getMonth()
        if (month === currentMonth) bookingsByMonth[1]++
        else if (month === previousMonth) bookingsByMonth[0]++
      }
    })

    // Calculate growth rates
    const farmerGrowthRate =
      farmersByMonth[0] === 0 ? 100 : ((farmersByMonth[1] - farmersByMonth[0]) / farmersByMonth[0]) * 100

    const bookingGrowthRate =
      bookingsByMonth[0] === 0 ? 100 : ((bookingsByMonth[1] - bookingsByMonth[0]) / bookingsByMonth[0]) * 100

    setGrowthRate({
      farmer: Math.round(farmerGrowthRate * 10) / 10,
      booking: Math.round(bookingGrowthRate * 10) / 10,
    })
  }

  const processChartData = (farmers: Farmer[], bookings: Booking[]): ChartDataPoint[] => {
    // Get the selected year
    const selectedYear = Number.parseInt(value)
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() // 0-11

    // Create an array to store monthly data in order
    const monthlyData: ChartDataPoint[] = []

    // Initialize all months for the selected year
    // For current year, only initialize up to current month
    // For past years, initialize all 12 months
    const monthsToInclude = selectedYear < currentYear ? 11 : currentMonth

    // Start from January (0) and go through all months
    for (let month = 0; month <= monthsToInclude; month++) {
      // Create a date for the first day of each month in the selected year
      const date = new Date(selectedYear, month, 1)
      const dateStr = date.toISOString().split("T")[0]

      monthlyData.push({
        date: dateStr,
        month: monthNames[month], // Add month name for clearer display
        farmer: 0,
        booking: 0,
      })
    }

    // Process farmers data
    farmers.forEach((farmer) => {
      const createdAt = new Date(farmer.createdAt)
      // Only include data from the selected year
      if (createdAt.getFullYear() === selectedYear) {
        const month = createdAt.getMonth()

        // Only count if this month should be included
        if (month <= monthsToInclude) {
          monthlyData[month].farmer += 1
        }
      }
    })

    // Process bookings data
    bookings.forEach((booking) => {
      const createdAt = new Date(booking.createdAt)
      // Only include data from the selected year
      if (createdAt.getFullYear() === selectedYear) {
        const month = createdAt.getMonth()

        // Only count if this month should be included
        if (month <= monthsToInclude) {
          monthlyData[month].booking += 1
        }
      }
    })

    return monthlyData
  }

  const total = useMemo(
    () => ({
      farmer: totalFarmers,
      booking: totalBookings,
    }),
    [totalFarmers, totalBookings],
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Extract month name from the payload directly
      const monthName = payload[0]?.payload?.month || "";
      
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4">
          <p className="font-medium">
            {monthName} {new Date(label).getFullYear()}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm flex items-center gap-2">
              <span
                className="w-3 h-3 inline-block rounded-full"
                style={{ backgroundColor: chartConfig.farmer.color }}
              ></span>
              <span className="font-medium">Farmers:</span> {payload[0]?.value}
            </p>
            <p className="text-sm flex items-center gap-2">
              <span
                className="w-3 h-3 inline-block rounded-full"
                style={{ backgroundColor: chartConfig.booking.color }}
              ></span>
              <span className="font-medium">Bookings:</span> {payload[1]?.value}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0
    return (
      <Badge
        variant={isPositive ? "default" : "destructive"}
        className={cn("ml-2", isPositive ? "bg-green-100 text-green-800 hover:bg-green-100" : "")}
      >
        <TrendingUp className={cn("h-3 w-3 mr-1", !isPositive && "rotate-180")} />
        {isPositive ? "+" : ""}
        {value}%
      </Badge>
    )
  }

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-background to-background/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Farmers & Bookings Analytics
            </CardTitle>
            <CardDescription className="text-muted-foreground">Real-time performance metrics</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[120px] justify-between border-border/40 bg-background/50 backdrop-blur-sm"
                >
                  {value ? yearOptions.find((year) => year.value === value)?.label : "Select year..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[150px] p-0">
                <Command>
                  <CommandInput placeholder="Search year..." />
                  <CommandList>
                    <CommandEmpty>Year is not available.</CommandEmpty>
                    <CommandGroup>
                      {yearOptions.map((year) => (
                        <CommandItem
                          key={year.value}
                          value={year.value}
                          onSelect={(currentValue) => {
                            setValue(currentValue === value ? "" : currentValue)
                            setOpen(false)
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", value === year.value ? "opacity-100" : "opacity-0")} />
                          {year.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              className="border-border/40 bg-background/50 backdrop-blur-sm"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="px-6 py-1">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-border/30 bg-background/50 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="p-6 flex items-center">
              <div className="rounded-full p-3 bg-indigo-100 mr-4">
                <Tractor className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Farmers</p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">{total.farmer.toLocaleString()}</h3>
                  <GrowthIndicator value={growthRate.farmer} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border/30 bg-background/50 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="p-6 flex items-center">
              <div className="rounded-full p-3 bg-pink-100 mr-4">
                <CalendarCheck2 className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">{total.booking.toLocaleString()}</h3>
                  <GrowthIndicator value={growthRate.booking} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <CardContent className="px-1 pt-3 pb-6">
        <Tabs
          defaultValue="farmer"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as keyof typeof chartConfig)}
          className="w-full px-5"
        >
          <TabsList className="grid w-64 grid-cols-2 mb-4">
            <TabsTrigger
              value="farmer"
              className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
            >
              Farmers
            </TabsTrigger>
            <TabsTrigger value="booking" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
              Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="farmer" className="mt-0">
            {renderChart("farmer")}
          </TabsContent>

          <TabsContent value="booking" className="mt-0">
            {renderChart("booking")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )

  function renderChart(dataKey: keyof typeof chartConfig) {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[350px]">
          <div className="flex flex-col items-center">
            <RefreshCw className="h-8 w-8 mb-2 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        </div>
      )
    }

    if (chartData.length === 0) {
      return (
        <div className="flex justify-center items-center h-[350px]">
          <p className="text-muted-foreground text-center">
            No data available for {value}
            <br />
            <span className="text-sm">Try selecting a different year or refresh data</span>
          </p>
        </div>
      )
    }

    return (
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="colorFarmer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBooking" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
            <XAxis
              dataKey="month"  // Use month name instead of date
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={30}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={10} stroke="#9ca3af" fontSize={12} width={30} />
            <Tooltip content={<CustomTooltip />} />

            {dataKey === "farmer" && (
              <Line
                type="monotone"
                dataKey="farmer"
                stroke={chartConfig.farmer.color}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                name="Farmers"
                fill={gradientFarmer}
              />
            )}

            {dataKey === "booking" && (
              <Line
                type="monotone"
                dataKey="booking"
                stroke={chartConfig.booking.color}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                name="Bookings"
                fill={gradientBooking}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }
}

export default FarmerAndBookingChart