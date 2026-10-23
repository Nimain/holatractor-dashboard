"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import up from "@/assets/Line 198.png"
import down from "@/assets/Line 197.png"

// Declare FB as a global variable
declare const FB: any

export default function FacebookLinkAccount() {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false)

  useEffect(() => {
    // Load the Facebook SDK
    if (document.getElementById("facebook-jssdk")) {
      setIsSdkLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.id = "facebook-jssdk"
    script.src = "https://connect.facebook.net/en_US/sdk.js"
    script.async = true
    script.defer = true
    script.crossOrigin = "anonymous"
    script.onload = () => {
      if (window.FB) {
        FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID, // Replace with your Facebook App ID
          cookie: true,
          xfbml: true,
          version: "v20.0", // Use the latest API version
        })
        setIsSdkLoaded(true)
      }
    }
    document.head.appendChild(script)
  }, [])

  const handleFacebookLogin = () => {
    if (!isSdkLoaded) {
      console.error("Facebook SDK not loaded yet.")
      return
    }

    FB.login(
      (response: any) => {
        if (response.authResponse) {
          console.log("Welcome! Fetching your information.... ")
          console.log("Access Token:", response.authResponse.accessToken)
          console.log("User ID:", response.authResponse.userID)

          // You can now use the access token to make API calls
          // For example, to get user's name and email:
          FB.api("/me", { fields: "name,email" }, (userResponse: any) => {
            console.log("Good to see you, " + userResponse.name + ".")
            console.log("User Email:", userResponse.email)
            // Here you would typically send the access token to your backend
            // to store it and make further API calls (e.g., to Marketing API)
          })

          // Example: Get pages the user manages (requires pages_show_list permission)
          FB.api("/me/accounts", (pagesResponse: any) => {
            if (pagesResponse && !pagesResponse.error) {
              console.log("Managed Pages:", pagesResponse.data)
              // You can then prompt the user to select an AD page from this list
            } else {
              console.error("Error fetching pages:", pagesResponse.error)
            }
          })
        } else {
          console.log("User cancelled login or did not fully authorize.")
        }
      },
      {
        scope: "public_profile,email,ads_management,pages_show_list,business_management,whatsapp_business_management", // Request necessary permissions
        return_scopes: true,
      },
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#ffffff] to-[#fff5f7] flex items-center justify-center">
      <div className="w-full  space-y-6">
        {/* Top Section: Three Easy Steps */}
        <div className="bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-2xl p-8 md:p-10 lg:p-12 shadow-2xl border-4 border-[#A10A0C] relative overflow-hidden">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-12 text-center">
            Link Your Facebook Account in three easy steps
          </h2>
          {/* Steps Container with proper positioning */}
          <div className="relative py-8 h-48 md:h-40">
            {/* Custom positioning for desktop */}
            <div className="hidden md:block">
              {/* Step 1 - Top Left */}
              <div className="absolute left-8 top-0 flex flex-col items-center text-center">
                <div className="absolute -top-4 -left-4 bg-white text-[#DC143C] rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl shadow-lg z-20">
                  1
                </div>
                <Button
                  className="bg-[#FF6B35] hover:bg-[#E85A2B] text-white font-bold py-4 px-6 rounded-xl shadow-lg text-lg whitespace-nowrap min-w-[220px]"
                  onClick={handleFacebookLogin}
                  disabled={!isSdkLoaded}
                >
                  Connect Your FB Account
                </Button>
              </div>
              {/* Step 2 - Bottom Center */}
              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 flex flex-col items-center text-center">
                <div className="absolute -top-4 -left-4 bg-white text-[#DC143C] rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl shadow-lg z-20">
                  2
                </div>
                <Button className="bg-white hover:bg-gray-100 text-[#DC143C] font-bold py-4 px-6 rounded-xl shadow-lg text-lg whitespace-nowrap min-w-[220px]">
                  Select Your AD page
                </Button>
              </div>
              {/* Step 3 - Top Right */}
              <div className="absolute right-8 top-0 flex flex-col items-center text-center">
                <div className="absolute -top-4 -left-4 bg-white text-[#DC143C] rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl shadow-lg z-20">
                  3
                </div>
                <Button className="bg-white hover:bg-gray-100 text-[#DC143C] font-bold py-4 px-6 rounded-xl shadow-lg text-lg whitespace-nowrap min-w-[220px]">
                  Link WhatsApp Number
                </Button>
              </div>
            </div>
            {/* Mobile layout - stacked */}
            <div className="md:hidden flex flex-col items-center gap-8">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center relative">
                <div className="absolute -top-4 -left-4 bg-white text-[#DC143C] rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl shadow-lg z-20">
                  1
                </div>
                <Button
                  className="bg-[#FF6B35] hover:bg-[#E85A2B] text-white font-bold py-4 px-6 rounded-xl shadow-lg text-lg whitespace-nowrap min-w-[220px]"
                  onClick={handleFacebookLogin}
                  disabled={!isSdkLoaded}
                >
                  Connect Your FB Account
                </Button>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center text-center relative">
                <div className="absolute -top-4 -left-4 bg-white text-[#DC143C] rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl shadow-lg z-20">
                  2
                </div>
                <Button className="bg-white hover:bg-gray-100 text-[#DC143C] font-bold py-4 px-6 rounded-xl shadow-lg text-lg whitespace-nowrap min-w-[220px]">
                  Select Your AD page
                </Button>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center text-center relative">
                <div className="absolute -top-4 -left-4 bg-white text-[#DC143C] rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl shadow-lg z-20">
                  3
                </div>
                <Button className="bg-white hover:bg-gray-100 text-[#DC143C] font-bold py-4 px-6 rounded-xl shadow-lg text-lg whitespace-nowrap min-w-[220px]">
                  Link WhatsApp Number
                </Button>
              </div>
            </div>
            {/* Arrow Images - positioned absolutely for desktop */}
            <div className="hidden md:block absolute inset-0 pointer-events-none">
              {/* Arrow 1: Connect Your FB Account -> Select Your AD page (down arrow) */}
              <Image
                src={down || "/placeholder.svg"}
                alt="Down Arrow"
                width={64}
                height={64}
                className="absolute left-1/3 top-16 transform -translate-x-1/2 h-[80px]" // Tailwind class for height
              />
              <Image
                src={up || "/placeholder.svg"}
                alt="Up Arrow"
                width={84}
                height={154}
                className="absolute right-1/3 top-16 transform translate-x-1/2 h-[70px]" // Tailwind class for height
              />
            </div>
          </div>
        </div>
        {/* Bottom Section: Account Details */}
        <div className="bg-gradient-to-br from-[#8B0000] to-[#DC143C] rounded-2xl p-8 md:p-10 lg:p-12 shadow-2xl space-y-8">
          {/* Connect Facebook Account */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-red-300/30 pb-6">
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-2">Connect Your Facebook Account</h3>
              <p className="text-red-100 text-base mb-1">
                Allow our app to receive Advertisement Analytics and events From Facebook
              </p>
              <p className="text-red-100 text-sm italic">
                *Please Select <span className="font-bold">OPT into all</span> option for Business and Pages*
              </p>
            </div>
            <Button
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3 px-8 rounded-lg shadow-lg text-lg min-w-[200px]"
              onClick={handleFacebookLogin}
              disabled={!isSdkLoaded}
            >
              Continue to Facebook
            </Button>
          </div>
          {/* Choose Facebook Page */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-red-300/30 pb-6">
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-2">Choose your Facebook Page</h3>
              <p className="text-red-100 text-base">Select Facebook page which will be used to ad</p>
            </div>
            <Button className="bg-white hover:bg-gray-100 text-[#8B0000] font-semibold py-3 px-8 rounded-lg shadow-lg text-lg min-w-[200px] border-2 border-white">
              Choose Your Page
            </Button>
          </div>
          {/* Link Whatsapp Number */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-2">Link Whatsapp number</h3>
              <p className="text-red-100 text-base">
                Link your Whatsapp Business number with the selected Facebook page to receive messages directly over
                Whatsapp
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Input
                type="text"
                placeholder="Enter WhatsApp Number"
                className="bg-white text-gray-800 placeholder:text-gray-500 rounded-lg py-3 px-4 shadow-lg focus:ring-2 focus:ring-white focus:border-transparent w-full sm:w-64 h-12"
              />
              <Button className="bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold py-3 px-8 rounded-lg shadow-lg text-lg w-full sm:w-auto h-12">
                Verify
              </Button>
            </div>
          </div>
          {/* Set up Meta Account Button */}
          <div className="pt-8 text-center">
            <Button className="bg-[#FF4500] hover:bg-[#E03E00] text-white font-bold py-4 px-12 rounded-lg shadow-lg text-lg min-w-[250px] border-2 border-white">
              Set up your Meta Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
