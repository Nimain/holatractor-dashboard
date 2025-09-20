import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Attachment } from "@/utils/Types/types";
import Image from "next/image";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { singleStoreOwnerTranslations } from "../SingleStoreTranslation";
import { Eye } from "lucide-react";

interface AttachmentCardProps {
  attachment: Attachment;
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  return (
    <Card className="w-full   max-w-sm hover:drop-shadow-lg hover:scale-105 transition duration-300 ">
      <CardHeader className="border-2 rounded-t-md border-black">
        <Image
          src={attachment.images[0] || "/placeholder.svg?height=300&width=300"}
          alt={attachment.name}
          width={400}
          height={400}
          unoptimized={true}
          className="object-cover w-full h-48 rounded-md"
        />
      </CardHeader>
      <CardContent className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white p-4 ">
        <CardTitle>{attachment.name}</CardTitle>
        <p className="text-muted my-2">{attachment.description}</p>
        <div>
          <h1 className="text-white text-xl mt-1">Features</h1>
          <div className="flex justify-evenly">
            <p className="border rounded-full text-xs p-2">Easy to use</p>
            <p className="border rounded-full text-xs p-2">Saves Tree</p>
            <p className="border rounded-full text-xs p-2 ">Handy Equipment</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gradient-to-r from-[#8c0000] to-[#4d0000]  text-white rounded-b-md">
        <Button className="w-full mt-5  bg-orange-500 hover:bg-orange-600">
          <Eye />
          <TranslatedText
            greetings={singleStoreOwnerTranslations.viewDetails}
          />
        </Button>
        <button className="bg-orange-500 hover:bg-orange-600 p-2 text-white rounded-md mx-1 mt-5">
          <TranslatedText greetings={singleStoreOwnerTranslations.Contact} />
        </button>
      </CardFooter>
    </Card>
  );
}
