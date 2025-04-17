"use client"

import { useEffect, useState } from "react"
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import type { Agent } from "@/utils/Types/types"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"
import { Label } from "../ui/label"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import AgentRegister from "../Authentication/AgentRegister"
import NullImage from "@/assets/AnimateIcons/Agent.svg"
import Image from "next/image"
import AgentAction from "./AgentAction"

const AgentSection = () => {
  const [activeHover, setActiveHover] = useState("")
  const [mailHover, setMailHover] = useState(-1)
  const [loading, setLoading] = useState(false)

  const [users, setUsers] = useState<Agent[]>([])
  const [open, setOpen] = useState(false)
  const [newAgentName, setNewAgentName] = useState("")
  const [isSignUpCard, setIsSignUpCard] = useState(false)

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts.shift()
    const lastName = nameParts.pop()
    const middleName = nameParts.join(" ")

    return { firstName, middleName, lastName }
  }

  function handleNameChage(name: string) {
    setNewAgentName(name)

    const { lastName } = splitFullName(name)

    if (lastName) setIsSignUpCard(true)
    else setIsSignUpCard(false)
  }

  function fetchAllUsers() {
    setLoading(true)
    renderInstance
      .get("/agent")
      .then((res) => {
        setUsers(res.data)
      })
      .catch((err) => {
        errorMessage("Error fetching user list")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchAllUsers()
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
    <div className="mt-[40px] text-[18px]">
      <div className="mb-[20px] w-full flex items-center justify-between">
        <p className="text-[22px] font-[600]">Total agents: {users.length}</p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              name="Name_next_button"
              onClick={() => {
                setOpen(true)
              }}
            >
              New agent
            </Button>
          </DialogTrigger>

          <DialogContent
            className="bg-white h-fit min-w-[400px] max-w-[400px] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <Label className="mb-2 text-lg font-medium">Name</Label>

            <Input
              value={newAgentName}
              onChange={(e) => {
                handleNameChage(e.target.value)
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

              {isSignUpCard ? (
                <AgentRegister name={newAgentName} inPage={true} />
              ) : (
                <Button
                  name="Name_next_button"
                  onClick={() => {
                    errorMessage("Please give your name")
                  }}
                >
                  Next
                </Button>
              )}
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
          Email
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

        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Updated at")
          }}
          onMouseLeave={() => {
            setActiveHover("")
          }}
        >
          {activeHover === "Updated at" ? "Upda..." : "Updated at"}
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
          <p>Fetching agents</p>
        ) : users.length === 0 ? (
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
          users.map((details, index) => {
            const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + " " : ""}${details.user.last_name}`
            return (
              <div
                onMouseEnter={() => {
                  setMailHover(index)
                }}
                onMouseLeave={() => {
                  setMailHover(-1)
                }}
                key={index}
                className="w-full"
              >
                <AgentAction
                  creatDate={formatDate(details.createdAt)}
                  email={details.user.email}
                  emailVerified={details.user.emailVerified}
                  index={index}
                  mailHover={mailHover}
                  name={name}
                  updateDate={formatDate(details.updatedAt)}
                  status={details.status}
                  id={details.id}
                  image={details.user.image}
                  location_id={details.loaction_id || details.user.location_id}
                  document_id={details.document_id}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AgentSection
