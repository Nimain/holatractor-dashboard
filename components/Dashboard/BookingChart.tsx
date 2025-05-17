"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"

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

interface ChartDataPoint {
  month: string
  male: number
  female: number
}

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
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [totalMale, setTotalMale] = useState(0)
  const [totalFemale, setTotalFemale] = useState(0)

  useEffect(() => {
    fetchFarmerData()
  }, [])

  const fetchFarmerData = async () => {
    setLoading(true)
    try {
      const response = await renderInstance.get("/farmer")
      const farmers: Farmer[] = response.data

      // Process data for the chart
      const processedData = processChartData(farmers)
      setChartData(processedData)

      // Calculate totals
      const maleCount = farmers.filter((farmer) => farmer.user.gender?.toLowerCase() === "male").length
      const femaleCount = farmers.filter((farmer) => farmer.user.gender?.toLowerCase() === "female").length

      setTotalMale(maleCount)
      setTotalFemale(femaleCount)
    } catch (err) {
      errorMessage("Error fetching farmer data for chart")
      console.error("Error fetching farmer data:", err)
    } finally {
      setLoading(false)
    }
  }

  const processChartData = (farmers: Farmer[]): ChartDataPoint[] => {
    // Create a map to store counts by month
    const monthsData = new Map<string, { male: number; female: number }>()

    // Initialize all months
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    months.forEach((month) => {
      monthsData.set(month, { male: 0, female: 0 })
    })

    // Count farmers by gender and month they joined
    farmers.forEach((farmer) => {
      const joinDate = new Date(farmer.createdAt)
      const monthName = months[joinDate.getMonth()]
      const currentMonthData = monthsData.get(monthName) || { male: 0, female: 0 }

      if (farmer.user.gender?.toLowerCase() === "male") {
        currentMonthData.male += 1
      } else if (farmer.user.gender?.toLowerCase() === "female") {
        currentMonthData.female += 1
      }

      monthsData.set(monthName, currentMonthData)
    })

    // Convert map to array for chart
    return months.map((month) => ({
      month,
      male: monthsData.get(month)?.male || 0,
      female: monthsData.get(month)?.female || 0,
    }))
  }

  return (
    <Card className="w-full md:w-[70%]">
      <CardHeader>
        <CardTitle>Farmers Joined</CardTitle>
        <CardDescription>{new Date().getFullYear()}</CardDescription>
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 rounded bg-[hsl(var(--chart-1))]" />
            <p>Male ({totalMale})</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 rounded bg-[hsl(var(--chart-2))]" />
            <p>Female ({totalFemale})</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <p>Loading chart data...</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-[300px] object-cover">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="male" fill="var(--color-male)" radius={4} />
              <Bar dataKey="female" fill="var(--color-female)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <button onClick={fetchFarmerData} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <TrendingUp className="h-4 w-4" />
          Refresh Data
        </button>
      </CardFooter>
    </Card>
  )
}

export default BookingChart
