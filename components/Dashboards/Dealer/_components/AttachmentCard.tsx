"use client"

import { useState } from 'react'
import Image from 'next/image'
import { getSafeImageSrc } from '@/utils/image/safeImage'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Wrench, MapPin } from 'lucide-react'

interface AttachmentCardProps {
  attachment?: {
    id?: string
    name?: string
    description?: string
    image?: string
    images?: string[]
    price?: number
    hourly_price?: number
    fixedPrice?: number
    fixed_price?: number
    category?: string
    compatibility?: string
  } | null
  price?: number
  storeName?: string
  storeCity?: string
}

export function AttachmentCard({ attachment, price, storeName, storeCity }: AttachmentCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const att = attachment || {}
  const name = att.name || "Agricultural Attachment"
  const description = att.description || "High-performance agricultural implement for farming operations, soil preparation, harvesting, and field management."
  const rawImage = att.image || (Array.isArray(att.images) && att.images[0])
  const image = getSafeImageSrc(rawImage, "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=800&q=80")
  const displayPrice = price ?? att.price ?? att.fixedPrice ?? att.fixed_price ?? att.hourly_price ?? 0

  return (
    <>
      <Card className="w-full bg-white text-gray-900 border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute top-3 left-3">
              <span className="text-[11px] font-semibold bg-[#A10A0C] text-white px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                Implement
              </span>
            </div>

            {displayPrice > 0 && (
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 text-sm font-bold border border-gray-200/80 shadow-md">
                <span className="text-gray-900 text-base">${Number(displayPrice).toLocaleString()}</span>
              </div>
            )}
          </div>

          <CardContent className="p-4 sm:p-5 space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1" title={name}>
              {name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2" title={description}>
              {description}
            </p>
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

      {/* ATTACHMENT DETAILS MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-gray-200 shadow-2xl">
          <div className="relative">
            <div className="relative h-60 sm:h-72 w-full bg-slate-900 overflow-hidden">
              <Image src={image} alt={name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              <div className="absolute top-4 left-4">
                <span className="text-xs font-bold bg-[#A10A0C] text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Heavy Agricultural Implement
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight drop-shadow-sm">{name}</h2>
                  {(storeName || storeCity) && (
                    <p className="text-xs sm:text-sm text-slate-200 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      {storeName || "Dealer Store"} {storeCity ? `• ${storeCity}` : ""}
                    </p>
                  )}
                </div>

                {displayPrice > 0 && (
                  <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-slate-900 shadow-xl border border-white/40 self-start sm:self-auto">
                    <div className="text-xl sm:text-2xl font-black text-[#A10A0C]">
                      ${Number(displayPrice).toLocaleString()}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">Retail / List Price</div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Implement Description
                </h3>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-xs text-slate-500 block">Category</span>
                  <span className="text-sm font-bold text-slate-800">
                    {att.category || "Field Equipment & Implement"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-xs text-slate-500 block">Mounting / Hitch</span>
                  <span className="text-sm font-bold text-slate-800">
                    Category 1 & 2 Three-Point Hitch
                  </span>
                </div>
              </div>

              {(storeName || storeCity) && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-red-100 text-[#A10A0C] rounded-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{storeName || "Dealer Store"}</div>
                      <div className="text-[11px] text-slate-500">{storeCity || "Verified Dealership Location"}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Ready for Attachment
                  </span>
                </div>
              )}
            </div>

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