"use client"

import { useState } from "react"
import Image from "next/image"
import { getSafeImageSrc } from "@/utils/image/safeImage"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Fuel,
  Calendar,
  Zap,
  Settings,
  MapPin,
  Check,
  Sparkles,
} from "lucide-react"

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
  storeName?: string
  storeCity?: string
}

export function EnhancedTractorCard({ tractor, storeName, storeCity }: EnhancedTractorCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Extract data from the complex structure
  const tractorInfo = tractor.baseTractor || tractor.TractorSpecification?.inventoryTractor || {}
  const specs = tractor.TractorSpecification || {}
  const name = tractorInfo.name || `${specs.brand || ""} ${specs.model || ""}`.trim() || "Commercial Tractor"
  const description = tractorInfo.description || "High-performance commercial agricultural tractor engineered for heavy-duty field operations, reliability, and fuel efficiency."
  
  // All images
  const allImages: string[] = (
    Array.isArray(tractorInfo.images) && tractorInfo.images.length > 0
      ? tractorInfo.images
      : (tractorInfo as any).image
        ? [(tractorInfo as any).image]
        : []
  ).map((img) => getSafeImageSrc(img, "/placeholder.svg?height=400&width=600"))

  const mainImage = allImages.length > 0 
    ? allImages[Math.min(selectedImageIndex, allImages.length - 1)] 
    : getSafeImageSrc(null, "/placeholder.svg?height=400&width=600")

  const price = tractor.price || 0
  const monthlyPrice = tractor.monthlyPrice || 0
  const features = specs.features || []
  const listingType = tractor.listingType || "sell"
  const isAvailable = tractor.isAvailable !== false

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getListingTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "sell":
        return "bg-green-600"
      case "lease":
        return "bg-blue-600"
      case "both":
        return "bg-purple-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <>
      <Card className="w-full bg-white text-gray-900 border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          {/* Header with image */}
          <div className="relative h-48 sm:h-52 w-full bg-gray-100 overflow-hidden">
            <Image
              src={mainImage}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
            />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              <span
                className={`text-[11px] font-semibold text-white px-2.5 py-0.5 rounded-full shadow-sm capitalize ${getListingTypeColor(
                  listingType
                )}`}
              >
                {listingType}
              </span>
              {isAvailable && (
                <span className="text-[11px] font-medium bg-emerald-600/90 text-white px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse"></span>
                  In Store
                </span>
              )}
            </div>

            {/* Price overlay */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 text-sm font-bold border border-gray-200/80 shadow-md">
              <span className="text-gray-900 text-base">{price > 0 ? formatPrice(price) : "Contact Store"}</span>
              {monthlyPrice > 0 && (
                <span className="text-xs font-normal text-gray-500 ml-1.5">
                  / {formatPrice(monthlyPrice)} mo
                </span>
              )}
            </div>
          </div>

          <CardContent className="p-4 sm:p-5 space-y-4">
            <div>
              <CardTitle
                className="text-lg sm:text-xl font-bold text-gray-900 leading-snug line-clamp-1"
                title={name}
              >
                {name}
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2" title={description}>
                {description}
              </p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {specs.horsePower ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">
                  <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="font-medium truncate">{specs.horsePower} HP Power</span>
                </div>
              ) : null}
              {specs.fuelCapacity ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">
                  <Fuel className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="font-medium truncate">{specs.fuelCapacity} L Fuel</span>
                </div>
              ) : null}
              {specs.manufactureYear ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">
                  <Calendar className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="font-medium truncate">Year {specs.manufactureYear}</span>
                </div>
              ) : null}
              {specs.transmission ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">
                  <Settings className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span className="font-medium truncate">{specs.transmission}</span>
                </div>
              ) : null}
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-wrap gap-1.5 max-h-14 overflow-hidden">
                  {features.slice(0, 4).map((feature, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-full font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                  {features.length > 4 && (
                    <span className="text-[11px] text-gray-400 font-medium py-0.5">
                      +{features.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </div>

        <div className="p-4 pt-0">
          <Button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="w-full bg-[#A10A0C] hover:bg-[#85080A] text-white rounded-xl shadow-sm text-xs font-semibold h-9 transition-colors"
          >
            View Details
          </Button>
        </div>
      </Card>

      {/* VIEW DETAILS MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-gray-200 shadow-2xl">
          <div className="relative">
            {/* Gallery / Image Header */}
            <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden">
              <Image
                src={mainImage}
                alt={name}
                fill
                className="object-contain sm:object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Badges on Hero */}
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold text-white px-3 py-1 rounded-full shadow-md capitalize ${getListingTypeColor(
                    listingType
                  )}`}
                >
                  {listingType} Listing
                </span>
                {isAvailable && (
                  <span className="text-xs font-semibold bg-emerald-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Available In Store
                  </span>
                )}
                {specs.warranty && (
                  <span className="text-xs font-medium bg-white/90 text-slate-800 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                    {specs.warranty}
                  </span>
                )}
              </div>

              {/* Title & Price on hero */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                    {name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 mt-0.5 flex items-center gap-2">
                    {specs.brand && <span>{specs.brand}</span>}
                    {specs.model && <span>• {specs.model}</span>}
                    {specs.manufactureYear && <span>• Model Year {specs.manufactureYear}</span>}
                    {storeName && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        {storeName}
                      </span>
                    )}
                  </p>
                </div>

                <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-slate-900 shadow-xl border border-white/40 self-start sm:self-auto">
                  <div className="text-xl sm:text-2xl font-black text-[#A10A0C]">
                    {price > 0 ? formatPrice(price) : "Price on Request"}
                  </div>
                  {monthlyPrice > 0 && (
                    <div className="text-xs font-semibold text-slate-500">
                      Lease: {formatPrice(monthlyPrice)} / month
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Multiple thumbnails if available */}
            {allImages.length > 1 && (
              <div className="flex gap-2 p-3 bg-slate-100 overflow-x-auto border-b border-gray-200">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === idx ? "border-[#A10A0C] scale-105 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt={`${name} ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Equipment Overview
                </h3>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#A10A0C]" />
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-slate-500 block">Horse Power</span>
                    <span className="text-sm font-bold text-slate-800">
                      {specs.horsePower ? `${specs.horsePower} HP` : "Standard Commercial"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-slate-500 block">Engine Type</span>
                    <span className="text-sm font-bold text-slate-800">
                      {specs.engineType || "High-Efficiency Diesel"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-slate-500 block">Transmission</span>
                    <span className="text-sm font-bold text-slate-800">
                      {specs.transmission || "Synchromesh / Hydrostatic"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-slate-500 block">Fuel Tank Capacity</span>
                    <span className="text-sm font-bold text-slate-800">
                      {specs.fuelCapacity ? `${specs.fuelCapacity} Liters` : "Heavy-Duty Capacity"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-slate-500 block">PTO Power</span>
                    <span className="text-sm font-bold text-slate-800">
                      {specs.ptoPower ? `${specs.ptoPower} HP` : "Equipped & Certified"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-xs text-slate-500 block">Lift Capacity</span>
                    <span className="text-sm font-bold text-slate-800">
                      {specs.liftCapacity ? `${specs.liftCapacity} kg` : "Heavy Category II"}
                    </span>
                  </div>

                  {specs.weight && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-xs text-slate-500 block">Operating Weight</span>
                      <span className="text-sm font-bold text-slate-800">{specs.weight} kg</span>
                    </div>
                  )}

                  {specs.dimensions && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-xs text-slate-500 block">Dimensions</span>
                      <span className="text-sm font-bold text-slate-800">{specs.dimensions}</span>
                    </div>
                  )}

                  {specs.warranty && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-xs text-slate-500 block">Warranty Period</span>
                      <span className="text-sm font-bold text-slate-800">{specs.warranty}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Key Equipment Features
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feat, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#A10A0C] border border-red-100 rounded-lg text-xs font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Store & Location Bar */}
              {(storeName || storeCity) && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 text-[#A10A0C] rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{storeName || "Dealer Store"}</div>
                      <div className="text-xs text-slate-500">{storeCity || "Verified Dealership Location"}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    Inspected & Ready
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end">
              <Button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm text-sm font-semibold px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
