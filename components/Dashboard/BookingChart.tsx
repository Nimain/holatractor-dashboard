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
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // Generate a range of years dynamically (from 2022 to current year)
  const currentYear = new Date().getFullYear()
  const availableYears = Array.from(
    { length: currentYear - 2022 + 1 }, 
    (_, index) => 2022 + index
  )

  useEffect(() => {
    fetchFarmerData()
  }, [])

  useEffect(() => {
    // Update chart when year selection changes
    if (farmers.length > 0) {
      const filteredData = processChartData(farmers, selectedYear)
      setChartData(filteredData)
      
      // Recalculate totals for the selected year
      const farmersForYear = farmers.filter(farmer => 
        new Date(farmer.createdAt).getFullYear() === selectedYear
      )
      
      const maleCount = farmersForYear.filter(farmer => 
        farmer.user.gender?.toLowerCase() === "male"
      ).length
      
      const femaleCount = farmersForYear.filter(farmer => 
        farmer.user.gender?.toLowerCase() === "female"
      ).length
      
      setTotalMale(maleCount)
      setTotalFemale(femaleCount)
    }
  }, [selectedYear, farmers])

  const fetchFarmerData = async () => {
    setLoading(true)
    try {
      const response = await renderInstance.get("/farmer")
      const fetchedFarmers: Farmer[] = response.data
      setFarmers(fetchedFarmers)

      // Process data for the chart with the selected year
      const processedData = processChartData(fetchedFarmers, selectedYear)
      setChartData(processedData)

      // Calculate totals for the selected year
      const farmersForYear = fetchedFarmers.filter(farmer => 
        new Date(farmer.createdAt).getFullYear() === selectedYear
      )
      
      const maleCount = farmersForYear.filter(farmer => 
        farmer.user.gender?.toLowerCase() === "male"
      ).length
      
      const femaleCount = farmersForYear.filter(farmer => 
        farmer.user.gender?.toLowerCase() === "female"
      ).length

      setTotalMale(maleCount)
      setTotalFemale(femaleCount)
    } catch (err) {
      errorMessage("Error fetching farmer data for chart")
      console.error("Error fetching farmer data:", err)
    } finally {
      setLoading(false)
    }
  }

  const processChartData = (farmers: Farmer[], year: number): ChartDataPoint[] => {
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

    // Filter farmers by the selected year and count by gender and month
    farmers
      .filter(farmer => new Date(farmer.createdAt).getFullYear() === year)
      .forEach((farmer) => {
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
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle>Farmers Joined</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <label htmlFor="year-select" className="text-sm font-medium">
                Year:
              </label>
              <select 
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2 py-1 rounded border border-gray-300 text-sm"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
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