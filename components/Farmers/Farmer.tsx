"use client"

import { useEffect, useState } from "react"
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"
import { Label } from "../ui/label"
import { Dialog, DialogClose, DialogContent, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import NullImage from "@/assets/AnimateIcons/Agent.svg"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"

// Define Farmer type based on the provided JSON structure
interface Farmer {
  id: string
  user_id: string
  role_id: string
  created_by: string
  Status: number
  base_id: string
  device_type: string | null
  device_id: string | null
  home_location_id: string | null
  farm_location_id: string | null
  currency: string
  currency_code: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    first_name: string
    middle_name: string
    last_name: string
    authType: string
    gender: string
    emailVerified: boolean
    image: string | null
  }
}

const FarmerSection = () => {
  const [activeHover, setActiveHover] = useState("")
  const [loading, setLoading] = useState(false)

  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [open, setOpen] = useState(false)
  const [newFarmerName, setNewFarmerName] = useState("")

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts.shift()
    const lastName = nameParts.pop()
    const middleName = nameParts.join(" ")

    return { firstName, middleName, lastName }
  }

  function fetchAllFarmers() {
    setLoading(true)
    renderInstance
      .get("/farmer")
      .then((res) => {
        setFarmers(res.data)
      })
      .catch((err) => {
        errorMessage("Error fetching farmer list")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchAllFarmers()
  }, [])

  const formatDate = (date: string | Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }

    const dateObj = typeof date === "string" ? new Date(date) : date

    return dateObj.toLocaleDateString(undefined, options)
  }

  return (
    <div className="text-[18px] p-3">
      <div className="mb-[20px] w-full flex items-center justify-between">
        <p className="text-[22px] font-[600]">Total farmers: {farmers.length}</p>

        <Dialog open={open} onOpenChange={setOpen}>
          {/* <DialogTrigger asChild>
            <Button
              name="Name_next_button"
              onClick={() => {
                setOpen(true)
              }}
            >
              New farmer
            </Button>
          </DialogTrigger> */}

          <DialogContent
            className="bg-white h-fit min-w-[400px] max-w-[400px] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <Label className="mb-2 text-lg font-medium">Name</Label>

            <Input
              value={newFarmerName}
              onChange={(e) => {
                setNewFarmerName(e.target.value)
              }}
              className="w-full"
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setOpen(false)
                  }}
                >
                  Cancel
                </Button>
              </DialogClose>

              <Button
                name="Name_next_button"
                onClick={() => {
                  // Here you would handle the farmer creation logic
                  if (newFarmerName.trim() === "") {
                    errorMessage("Please enter a name")
                    return
                  }

                  // Add your farmer creation logic here
                  setOpen(false)
                  setNewFarmerName("")
                }}
              >
                Create Farmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        <div className="w-[100px] flex items-center justify-between group">
          Id
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Name
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Gender
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div
          className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Verified")
          }}
          onMouseLeave={() => {
            setActiveHover("")
          }}
        >
          {activeHover === "Verified" ? "Veri..." : "Verified"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Status
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>

        {/* <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Currency
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div> */}

        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Joined at")
          }}
          onMouseLeave={() => {
            setActiveHover("")
          }}
        >
          {activeHover === "Joined at" ? "Join..." : "Joined at"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon />
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[5px] mt-[20px]">
        {loading ? (
          <p>Fetching farmers</p>
        ) : farmers.length === 0 ? (
          <div className="w-full min-h-[80vh] h-full flex items-center justify-center">
            <Image
              src={NullImage || "/placeholder.svg"}
              alt="No image found"
              className="w-[400px] lg:w-[700px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          <TooltipProvider>
            {farmers.map((details, index) => {
              const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + " " : ""}${details.user.last_name}`
              return (
                <div
                  key={index}
                  className="text-[16px] flex items-center justify-between gap-[10px] bg-white p-[20px] rounded cursor-pointer hover:bg-gray-100 transition-all duration-300"
                >
                  <div className="w-[100px] truncate">{details.id.substring(0, 8)}...</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-[140px] truncate">
                        {name}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-black p-3 rounded shadow-lg border border-gray-200 max-w-[250px] z-50">
                      <p className="break-words font-medium">{name}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="w-[140px] truncate capitalize">{details.user.gender || "Not specified"}</div>
                  <div className="w-[140px] truncate">
                    {details.user.emailVerified ? (
                      <span className="text-green-500">Verified</span>
                    ) : (
                      <span className="text-red-500">Not Verified</span>
                    )}
                  </div>
                  <div className="w-[140px] truncate">
                    <span className={`${details.Status === 1 ? "text-green-500" : "text-red-500"}`}>
                      {details.Status === 1 ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {/* <div className="w-[140px] truncate">
                    {details.currency} ({details.currency_code})
                  </div> */}
                  <div className="w-[180px] truncate">{formatDate(details.createdAt)}</div>
                </div>
              )
            })}
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

export default FarmerSection