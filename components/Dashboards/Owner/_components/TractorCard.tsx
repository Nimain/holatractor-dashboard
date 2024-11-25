"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TractorCardProps {
  tractor: Tractor
}

export function TractorCard({ tractor }: TractorCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{tractor.name}</span>
          <Badge variant={getTractorTypeBadgeVariant(tractor.type)}>{tractor.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-square relative mb-4">
          <img
            src={tractor.images[0] || "/placeholder.svg?height=300&width=300"}
            alt={tractor.name}
            className="object-cover rounded-md"
          />
        </div>
        <p className="text-sm text-muted-foreground mb-2">{tractor.description}</p>
        {tractor.model && <p className="text-sm">Model: {tractor.model}</p>}
        {tractor.year && <p className="text-sm">Year: {tractor.year.getFullYear()}</p>}
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
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