"use client"

import { useEffect, useState } from "react"
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import EditIcon from "@mui/icons-material/Edit"
import CloseIcon from "@mui/icons-material/Close"
import type { Agent } from "@/utils/Types/types"
import axios from "axios"
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

const ITEMS_PER_PAGE = 30

const AgentSection = () => {
  const [activeHover, setActiveHover] = useState("")
  const [mailHover, setMailHover] = useState(-1)
  const [loading, setLoading] = useState(false)

  const [users, setUsers] = useState<Agent[]>([])
  const [open, setOpen] = useState(false)
  const [newAgentName, setNewAgentName] = useState("")
  const [isSignUpCard, setIsSignUpCard] = useState(false)
  
  // Mobile edit modal state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

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

  async function fetchAllUsers() {
    setLoading(true)
    try {
      let agentList: Agent[] = []
      try {
        const localRes = await axios.get("/api/agent")
        if (Array.isArray(localRes.data) && localRes.data.length > 0) {
          agentList = localRes.data
        }
      } catch {}

      if (agentList.length === 0) {
        const res = await renderInstance.get("/agent")
        agentList = Array.isArray(res.data)
          ? res.data
          : (res.data?.agents || res.data?.data || [])
      }

      const sortedUsers = [...agentList].sort((a: Agent, b: Agent) => {
        return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
      })
      setUsers(sortedUsers)
      setCurrentPage(1)
    } catch (err) {
      errorMessage("Error fetching user list")
    } finally {
      setLoading(false)
    }
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

  const handleMobileAgentClick = (agent: Agent) => {
    setSelectedAgent(agent)
    setEditOpen(true)
  }

  // Pagination calculations
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = currentPage * ITEMS_PER_PAGE
  const paginatedUsers = users.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="mt-6 md:mt-10 text-base md:text-lg px-4 md:px-0">
      <div className="mb-5 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-lg md:text-xl lg:text-2xl font-semibold">
          Total agents: {users.length}
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              name="Name_next_button"
              onClick={() => {
                setOpen(true)
              }}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all"
            >
              New agent
            </Button>
          </DialogTrigger>

          <DialogContent
            className="bg-white rounded-2xl w-[95vw] max-w-[460px] p-0 overflow-hidden shadow-2xl border border-gray-100"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Agent Network</p>
              <h2 className="text-xl font-bold">Register New Agent</h2>
              <p className="text-xs text-slate-300 mt-1">Enter the agent's full legal name to initiate registration.</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Full Legal Name *
                </Label>
                <Input
                  value={newAgentName}
                  onChange={(e) => {
                    handleNameChage(e.target.value)
                  }}
                  placeholder="e.g. Maria Fernanda Lopez"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setOpen(false)
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all bg-white"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Next Step →
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table Header - Hidden on mobile */}
      <div className="hidden lg:flex text-lg xl:text-xl font-semibold items-center justify-between gap-2 xl:gap-3 bg-[#ededed] p-4 xl:p-5 rounded cursor-pointer overflow-x-auto">
        <div className="min-w-[80px] xl:w-[100px] flex items-center justify-between group">
          Id
          <div className="flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon className="text-lg xl:text-xl" />
            </div>
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon className="text-lg xl:text-xl" />
            </div>
          </div>
        </div>

        <div className="min-w-[120px] xl:w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Name
          <div className="flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon className="text-lg xl:text-xl" />
            </div>
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon className="text-lg xl:text-xl" />
            </div>
          </div>
        </div>

        <div className="min-w-[120px] xl:w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Email
          <div className="flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon className="text-lg xl:text-xl" />
            </div>
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon className="text-lg xl:text-xl" />
            </div>
          </div>
        </div>

        <div
          className="min-w-[120px] xl:w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Verified")
          }}
          onMouseLeave={() => {
            setActiveHover("")
          }}
        >
          {activeHover === "Verified" ? "Veri..." : "Verified"}
          <div className="flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon className="text-lg xl:text-xl" />
            </div>
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon className="text-lg xl:text-xl" />
            </div>
          </div>
        </div>

        <div className="min-w-[120px] xl:w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Status
          <div className="flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon className="text-lg xl:text-xl" />
            </div>
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon className="text-lg xl:text-xl" />
            </div>
          </div>
        </div>

        <div
          className="min-w-[150px] xl:w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Joined at")
          }}
          onMouseLeave={() => {
            setActiveHover("")
          }}
        >
          {activeHover === "Joined at" ? "Join..." : "Joined at"}
          <div className="flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon className="text-lg xl:text-xl" />
            </div>
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon className="text-lg xl:text-xl" />
            </div>
          </div>
        </div>

        <div
          className="min-w-[150px] xl:w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onMouseEnter={() => {
            setActiveHover("Updated at")
          }}
          onMouseLeave={() => {
            setActiveHover("")
          }}
        >
          {activeHover === "Updated at" ? "Upda..." : "Updated at"}
          <div className="flex items-center gap-1 xl:gap-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <ArrowUpwardIcon className="text-lg xl:text-xl" />
            </div>
            <div className="rounded-full w-7 h-7 xl:w-8 xl:h-8 flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon className="text-lg xl:text-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:gap-1.5 mt-5">
        {loading ? (
          <p className="text-center py-8">Fetching agents...</p>
        ) : users.length === 0 ? (
          <div className="w-full min-h-[60vh] md:min-h-[80vh] h-full flex items-center justify-center">
            <Image
              src={NullImage || "/placeholder.svg"}
              alt="No agents found"
              className="w-[250px] sm:w-[350px] md:w-[400px] lg:w-[700px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized={true}
            />
          </div>
        ) : (
          paginatedUsers.map((details, index) => {
            const name = `${details.user.first_name} ${details.user.middle_name ? details.user.middle_name + " " : ""}${details.user.last_name}`
            const firstName = details.user.first_name
            const email = details.user.email
            
            return (
              <div key={index} className="w-full">
                {/* Mobile Card View - Clickable one line box */}
                <div 
                  className="lg:hidden bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer active:scale-[0.98]"
                  onClick={() => handleMobileAgentClick(details)}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    {/* Avatar/Image */}
                    <div className="flex-shrink-0">
                      {details.user.image ? (
                        <Image
                          src={details.user.image}
                          alt={firstName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name & Email */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{firstName}</p>
                      <p className="text-xs text-gray-500 truncate">{email}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        details.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {details.status}
                      </span>
                    </div>

                    {/* Verified Badge */}
                    <div className="flex-shrink-0">
                      {details.user.emailVerified ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : (
                        <span className="text-gray-400 text-lg">✗</span>
                      )}
                    </div>

                    {/* Edit Icon */}
                    <div className="flex-shrink-0">
                      <EditIcon className="text-blue-500" fontSize="small" />
                    </div>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div
                  className="hidden lg:block"
                  onMouseEnter={() => {
                    setMailHover(index)
                  }}
                  onMouseLeave={() => {
                    setMailHover(-1)
                  }}
                >
                  <AgentAction
                    creatDate={formatDate(details.createdAt)}
                    email={details.user.email}
                    emailVerified={details.user.emailVerified}
                    index={startIndex + index}
                    mailHover={mailHover}
                    name={name}
                    updateDate={formatDate(details.updatedAt)}
                    status={details.status}
                    id={details.id}
                    image={details.user.image ?? undefined}
                    location_id={details.loaction_id || details.user.location_id}
                    document_id={details.document_id}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Controls - Bottom Middle */}
      {users.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-8 py-6">
          {/* Previous Button */}
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm"
            variant={currentPage === 1 ? "outline" : "default"}
          >
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              const page = i + 1
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </Button>
                )
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <span key={page} className="px-2 py-2 text-gray-500">
                    ...
                  </span>
                )
              }
              return null
            })}
          </div>

          {/* Next Button */}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm"
            variant={currentPage === totalPages ? "outline" : "default"}
          >
            Next
          </Button>
        </div>
      )}

      {/* Mobile Edit Modal */}
      {selectedAgent && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="bg-white w-[95vw] max-w-[520px] max-h-[90vh] overflow-hidden p-0 rounded-2xl border border-gray-100 shadow-2xl">
            {/* Header with Dark Modern Slate & Emerald Accent */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <button 
                onClick={() => setEditOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2 transition-all"
              >
                <CloseIcon fontSize="small" />
              </button>
              
              <div className="flex items-center gap-4 relative z-10">
                {selectedAgent.user.image ? (
                  <Image
                    src={selectedAgent.user.image}
                    alt={selectedAgent.user.first_name}
                    width={72}
                    height={72}
                    className="w-[72px] h-[72px] rounded-2xl object-cover ring-4 ring-white/10 shadow-xl"
                    unoptimized={true}
                  />
                ) : (
                  <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-4 ring-white/10">
                    {selectedAgent.user.first_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Agent
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      selectedAgent.user.emailVerified
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {selectedAgent.user.emailVerified ? '● Verified' : '○ Pending'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {selectedAgent.user.first_name} {selectedAgent.user.middle_name || ''} {selectedAgent.user.last_name}
                  </h2>
                  <p className="text-slate-300 text-xs mt-0.5 break-all">{selectedAgent.user.email}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {/* Bento Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-800">
                    <span className={`w-2 h-2 rounded-full ${selectedAgent.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="capitalize">{selectedAgent.status || 'Active'}</span>
                  </div>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Role Type</p>
                  <p className="font-semibold text-sm text-slate-800">Field Agent</p>
                </div>
              </div>

              {/* Details List */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Agent Identifier</span>
                  <span className="font-mono text-slate-800 font-medium text-[11px]">{selectedAgent.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Contact Email</span>
                  <span className="font-medium text-slate-900">{selectedAgent.user.email}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Location ID</span>
                  <span className="font-medium text-slate-800">{selectedAgent.loaction_id || selectedAgent.user.location_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Document ID</span>
                  <span className="font-medium text-slate-800">{selectedAgent.document_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Joined At</span>
                  <span className="font-medium text-slate-800">{formatDate(selectedAgent.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Last Modified</span>
                  <span className="font-medium text-slate-800">{formatDate(selectedAgent.updatedAt)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 font-medium shadow-md transition-all active:scale-[0.98]"
                  onClick={() => {
                    console.log('Edit agent:', selectedAgent)
                  }}
                >
                  <EditIcon className="mr-1.5 !w-4 !h-4" />
                  Edit Agent
                </Button>
                <Button 
                  variant="outline" 
                  className="px-5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                  onClick={() => setEditOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default AgentSection