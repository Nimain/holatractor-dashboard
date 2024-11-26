import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Attachment } from "@/utils/Types/types"

interface AttachmentCardProps {
  attachment: Attachment
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{attachment.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-square relative mb-4">
          <img
            src={attachment.images[0] || "/placeholder.svg?height=300&width=300"}
            alt={attachment.name}
            className="object-cover rounded-md"
          />
        </div>
        <p className="text-sm text-muted-foreground mb-2">{attachment.description}</p>
        <p className="text-sm">Compatible with: {attachment.tractorId.length} tractor(s)</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  )
}

