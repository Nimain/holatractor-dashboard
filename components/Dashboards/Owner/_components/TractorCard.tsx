"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tractor, TractorType } from "@/utils/Types/types"
import Image from "next/image"

interface TractorCardProps {
  tractor: Tractor
}

export function TractorCard({ tractor }: TractorCardProps) {
  return (
    <Card className="w-full max-w-sm hover:drop-shadow-lg hover:scale-110 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{tractor.name}</span>
          <Badge>{tractor.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
          <Image
            src={tractor.images[0] || "/placeholder.svg?height=300&width=300"}
            alt={tractor.name}
            width={400}
            height={400}
            unoptimized={true}
            className="object-cover w-full h-48 rounded-md"
          />
        <p className="text-muted-foreground my-2">{tractor.description}</p>
        {tractor.model && <p>Model: {tractor.model}</p>}
        {/* {tractor.year && <p className="text-sm">Year: {tractor.year.getFullYear()}</p>} */}
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  )
}