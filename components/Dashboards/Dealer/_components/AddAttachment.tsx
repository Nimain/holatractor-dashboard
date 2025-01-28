import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface AddAttachmentProps {
  alreadyAttachments: any[]
}

export default function AddAttachment({ alreadyAttachments }: AddAttachmentProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 px-4 pb-4 flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-full overflow-hidden mb-6">
          <Image
            src="https://agriculturalmachinery.weebly.com/uploads/1/3/2/2/132264880/cultivators_orig.jpg"
            alt="Attachment placeholder"
            width={128}
            height={128}
            className="w-full h-full object-cover bg-muted"
          />
        </div>
        <h2 className="text-2xl font-bold mb-2">Add New Attachment</h2>
        <p className="text-muted-foreground mb-6">
          Click to add a new attachment to your inventory
        </p>
        <Button 
          className="bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center gap-2 px-6"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          Add attachment
        </Button>
      </CardContent>
    </Card>
  )
}