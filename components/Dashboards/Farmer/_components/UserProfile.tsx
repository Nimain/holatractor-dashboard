import { Mail, Shield, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UserProfileCardProps {
  name: string
  email: string
  avatarUrl: string
  isOnline: boolean
  isEmailVerified: boolean
}

export default function UserProfileCard({
  name,
  email,
  avatarUrl,
  isOnline,
  isEmailVerified,
}: UserProfileCardProps) {
  return (
    <Card className="w-full max-w-md rounded-2xl bg-primaryColor text-white">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="text-black">{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle>{name}</CardTitle>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{email}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={"finished"} className="h-6">
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isEmailVerified ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5 text-yellow-500" />
            )}
            <span className="text-sm">
              {isEmailVerified ? "Email verified" : "Email not verified"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}