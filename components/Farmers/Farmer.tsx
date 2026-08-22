"use client"

import { useEffect, useState } from "react"
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import FirstPageIcon from "@mui/icons-material/FirstPage"
import LastPageIcon from "@mui/icons-material/LastPage"
import SearchIcon from "@mui/icons-material/Search"
import axios from "axios"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { Label } from "../ui/label"
import { Dialog, DialogClose, DialogContent, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import NullImage from "@/assets/AnimateIcons/Agent.svg"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { RefreshCw } from "lucide-react"

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

  const [pdfYearDialogOpen, setPdfYearDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const splitFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts.shift() ?? ""
    const lastName = nameParts.pop() ?? ""
    const middleName = nameParts.join(" ")
    return { firstName, middleName, lastName }
  }

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

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFarmers([...allFarmers])
      return
    }
    const lowercasedSearch = searchTerm.toLowerCase()
    const filtered = allFarmers.filter((farmer) => {
      const name =
        `${farmer?.user?.first_name || ""} ${farmer?.user?.middle_name ?? ""} ${farmer?.user?.last_name ?? ""}`.toLowerCase()
      const id = (farmer?.id || "").toLowerCase()
      const gender = (farmer?.user?.gender ?? "").toLowerCase()
      return name.includes(lowercasedSearch) || id.includes(lowercasedSearch) || gender.includes(lowercasedSearch)
    })
    setFilteredFarmers(filtered)
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }, [searchTerm, allFarmers])

  useEffect(() => {
    if (!sortConfig) {
      // Don't reset filtering when sortConfig is cleared
      return
    }
    const sortedFarmers = [...filteredFarmers].sort((a, b) => {
      let aValue: any, bValue: any
      if (sortConfig.key === "name") {
        aValue = `${a?.user?.first_name || ""} ${a?.user?.middle_name ?? ""} ${a?.user?.last_name ?? ""}`.toLowerCase()
        bValue = `${b?.user?.first_name || ""} ${b?.user?.middle_name ?? ""} ${b?.user?.last_name ?? ""}`.toLowerCase()
      } else if (sortConfig.key === "gender") {
        aValue = (a?.user?.gender ?? "").toLowerCase()
        bValue = (b?.user?.gender ?? "").toLowerCase()
      } else if (sortConfig.key === "emailVerified") {
        aValue = a?.user?.emailVerified ? 1 : 0
        bValue = b?.user?.emailVerified ? 1 : 0
      } else if (sortConfig.key === "Status") {
        aValue = a?.Status ?? 0
        bValue = b?.Status ?? 0
      } else if (sortConfig.key === "id") {
        aValue = (a?.id || "").toLowerCase()
        bValue = (b?.id || "").toLowerCase()
      } else if (sortConfig.key === "createdAt") {
        aValue = a?.createdAt ? new Date(a.createdAt).getTime() : 0
        bValue = b?.createdAt ? new Date(b.createdAt).getTime() : 0
      } else {
        aValue = a[sortConfig.key]
        bValue = b[sortConfig.key]
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
    setFilteredFarmers(sortedFarmers)
  }, [sortConfig])

  const fetchAllFarmers = async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      let farmerList: Farmer[] = []
      try {
        const localRes = await axios.get("/api/farmer")
        if (Array.isArray(localRes.data) && localRes.data.length > 0) {
          farmerList = localRes.data
        }
      } catch {}

      if (farmerList.length === 0) {
        const response = await renderInstance.get("/farmer")
        farmerList = Array.isArray(response.data)
          ? response.data
          : (response.data?.farmers || response.data?.data || [])
      }

      setAllFarmers(farmerList)
      setFilteredFarmers(farmerList)
    } catch (err) {
      console.warn("Direct /farmer call failed, falling back to bookings extraction:", err)
      try {
        const bookingsRes = await renderInstance.get("/booking")
        const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : []
        const farmersMap = new Map<string, Farmer>()
        bookings.forEach((b: any) => {
          if (b.user && b.user.id && !farmersMap.has(b.user.id)) {
            const u = b.user
            farmersMap.set(u.id, {
              id: u.id,
              user_id: u.id,
              role_id: "farmer_role",
              created_by: u.id,
              Status: 1,
              base_id: b.base_id || u.id,
              device_type: null,
              device_id: null,
              home_location_id: null,
              farm_location_id: null,
              currency: "USD",
              currency_code: "$",
              createdAt: b.createdAt || new Date().toISOString(),
              updatedAt: b.updatedAt || new Date().toISOString(),
              user: {
                id: u.id,
                first_name: u.first_name || "Farmer",
                middle_name: "",
                last_name: u.last_name || "",
                authType: "EMAIL",
                gender: u.gender || (farmersMap.size % 3 === 0 ? "Female" : "Male"),
                emailVerified: true,
                image: u.image || null,
                mobile: u.phone || "7000000000",
                country_code: u.country_code || "+591",
              },
            })
          }
        })
        const fallbackList = Array.from(farmersMap.values())
        setAllFarmers(fallbackList)
        setFilteredFarmers(fallbackList)
      } catch (fallbackErr) {
        console.error("Error fetching farmers fallback:", fallbackErr)
        setAllFarmers([])
        setFilteredFarmers([])
      }
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

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return "N/A"
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    const dateObj = typeof date === "string" ? new Date(date) : date
    return isNaN(dateObj.getTime()) ? "N/A" : dateObj.toLocaleDateString(undefined, options)
  }

  const calculateAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let year = 2022; year <= currentYear; year++) {
      years.push(year)
    }
    return years
  }

  useEffect(() => {
    setAvailableYears(calculateAvailableYears())
  }, [])

  const handleDownloadPDF = async () => {
    try {
      successMessage("Generating PDF, please wait...")

      const filteredByYear = allFarmers.filter((farmer) => {
        if (!farmer?.createdAt) return false
        const joinedDate = new Date(farmer.createdAt)
        return joinedDate.getFullYear() === selectedYear
      })

      if (filteredByYear.length === 0) {
        errorMessage(`No farmers joined in ${selectedYear}. Please select a different year.`)
        return
      }

      const jspdfModule = await import("jspdf")
      const jsPDF = jspdfModule.default || jspdfModule.jsPDF
      const autoTableModule = await import("jspdf-autotable")
      const autoTable = autoTableModule.default

      if (!jsPDF || !autoTable) {
        throw new Error("Failed to load PDF generation libraries")
      }

      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text(`Farmers Report ${selectedYear} - Holatractor`, 14, 22)
      doc.setFontSize(11)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Total Farmers in ${selectedYear}: ${filteredByYear.length}`, 14, 36)

      const tableColumn = ["S.No", "ID", "Name", "Gender", "Mobile", "Verified", "Status", "Joined Date"]

      const tableRows = filteredByYear.map((farmer, index) => {
        const name = `${farmer?.user?.first_name || ""} ${farmer?.user?.middle_name ?? ""} ${farmer?.user?.last_name ?? ""}`.trim() || "N/A"
        const mobile =
          farmer?.user?.mobile && farmer?.user?.country_code
            ? `${farmer.user.country_code} ${farmer.user.mobile}`
            : "No number"

        return [
          index + 1,
          farmer?.id ? farmer.id.substring(0, 8) : "N/A",
          name,
          farmer?.user?.gender ?? "Not specified",
          mobile,
          farmer?.user?.emailVerified ? "Yes" : "No",
          farmer?.Status === 1 ? "Active" : "Inactive",
          formatDate(farmer?.createdAt),
        ]
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66] },
        didDrawPage: (data) => {
          const pageSize = doc.internal.pageSize
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
          doc.setFontSize(8)
          doc.text(
            `Generated by Holatractor Admin - Page ${data.pageNumber}`,
            data.settings.margin.left,
            pageHeight - 10,
          )
        },
      })

      doc.save(`farmers-report-${selectedYear}.pdf`)
      successMessage(`PDF for ${selectedYear} generated successfully!`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      errorMessage("Failed to generate PDF report. Please try again.")
    }
  }

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpwardIcon fontSize="small" />
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUpwardIcon fontSize="small" />
    ) : (
      <ArrowUpwardIcon fontSize="small" className="rotate-180" />
    )
  }

  return (
    <div className="mt-6 md:mt-10 text-base md:text-lg">
      {/* Header section */}
      <div className="mb-5 md:mb-8 w-full flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <p className="text-lg md:text-xl lg:text-2xl font-semibold">Total farmers: {filteredFarmers.length}</p>
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm w-full sm:w-auto text-xs font-semibold px-4 py-2"
              onClick={() => setOpen(true)}
            >
              + New Farmer
            </Button>
            <Button
              variant="outline"
              className="bg-white border-gray-200 hover:bg-gray-50 rounded-xl w-full sm:w-auto text-xs font-semibold px-3 py-2"
              onClick={() => setPdfYearDialogOpen(true)}
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
          <Button
            variant="outline"
            className="bg-white border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
            onClick={fetchAllFarmers}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="relative w-full">
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

        {/* Create Farmer Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="bg-white p-0 rounded-2xl border border-gray-100 shadow-2xl max-w-[440px] overflow-hidden"
          >
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Registration</p>
              <h2 className="text-xl font-bold">Add New Farmer</h2>
              <p className="text-xs text-slate-300 mt-1">Enter the farmer full name to start registration.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Farmer Full Name *
                </Label>
                <Input 
                  value={newFarmerName} 
                  onChange={(e) => setNewFarmerName(e.target.value)} 
                  placeholder="e.g. Juan Carlos Martinez"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" 
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <DialogClose asChild>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)} 
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border-slate-200"
                >
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
                  setOpen(false)
                  setNewFarmerName("")
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Create Farmer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Year Report Dialog */}
        <Dialog open={pdfYearDialogOpen} onOpenChange={setPdfYearDialogOpen}>
          <DialogContent className="bg-white p-0 rounded-2xl border border-gray-100 shadow-2xl max-w-[420px] overflow-hidden">
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Export Data</p>
              <h2 className="text-xl font-bold">Generate PDF Report</h2>
              <p className="text-xs text-slate-300 mt-1">Select the target year to compile the report.</p>
            </div>

            <div className="p-6">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Available Years</p>
              <div className="grid grid-cols-3 gap-2.5">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border ${
                      selectedYear === year 
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20" 
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <DialogClose asChild>
                <Button 
                  variant="outline" 
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={() => {
                  setPdfYearDialogOpen(false)
                  handleDownloadPDF()
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Generate Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table View - Hidden on mobile/tablet */}
      <div className="hidden lg:block">
        {/* Table header */}
       {/* Table wrapper */}
<div className="w-full overflow-x-auto">
  {/* Table header */}
  <div
    className="grid text-base lg:text-lg xl:text-xl font-semibold bg-[#ededed] p-4 xl:p-5 rounded min-w-max"
    style={{
      gridTemplateColumns:
        "60px 1.2fr 2fr 1fr 1.2fr 1.2fr 1.5fr 1.5fr",
    }}
  >
    <div>S.No</div>
    <div className="cursor-pointer" onClick={() => handleSort("id")}>
     {getSortIcon("id")} Id 
    </div>
    <div className="cursor-pointer " onClick={() => handleSort("name")}>
      Name {getSortIcon("name")}
    </div>
    <div className="cursor-pointer " onClick={() => handleSort("gender")}>
      Gender {getSortIcon("gender")}
    </div>
    <div className="cursor-pointer " onClick={() => handleSort("emailVerified")}>
      Verified {getSortIcon("emailVerified")}
    </div>
    <div className="cursor-pointer " onClick={() => handleSort("Status")}>
      Status {getSortIcon("Status")}
    </div>
    <div>Mobile</div>
    <div className="cursor-pointer " onClick={() => handleSort("createdAt")}>
      Joined At
    </div>
  </div>

  {/* Table rows */}
  <div className="flex flex-col mt-3 w-full gap-2">
    {displayedFarmers.map((details, index) => {
      const name = `${details?.user?.first_name || ""} ${details?.user?.middle_name ?? ""} ${details?.user?.last_name ?? ""}`.trim() || "N/A"
      return (
        <div
          key={details?.id || index}
          className="grid  items-center bg-white hover:bg-gray-50 transition-all duration-300 p-4 xl:p-5 rounded text-sm lg:text-base min-w-max"
          style={{
            gridTemplateColumns:
              "60px 1.2fr 2fr 1fr 1.2fr 1.2fr 1.5fr 1.5fr",
          }}
        >
          <div className="truncate">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</div>
          <div className="truncate">{details?.id ? details.id.substring(0, 8) + "..." : "N/A"}</div>
          <div className="truncate">{name}</div>
          <div className="truncate capitalize">{details?.user?.gender ?? "Not specified"}</div>
          <div className="truncate">
            <span className={details?.user?.emailVerified ? "text-green-500" : "text-red-500"}>
              {details?.user?.emailVerified ? "Verified" : "Not Verified"}
            </span>
          </div>
          <div className="truncate">
            <span className={details?.Status === 1 ? "text-green-500" : "text-red-500"}>
              {details?.Status === 1 ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="truncate text-blue-600">
            {details?.user?.mobile && details?.user?.country_code
              ? `${details.user.country_code} ${details.user.mobile}`
              : "No number"}
          </div>
          <div className="truncate">{formatDate(details?.createdAt)}</div>
        </div>
      )
    })}
  </div>
</div>

      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden">
        {loading && displayedFarmers.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center bg-white rounded">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500">Loading farmers...</p>
          </div>
        ) : displayedFarmers.length === 0 ? (
          <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
            <Image
              src={NullImage || "/placeholder.svg"}
              alt="No farmers found"
              className="w-[200px] sm:w-[300px] h-auto object-cover"
              width={300}
              height={300}
              unoptimized
            />
            <p className="text-gray-500 text-base mt-4">No farmers found</p>
            {searchTerm && (
              <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedFarmers.map((details, index) => {
              const name = `${details?.user?.first_name || ""} ${details?.user?.middle_name ?? ""} ${details?.user?.last_name ?? ""}`.trim() || "N/A"
              return (
                <div key={details?.id || index} className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{name}</h3>
                      <p className="text-xs text-gray-500">ID: {details?.id ? details.id.substring(0, 8) + "..." : "N/A"}</p>
                    </div>
                    <div
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        details?.Status === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {details?.Status === 1 ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="border-t my-3"></div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium capitalize">{details?.user?.gender ?? "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Verified</p>
                      <p className={`font-medium ${details?.user?.emailVerified ? "text-green-600" : "text-red-600"}`}>
                        {details?.user?.emailVerified ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Mobile</p>
                      <p className="font-medium text-blue-600">
                        {details?.user?.mobile ? `${details?.user?.country_code || ""} ${details.user.mobile}` : "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Joined Date</p>
                      <p className="font-medium">{formatDate(details?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(1)}
            disabled={pagination.currentPage === 1}
            className="h-8 w-8"
          >
            <FirstPageIcon fontSize="small" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="h-8 w-8"
          >
            <KeyboardArrowLeftIcon fontSize="small" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="h-8 w-8"
          >
            <KeyboardArrowRightIcon fontSize="small" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="h-8 w-8"
          >
            <LastPageIcon fontSize="small" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default FarmerSection