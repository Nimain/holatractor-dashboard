"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Fuel, Calendar, Zap, Settings, DollarSign, Star, Eye, Heart, Share2 } from "lucide-react"

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
    <Card className="group relative overflow-hidden bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header with image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${getListingTypeColor(listingType)} text-white font-semibold`}>
            {listingType.toUpperCase()}
          </Badge>
          {!isAvailable && (
            <Badge variant="destructive" className="font-semibold">
              UNAVAILABLE
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/90 hover:bg-white">
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-white font-bold text-lg">{formatPrice(price)}</span>
          </div>
          {monthlyPrice > 0 && <div className="text-xs text-gray-300">{formatPrice(monthlyPrice)}/month</div>}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
              {name}
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{description}</p>
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-1 ml-3">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-white">{rating}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key specifications */}
        <div className="grid grid-cols-2 gap-3">
          {specs.horsePower && (
            <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
              <Zap className="h-4 w-4 text-yellow-400" />
              <div>
                <div className="text-xs text-slate-400">Power</div>
                <div className="text-sm font-semibold text-white">{specs.horsePower} HP</div>
              </div>
            </div>
          )}

          {specs.fuelCapacity && (
            <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
              <Fuel className="h-4 w-4 text-blue-400" />
              <div>
                <div className="text-xs text-slate-400">Fuel</div>
                <div className="text-sm font-semibold text-white">{specs.fuelCapacity}L</div>
              </div>
            </div>
          )}

          {specs.manufactureYear && (
            <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
              <Calendar className="h-4 w-4 text-green-400" />
              <div>
                <div className="text-xs text-slate-400">Year</div>
                <div className="text-sm font-semibold text-white">{specs.manufactureYear}</div>
              </div>
            </div>
          )}

          {specs.transmission && (
            <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
              <Settings className="h-4 w-4 text-purple-400" />
              <div>
                <div className="text-xs text-slate-400">Trans</div>
                <div className="text-sm font-semibold text-white">{specs.transmission}</div>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div>
            <div className="text-xs text-slate-400 mb-2">Features</div>
            <div className="flex flex-wrap gap-1">
              {features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                  {feature}
                </Badge>
              ))}
              {features.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                  +{features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">{name}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Image */}
                <div className="relative h-64 lg:h-80 rounded-2xl overflow-hidden">
                  <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
                </div>

                {/* Detailed specs */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Specifications</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {specs.horsePower && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Horsepower:</span>
                          <span className="text-white font-medium">{specs.horsePower} HP</span>
                        </div>
                      )}
                      {specs.torque && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Torque:</span>
                          <span className="text-white font-medium">{specs.torque} Nm</span>
                        </div>
                      )}
                      {specs.maxSpeed && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Max Speed:</span>
                          <span className="text-white font-medium">{specs.maxSpeed} km/h</span>
                        </div>
                      )}
                      {specs.weight && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Weight:</span>
                          <span className="text-white font-medium">{specs.weight} kg</span>
                        </div>
                      )}
                      {specs.fuelCapacity && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Fuel Capacity:</span>
                          <span className="text-white font-medium">{specs.fuelCapacity}L</span>
                        </div>
                      )}
                      {specs.engineType && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Engine:</span>
                          <span className="text-white font-medium">{specs.engineType}</span>
                        </div>
                      )}
                      {specs.transmission && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Transmission:</span>
                          <span className="text-white font-medium">{specs.transmission}</span>
                        </div>
                      )}
                      {specs.seatingCapacity && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Seating:</span>
                          <span className="text-white font-medium">{specs.seatingCapacity} seats</span>
                        </div>
                      )}
                      {specs.ptoPower && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">PTO Power:</span>
                          <span className="text-white font-medium">{specs.ptoPower} HP</span>
                        </div>
                      )}
                      {specs.liftCapacity && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Lift Capacity:</span>
                          <span className="text-white font-medium">{specs.liftCapacity} kg</span>
                        </div>
                      )}
                      {specs.dimensions && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-slate-400">Dimensions:</span>
                          <span className="text-white font-medium">{specs.dimensions}</span>
                        </div>
                      )}
                      {specs.warranty && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-slate-400">Warranty:</span>
                          <span className="text-white font-medium">{specs.warranty}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {features.map((feature, index) => (
                          <Badge key={index} className="bg-purple-600 text-white">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Pricing</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Sale Price:</span>
                        <span className="text-2xl font-bold text-green-400">{formatPrice(price)}</span>
                      </div>
                      {monthlyPrice > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Monthly Lease:</span>
                          <span className="text-xl font-semibold text-blue-400">{formatPrice(monthlyPrice)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Listing Type:</span>
                        <Badge className={`${getListingTypeColor(listingType)} text-white`}>
                          {listingType.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Contact Dealer
                </Button>
                <Button variant="outline" className="flex-1 border-slate-600 text-white hover:bg-slate-700">
                  Request Quote
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
