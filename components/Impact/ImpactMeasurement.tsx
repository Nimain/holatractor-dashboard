"use client"

import { useEffect, useState } from "react"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { useCookie } from "next-cookie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Star, TrendingUp, DollarSign, Package, Wrench, Award, Loader2, Filter } from "lucide-react"

interface ImpactData {
  totalRatings: number
  positiveRatings: number
  averageRating: string
  impactMetrics: {
    [key: string]: {
      count: number
      percentage: string
      label: string
    }
  }
  topPositiveReviews: Array<{
    bookingId: string
    farmerName: string
    rating: number
    review: string | null
    impacts: string[]
    date: string
  }>
}

const ImpactMeasurement = () => {
  const [loading, setLoading] = useState(true)
  const [impactData, setImpactData] = useState<ImpactData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  useEffect(() => {
    fetchImpactData()
  }, [])

  const fetchImpactData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let url = "/rating/admin/impact-measurement"
      
      // Add date range parameters if both dates are provided
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`
      }
      
      const response = await renderInstance.get(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      
      setImpactData(response.data)
    } catch (err) {
      setError("Failed to fetch impact data. Please try again.")
      console.error("Error fetching impact data:", err)
    } finally {
      setLoading(false)
    }
  }

  const getImpactIcon = (key: string) => {
    switch (key) {
      case "INCREASE_INCOME":
        return <DollarSign className="h-5 w-5" />
      case "INCREASE_PRODUCTION":
        return <TrendingUp className="h-5 w-5" />
      case "MACHINERY_LOW_COST":
        return <Wrench className="h-5 w-5" />
      case "ALL_OF_ABOVE":
        return <Award className="h-5 w-5" />
      case "OTHERS":
        return <Package className="h-5 w-5" />
      default:
        return <Star className="h-5 w-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-500 text-center">{error}</p>
            <button
              onClick={fetchImpactData}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!impactData) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
          <CardDescription>Filter impact data by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={fetchImpactData}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Apply Filter"
              )}
            </Button>
            {(startDate || endDate) && (
              <Button 
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                  fetchImpactData()
                }}
                variant="outline"
                className="w-full md:w-auto"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{impactData.totalRatings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Positive Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{impactData.positiveRatings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">{impactData.averageRating}</div>
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Impact Metrics</CardTitle>
          <CardDescription>Breakdown of reported benefits by farmers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(impactData.impactMetrics).map(([key, metric]) => (
              <div
                key={key}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {getImpactIcon(key)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{metric.label}</h3>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold">{metric.count}</span>
                    <span className="text-sm text-gray-500 mb-1">({metric.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${metric.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Top Positive Reviews</CardTitle>
          <CardDescription>Recent farmer feedback and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {impactData.topPositiveReviews.map((review) => (
              <div
                key={review.bookingId}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{review.farmerName}</h3>
                    <p className="text-sm text-gray-500">{formatDate(review.date)}</p>
                  </div>
                  {renderStars(review.rating)}
                </div>
                
                {review.review && (
                  <p className="text-gray-700 mb-3 italic">"{review.review}"</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {review.impacts.map((impact) => {
                    const impactLabel = impactData.impactMetrics[impact]?.label || impact
                    return (
                      <span
                        key={impact}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                      >
                        {impactLabel}
                      </span>
                    )
                  })}
                </div>
                
                <p className="text-xs text-gray-400 mt-2">Booking ID: {review.bookingId}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImpactMeasurement