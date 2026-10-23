"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCookie } from "next-cookie"
import { decode } from "jsonwebtoken"
import { Loader2 } from "lucide-react"

const AuthHandler = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  const { cookie } = useCookie()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get parameters from searchParams
        const token = searchParams.get("token")
        const isFarmer = searchParams.get("isFarmer")
        const isOperator = searchParams.get("isOperator")
        const isOwner = searchParams.get("isOwner")
        const isDealer = searchParams.get("isDealer")
        const isAgent = searchParams.get("isAgent")

        // Check if token exists
        if (!token) {
          handleNavigateBack()
          return
        }

        // Verify and decode token
        try {
          const rawUser: any = decode(token)
          if (!rawUser) {
            handleNavigateBack()
            return
          }
          const user = {
            ...rawUser,
            userId: rawUser?.userId || rawUser?.id || rawUser?.sub || rawUser?._id || "",
            name: rawUser?.name || `${rawUser?.first_name || ""} ${rawUser?.last_name || ""}`.trim() || "Farmer",
            email: rawUser?.email || "",
            email_varified: rawUser?.email_varified ?? rawUser?.emailVerified ?? false,
            image: rawUser?.image || "",
          }

          // Set expiry date for cookies
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 1)

          // Set cookies
          const cookieOptions = { path: "/", expires: expiryDate }
          cookie.set("access_token", token, cookieOptions)
          cookie.set("user", JSON.stringify(user), cookieOptions)
          cookie.set("isFarmer", isFarmer || "false", cookieOptions)
          cookie.set("isOperator", isOperator || "false", cookieOptions)
          cookie.set("isOwner", isOwner || "false", cookieOptions)
          cookie.set("isDealer", isDealer || "false", cookieOptions)
          cookie.set("isAgent", isAgent || "false", cookieOptions)

          // Redirect based on user role using the new router
          if (isOwner === "true") {
            router.push("/owner")
          } else if (isDealer === "true") {
            router.push("/dealer")
          } else if (isAgent === "true") {
            router.push("/agent")
          } else if (isOperator === "true") {
            router.push("/operator")
          } else if (isFarmer === "true") {
            router.push("/farmer")
          } else {
            router.push("/")
          }
        } catch (err) {
          handleNavigateBack()
          return
        }
      } catch (err) {
        handleNavigateBack()
      } finally {
        setIsLoading(false)
      }
    }

    const handleNavigateBack = () => {
      const referrer = document.referrer

      if (referrer) {
        // If there's a referrer, navigate to it
        window.location.href = referrer
      } else {
        // If no referrer is available, try window.history
        if (window.history.length > 1) {
          window.history.back()
        } else {
          // If no history is available, redirect to a default page
          router.push("/")
        }
      }
    }

    handleAuth()
  }, [searchParams, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Authenticating...</p>
      </div>
    )
  }

  return null
}

export default AuthHandler
