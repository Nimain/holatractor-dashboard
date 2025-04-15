"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { useCookie } from "next-cookie"
import { type MouseEvent, useState } from "react"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { CircularProgress } from "@mui/material"
import Image from "next/image"

interface AgentActionProps {
  index: number
  mailHover: number
  name: string
  email: string
  emailVerified: boolean
  creatDate: string
  updateDate: string
  status: number
  id: string
  image?: string // Using the image field directly from API response
}

const AgentAction = ({
  index,
  name,
  mailHover,
  email,
  emailVerified,
  creatDate,
  updateDate,
  status,
  id,
  image, // Accepting image directly
}: AgentActionProps) => {
  const [loading, setLoading] = useState(false)

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  // Split the full name into components
  const splitName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""

    return { firstName, middleName, lastName }
  }

  const { firstName, middleName, lastName } = splitName(name)

  function InactiveAgent(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
    e.stopPropagation()
    e.preventDefault()
    setLoading(true)
    renderInstance
      .patch(
        `/agent/inactivate_agent/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      )
      .then(() => {
        successMessage("Success")
        window.location.reload()
      })
      .catch(() => {
        errorMessage("Try again")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function ActiveAgent(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
    e.stopPropagation()
    e.preventDefault()
    setLoading(true)
    renderInstance
      .patch(
        `/agent/activate_agent/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      )
      .then(() => {
        successMessage("Success")
        window.location.reload()
      })
      .catch(() => {
        errorMessage("Try again")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="text-[18px] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer hover:bg-white transition-all duration-500">
          <p className="w-[100px]">{index + 1}</p>

          <p className="w-[140px]">{mailHover === index ? name : `${name.slice(0, 5)}...`}</p>

          <p className={`transition ${index === mailHover ? "w-fit" : "w-[140px]"}`}>
            {mailHover === index ? email : `${email.slice(0, 5)}...`}
          </p>

          <div
            className={`px-[10px] text-[14px] py-[6px] ${emailVerified ? "text-[#3e875e]" : "text-red-400"} bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {emailVerified ? "Yes" : "No"}
          </div>

          <p
            className={`px-[10px] text-[14px] py-[6px] ${status === 1 ? "text-[#3e875e]" : "text-red-400"} bg-[#dfe4e2] text-center w-[140px] rounded-full`}
          >
            {status === 1 ? "Active" : "Inactive"}
          </p>

          <p className="w-[180px]">{mailHover === index ? creatDate : `${creatDate.slice(0, 12)}...`}</p>

          <p className="w-[180px]">{mailHover === index ? updateDate : `${updateDate.slice(0, 12)}...`}</p>
        </div>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Update status of {name}</SheetTitle>
          <SheetDescription>
            {status === 1
              ? `${name} is an active operator`
              : `${name} is an inactive operator. Click on the active button to active the operator.`}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {/* Image section - directly uses the image field from API */}
          {image && (
            <div className="flex justify-center mb-4">
              <div className="relative w-40 h-40 overflow-hidden border-2 border-gray-200 rounded-lg">
                <Image
                  src={image}
                  alt={`Image for ${name}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="first_name" className="text-right">
              First Name
            </Label>
            <Input id="first_name" value={firstName} readOnly={true} className="col-span-3" />
          </div>
          {middleName && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="middle_name" className="text-right">
                Middle Name
              </Label>
              <Input id="middle_name" value={middleName} readOnly={true} className="col-span-3" />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="last_name" className="text-right">
              Last Name
            </Label>
            <Input id="last_name" value={lastName} readOnly={true} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" value={email} readOnly={true} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email_verified" className="text-right">
              Email Verified
            </Label>
            <Input id="email_verified" value={emailVerified ? "Yes" : "No"} readOnly={true} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Input id="status" value={status === 1 ? "Active" : "Inactive"} readOnly={true} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="created_date" className="text-right">
              Created Date
            </Label>
            <Input id="created_date" value={creatDate} readOnly={true} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="updated_date" className="text-right">
              Updated Date
            </Label>
            <Input id="updated_date" value={updateDate} readOnly={true} className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            {status === 1 ? (
              <Button
                variant={"destructive"}
                onClick={(e) => {
                  InactiveAgent(e)
                }}
              >
                {loading ? <CircularProgress /> : "Inactive"}
              </Button>
            ) : (
              <Button
                className="bg-green-800"
                onClick={(e) => {
                  ActiveAgent(e)
                }}
              >
                {loading ? <CircularProgress /> : "Active"}
              </Button>
            )}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default AgentAction