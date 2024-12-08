import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Attachment } from "@/utils/Types/types"
import Image from "next/image"
import TranslatedText from "@/components/Menubar/TranslatedText"
import { singleStoreOwnerTranslations } from "../SingleStoreTranslation"

interface AttachmentCardProps {
  attachment: Attachment
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  return (
    <Card className="w-full max-w-sm hover:drop-shadow-lg hover:scale-105 transition duration-300">
      <CardHeader>
        <CardTitle>{attachment.name}</CardTitle>
      </CardHeader>
      <CardContent>
      <Image
            src={attachment.images[0] || "/placeholder.svg?height=300&width=300"}
            alt={attachment.name}
            width={400}
            height={400}
            unoptimized={true}
            className="object-cover w-full h-48 rounded-md"
          />
        <p className="text-muted-foreground my-2">{attachment.description}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full"><TranslatedText greetings={singleStoreOwnerTranslations.viewDetails} /></Button>
      </CardFooter>
    </Card>
  )
}

