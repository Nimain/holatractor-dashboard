"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tractor, TractorType } from "@/utils/Types/types"
import Image from 'next/image'

interface TractorCardProps {
  tractor: Tractor
}

export function TractorCard({ tractor }: TractorCardProps) {
  return (
    <Card className={`w-full max-w-full sm:max-w-sm md:max-w-md lg:max-w-sm `}>
    <CardHeader>
      <CardTitle className="flex items-center justify-between space-x-2">
        <span className="text-sm sm:text-base truncate">{tractor.name}</span>
        <Badge 
          variant={getTractorTypeBadgeVariant(tractor.type)} 
          className="text-xs sm:text-sm"
        >
          {tractor.type}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3 sm:p-4">
      <div className="aspect-square relative mb-2 sm:mb-4">
        <img
          src={tractor.images[0] || "/placeholder.svg?height=300&width=300"}
          alt={tractor.name}
          className="object-cover rounded-md w-full h-full"
        />
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 line-clamp-2">
        {tractor.description}
      </p>
      <div className="space-y-1">
        {tractor.model && (
          <p className="text-xs sm:text-sm">
            Model: <span className="text-muted-foreground">{tractor.model}</span>
          </p>
        )}
        {/* Uncomment and modify year display as needed */}
        {/* {tractor.year && (
          <p className="text-xs sm:text-sm">
            Year: <span className="text-muted-foreground">{tractor.year.getFullYear()}</span>
          </p>
        )} */}
      </div>
    </CardContent>
    <CardFooter className="p-3 sm:p-4">
      <Button className="w-full text-xs sm:text-sm">View Details</Button>
    </CardFooter>
  </Card>
  )
}

function getTractorTypeBadgeVariant(type: TractorType) {
  switch (type) {
    case TractorType.LARGE:
      return "destructive"
    case TractorType.MEDIUM:
      return "default"
    case TractorType.SMALL:
      return "secondary"
    default:
      return "outline"
  }
}