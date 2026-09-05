import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

interface AttachmentCardProps {
  attachment: {
    name: string
    description: string
    image: string
  }
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  return (
    <Card className="">
      <Image
        src={attachment.image}
        alt={attachment.name}
        width={300}
        height={200}
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-4 min-w-0">
        <h3 className="text-lg font-semibold mb-2 truncate" title={attachment.name}>{attachment.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 break-words" title={attachment.description}>{attachment.description}</p>
      </CardContent>
    </Card>
  )
}