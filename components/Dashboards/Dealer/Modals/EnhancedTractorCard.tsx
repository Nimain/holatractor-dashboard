"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Fuel, Calendar, Zap, Settings } from "lucide-react"

interface TractorData {
  id: string
  baseTractor?: {
    id?: string
    name?: string
    description?: string
    images?: string[]
    model?: string
    type?: string
    year?: string
  }
  TractorSpecification?: {
    horsePower?: number
    torque?: number
    zeroToSixty?: number
    features?: string[]
    engineType?: string
    fuelCapacity?: number
    transmission?: string
    weight?: number
    dimensions?: string
    maxSpeed?: number
    tireType?: string
    seatingCapacity?: number
    ptoPower?: number
    liftCapacity?: number
    warranty?: string
    manufactureYear?: number
    brand?: string
    model?: string
    inventoryTractor?: {
      id?: string
      name?: string
      description?: string
      images?: string[]
      model?: string
      type?: string
      year?: string
    }
  }
  price?: number
  monthlyPrice?: number
  discount?: number
  listingType?: string
  isAvailable?: boolean
  rating?: number
}

interface EnhancedTractorCardProps {
  tractor: TractorData
}

export function EnhancedTractorCard({ tractor }: EnhancedTractorCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  // Extract data from the complex structure
  const tractorInfo = tractor.baseTractor || tractor.TractorSpecification?.inventoryTractor || {}
  const specs = tractor.TractorSpecification || {}
  const name = tractorInfo.name || `${specs.brand || ""} ${specs.model || ""}`.trim() || "Unknown Tractor"
  const description = tractorInfo.description || "No description available"
  const image = tractorInfo.images?.[0] || "/placeholder.svg?height=300&width=400"
  const price = tractor.price || 0
  const monthlyPrice = tractor.monthlyPrice || 0
  const features = specs.features || []
  const listingType = tractor.listingType || "sell"
  const isAvailable = tractor.isAvailable !== false
  const rating = tractor.rating || 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getListingTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "sell":
        return "bg-green-500"
      case "lease":
        return "bg-blue-500"
      case "both":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-[#A10A0C] to-[#3B0404] text-white rounded-lg overflow-hidden shadow-lg">
      {/* Header with image */}
      <div className="relative h-48 overflow-hidden">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
        {/* Price overlay */}
        <div className="absolute bottom-3 left-3 bg-white rounded-md px-3 py-1 text-sm font-semibold border border-gray-300">
          <span className="text-gray-900">{formatPrice(price)}</span>
          {monthlyPrice > 0 && <div className="text-xs text-gray-600">{formatPrice(monthlyPrice)}/month</div>}
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <p className="text-sm opacity-90">{description}</p>

        <div className="grid grid-cols-2 gap-3">
          {specs.horsePower && (
            <div className="flex items-center gap-2 p-2 bg-[#3B0404] rounded-md">
              <Zap className="h-5 w-5 text-white" />
              <span className="text-sm font-medium">Power {specs.horsePower}HP</span>
            </div>
          )}
          {specs.fuelCapacity && (
            <div className="flex items-center gap-2 p-2 bg-[#3B0404] rounded-md">
              <Fuel className="h-5 w-5 text-white" />
              <span className="text-sm font-medium">Fuel {specs.fuelCapacity}L</span>
            </div>
          )}
          {specs.manufactureYear && (
            <div className="flex items-center gap-2 p-2 bg-[#3B0404] rounded-md">
              <Calendar className="h-5 w-5 text-white" />
              <span className="text-sm font-medium">Year {specs.manufactureYear}</span>
            </div>
          )}
          {specs.transmission && (
            <div className="flex items-center gap-2 p-2 bg-[#3B0404] rounded-md">
              <Settings className="h-5 w-5 text-white" />
              <span className="text-sm font-medium">Transmission {specs.transmission}</span>
            </div>
          )}
        </div>

        {features.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Features</h4>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, index) => (
                <span key={index} className="bg-[#3B0404] text-white text-xs px-2.5 py-1 rounded-full">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button className="flex-1 bg-[#F76A1E] hover:bg-[#F76A1E] text-white">View Details</Button>
          <Button variant="outline" className="flex-1 bg-[#F76A1E] hover:bg-[#F76A1E] text-white border-[#F76A1E]">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
