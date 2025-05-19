"use client"

import { useEffect, useState } from "react"
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import FirstPageIcon from "@mui/icons-material/FirstPage"
import LastPageIcon from "@mui/icons-material/LastPage"
import SearchIcon from "@mui/icons-material/Search"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"
import { Label } from "../ui/label"
import { Dialog, DialogClose, DialogContent, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import NullImage from "@/assets/AnimateIcons/Agent.svg"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { RefreshCw } from "lucide-react"

// Define Farmer interface
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
    middle_name: string | null
    last_name: string | null
    authType: string
    gender: string | null
    emailVerified: boolean
    image: string | null
    mobile: string | null
    country_code: string | null
  }
}

// Pagination interface
interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

const FarmerSection = () => {
  const [activeHover, setActiveHover] = useState("")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [allFarmers, setAllFarmers] = useState<Farmer[]>([])
  const [filteredFarmers, setFilteredFarmers] = useState<Farmer[]>([])
  const [displayedFarmers, setDisplayedFarmers] = useState<Farmer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [newFarmerName, setNewFarmerName] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1,
  })
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Farmer | "name" | "gender" | "emailVerified" | "Status"
    direction: "asc" | "desc"
  } | null>(null)

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts.shift() ?? ""
    const lastName = nameParts.pop() ?? ""
    const middleName = nameParts.join(" ")
    return { firstName, middleName, lastName }
  }

  // Pagination calculation
  useEffect(() => {
    const totalItems = filteredFarmers.length
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage)
    setPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }))
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    setDisplayedFarmers(filteredFarmers.slice(startIndex, endIndex))
  }, [filteredFarmers, pagination.currentPage, pagination.itemsPerPage])

  // Search filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFarmers([...allFarmers]) // Fixed typo: setFiltered-fundamentals -> setFilteredFarmers
      return
    }
    const lowercasedSearch = searchTerm.toLowerCase()
    const filtered = allFarmers.filter((farmer) => {
      const name =
        `${farmer.user.first_name} ${farmer.user.middle_name ?? ""} ${farmer.user.last_name ?? ""}`.toLowerCase()
      const id = farmer.id.toLowerCase()
      const gender = (farmer.user.gender ?? "").toLowerCase()
      return name.includes(lowercasedSearch) || id.includes(lowercasedSearch) || gender.includes(lowercasedSearch)
    })
    setFilteredFarmers(filtered)
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }, [searchTerm, allFarmers])

  // Sorting
  useEffect(() => {
    if (!sortConfig) {
      setFilteredFarmers([...allFarmers])
      return
    }
    const sortedFarmers = [...filteredFarmers].sort((a, b) => {
      let aValue: any, bValue: any
      if (sortConfig.key === "name") {
        aValue = `${a.user.first_name} ${a.user.middle_name ?? ""} ${a.user.last_name ?? ""}`.toLowerCase()
        bValue = `${b.user.first_name} ${b.user.middle_name ?? ""} ${b.user.last_name ?? ""}`.toLowerCase()
      } else if (sortConfig.key === "gender") {
        aValue = (a.user.gender ?? "").toLowerCase()
        bValue = (b.user.gender ?? "").toLowerCase()
      } else if (sortConfig.key === "emailVerified") {
        aValue = a.user.emailVerified ? 1 : 0
        bValue = b.user.emailVerified ? 1 : 0
      } else if (sortConfig.key === "Status") {
        aValue = a.Status
        bValue = b.Status
      } else if (sortConfig.key === "id") {
        aValue = a.id.toLowerCase()
        bValue = b.id.toLowerCase()
      } else if (sortConfig.key === "createdAt") {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      } else {
        aValue = a[sortConfig.key]
        bValue = b[sortConfig.key]
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
    setFilteredFarmers(sortedFarmers)
  }, [sortConfig, allFarmers])

  const fetchAllFarmers = async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const response = await renderInstance.get("/farmer")
      setAllFarmers(response.data)
      setFilteredFarmers(response.data)
    } catch (err) {
      errorMessage("Error fetching farmer list")
      console.error("Error fetching farmers:", err)
    } finally {
      setLoading(false)
      setTimeout(() => setRefreshing(false), 600)
    }
  }

  useEffect(() => {
    fetchAllFarmers()
  }, [])

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }

  const handleSort = (key: keyof Farmer | "name" | "gender" | "emailVerified" | "Status") => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc"
    }
    setSortConfig({ key, direction })
  }

  const formatDate = (date: string | Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString(undefined, options)
  }

  const handleDownloadPDF = async () => {
    try {
      // Create a new jsPDF instance
      const { jsPDF } = await import("jspdf")
      const { autoTable } = await import("jspdf-autotable")

      const doc = new jsPDF()

      // Add title
      doc.setFontSize(18)
      doc.text("Farmers Report,Holatractor", 14, 22)
      doc.setFontSize(11)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Total Farmers: ${allFarmers.length}`, 14, 36)

      // Define the columns for the table
      const tableColumn = ["S.No", "ID", "Name", "Gender", "Verified", "Status", "Joined Date"]

      // Define the rows for the table
      const tableRows = allFarmers.map((farmer, index) => {
        const name = `${farmer.user.first_name} ${farmer.user.middle_name ?? ""} ${farmer.user.last_name ?? ""}`.trim()
        return [
          index + 1,
          farmer.id.substring(0, 8),
          name,
          farmer.user.gender ?? "Not specified",
          farmer.user.emailVerified ? "Yes" : "No",
          farmer.Status === 1 ? "Active" : "Inactive",
          formatDate(farmer.createdAt),
        ]
      })

      // Generate the table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66] },
      })

      // Save the PDF
      doc.save("farmers-report.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
      errorMessage("Failed to generate PDF report")
    }
  }

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpwardIcon />
    }
    return sortConfig.direction === "asc" ? <ArrowUpwardIcon /> : <ArrowUpwardIcon className="rotate-180" />
  }

  return (
    <div className="text-[18px] ">
      {/* Header section */}
      <div className="mb-[20px] w-full flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
          <p className="text-[22px] font-[600]">Total farmers: {filteredFarmers.length}</p>
          <Button
            variant="outline"
            className="ml-2 bg-white border-gray-200 hover:bg-gray-50"
            onClick={handleDownloadPDF}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15h6" />
              <path d="M11 18h2" />
              <path d="M9 12h6" />
            </svg>
            Download Report
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-500" />
            </div>
            <Input
              type="text"
              className="w-full pl-10 bg-white"
              placeholder="Search farmers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="bg-white border-gray-200 hover:bg-gray-50"
            onClick={fetchAllFarmers}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="bg-white h-fit min-w-[400px] max-w-[400px] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <Label className="mb-2 text-lg font-medium">Name</Label>
            <Input value={newFarmerName} onChange={(e) => setNewFarmerName(e.target.value)} className="w-full" />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                name="Name_next_button"
                onClick={() => {
                  if (newFarmerName.trim() === "") {
                    errorMessage("Please enter a name")
                    return
                  }
                  // Add farmer creation logic here
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

      {/* Table header */}
      <div className="text-[20px] font-[600] flex items-center justify-between gap-[10px] bg-[#ededed] p-[20px] rounded cursor-pointer">
        <div className="w-[60px] flex items-center justify-between group">S.No</div>
        <div className="w-[100px] flex items-center justify-between group" onClick={() => handleSort("id")}>
          Id
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              {getSortIcon("id")}
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
        <div
          className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onClick={() => handleSort("name")}
        >
          Name
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              {getSortIcon("name")}
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
        <div
          className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onClick={() => handleSort("gender")}
        >
          Gender
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              {getSortIcon("gender")}
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
        <div
          className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onClick={() => handleSort("emailVerified")}
          onMouseEnter={() => setActiveHover("Verified")}
          onMouseLeave={() => setActiveHover("")}
        >
          {activeHover === "Verified" ? "Veri..." : "Verified"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              {getSortIcon("emailVerified")}
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
        <div
          className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onClick={() => handleSort("Status")}
        >
          Status
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              {getSortIcon("Status")}
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
        <div className="w-[140px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group">
          Mobile
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
        <div
          className="w-[180px] relative before:absolute before:left-[-8px] before:h-[60%] before:-translate-y-1/2 before:top-1/2 before:w-[3px] before:bg-gray-400 flex items-center justify-between group"
          onClick={() => handleSort("createdAt")}
          onMouseEnter={() => setActiveHover("Joined at")}
          onMouseLeave={() => setActiveHover("")}
        >
          {activeHover === "Joined at" ? "Join..." : "Joined at"}
          <div className="flex items-center gap-[6px] opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              {getSortIcon("createdAt")}
            </div>
            <div className="rounded-full w-[30px] h-[30px] flex items-center justify-center transition-all duration-500 hover:bg-gray-300">
              <MoreVertIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Table body */}
      <div className="flex flex-col gap-[5px] mt-[20px]">
        {loading && displayedFarmers.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center bg-white">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500">Loading farmers...</p>
          </div>
        ) : displayedFarmers.length === 0 ? (
          <div className="w-full min-h-[80vh] flex flex-col items-center justify-center">
            <Image
              src={NullImage || "/placeholder.svg"}
              alt="No farmers found"
              className="w-[400px] lg:w-[700px] h-auto object-cover"
              width={400}
              height={400}
              unoptimized
            />
            <p className="text-gray-500 text-lg">No farmers found</p>
            {searchTerm && (
              <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <TooltipProvider>
            {displayedFarmers.map((details, index) => {
              const name =
                `${details.user.first_name} ${details.user.middle_name ?? ""} ${details.user.last_name ?? ""}`.trim()
              return (
                <div
                  key={index}
                  className="text-[16px] flex items-center justify-between gap-[10px] bg-white p-[20px] rounded cursor-pointer hover:bg-gray-100 transition-all duration-300"
                >
                  <div className="w-[60px]">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</div>
                  <div className="w-[100px] truncate">{details.id.substring(0, 8)}...</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-[140px] truncate">{name}</div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-black p-3 rounded shadow-lg border border-gray-200 max-w-[250px] z-50">
                      <p className="break-words font-medium">{name}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="w-[140px] truncate capitalize">{details.user.gender ?? "Not specified"}</div>
                  <div className="w-[140px] truncate">
                    <span className={details.user.emailVerified ? "text-green-500" : "text-red-500"}>
                      {details.user.emailVerified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                  <div className="w-[140px] truncate">
                    <span className={details.Status === 1 ? "text-green-500" : "text-red-500"}>
                      {details.Status === 1 ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="w-[140px] truncate">
                    {details.user.mobile && details.user.country_code ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-blue-600 hover:underline">
                            {details.user.country_code} {details.user.mobile}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white text-black p-3 rounded shadow-lg border border-gray-200">
                          <p>
                            Call: {details.user.country_code} {details.user.mobile}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-gray-400 italic">No number</span>
                    )}
                  </div>
                  <div className="w-[180px] truncate">{formatDate(details.createdAt)}</div>
                </div>
              )
            })}
          </TooltipProvider>
        )}
      </div>

      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">
            Showing {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)} to{" "}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
            {pagination.totalItems} entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              <FirstPageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <KeyboardArrowLeftIcon className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else {
                  const start = Math.max(1, pagination.currentPage - 2)
                  const end = Math.min(pagination.totalPages, start + 4)
                  pageNum = start + i
                  if (pageNum > end) return null
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <KeyboardArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <LastPageIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="pageSize" className="text-sm whitespace-nowrap">
              Per page:
            </Label>
            <select
              id="pageSize"
              className="h-8 rounded border-gray-200 text-sm"
              value={pagination.itemsPerPage}
              onChange={(e) => {
                setPagination((prev) => ({
                  ...prev,
                  itemsPerPage: Number(e.target.value),
                  currentPage: 1,
                }))
              }}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default FarmerSection
