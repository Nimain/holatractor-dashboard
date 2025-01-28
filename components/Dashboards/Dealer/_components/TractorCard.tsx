import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

interface TractorCardProps {
  tractor: {
    name: string
    description: string
    image: string
  }
}

export function TractorCard({ tractor }: TractorCardProps) {
  return (
    <Card className=" ">
      <Image
        src={tractor.image}
        alt={tractor.name}
        width={300}
        height={200}
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{tractor.name}</h3>
        <p className="text-sm text-gray-600">{tractor.description}</p>
      </CardContent>
    </Card>
  )
}