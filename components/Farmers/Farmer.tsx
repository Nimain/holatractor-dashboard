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
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { Label } from "../ui/label"
import { Dialog, DialogClose, DialogContent, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import NullImage from "@/assets/AnimateIcons/Agent.svg"
import Image from "next/image"
import { RefreshCw } from "lucide-react"
import FarmerAction from "./FarmerAction"

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
        `${farmer.user.first_name} ${farmer.user.middle_name ?? ""} ${farmer.user.last_name ?? ""}`.toLowerCase()
      const id = farmer.id.toLowerCase()
      const gender = (farmer.user.gender ?? "").toLowerCase()
      return name.includes(lowercasedSearch) || id.includes(lowercasedSearch) || gender.includes(lowercasedSearch)
    })
    setFilteredFarmers(filtered)
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }, [searchTerm, allFarmers])

  useEffect(() => {
    if (!sortConfig) return
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
  }, [sortConfig])

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
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString(undefined, options)
  }

  const calculateAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let year = 2022; year <= currentYear; year++) years.push(year)
    return years
  }

  useEffect(() => {
    setAvailableYears(calculateAvailableYears())
  }, [])

  const handleDownloadPDF = async () => {
    try {
      successMessage("Generating PDF, please wait...")

      const filteredByYear = allFarmers.filter((farmer) => {
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

      if (!jsPDF || !autoTable) throw new Error("Failed to load PDF generation libraries")

      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text(`Farmers Report ${selectedYear} - Holatractor`, 14, 22)
      doc.setFontSize(11)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Total Farmers in ${selectedYear}: ${filteredByYear.length}`, 14, 36)

      const tableColumn = ["S.No", "ID", "Name", "Gender", "Mobile", "Verified", "Status", "Joined Date"]
      const tableRows = filteredByYear.map((farmer, index) => {
        const name = `${farmer.user.first_name} ${farmer.user.middle_name ?? ""} ${farmer.user.last_name ?? ""}`.trim()
        const mobile =
          farmer.user.mobile && farmer.user.country_code
            ? `${farmer.user.country_code} ${farmer.user.mobile}`
            : "No number"
        return [
          index + 1,
          farmer.id.substring(0, 8),
          name,
          farmer.user.gender ?? "Not specified",
          mobile,
          farmer.user.emailVerified ? "Yes" : "No",
          farmer.Status === 1 ? "Active" : "Inactive",
          formatDate(farmer.createdAt),
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
          const pageHeight = (pageSize as any).height ? (pageSize as any).height : (pageSize as any).getHeight()
          doc.setFontSize(8)
          doc.text(`Generated by Holatractor Admin - Page ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10)
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
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpwardIcon fontSize="small" />
    return sortConfig.direction === "asc" ? (
      <ArrowUpwardIcon fontSize="small" />
    ) : (
      <ArrowUpwardIcon fontSize="small" className="rotate-180" />
    )
  }

  return (
    <div className="mt-6 md:mt-10 px-4 md:px-6 lg:px-8 text-base md:text-lg leading-relaxed">
      {/* Header */}
      <div className="mb-5 md:mb-8 w-full flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <p className="text-lg md:text-xl lg:text-2xl font-semibold">
              Total farmers: {filteredFarmers.length}
            </p>
            <Button
              variant="outline"
              className="bg-white border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
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

        {/* Create farmer dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-white h-fit w-[90vw] max-w-[400px] overflow-auto" style={{ scrollbarWidth: "none" }}>
            <Label className="mb-2 text-base md:text-lg font-medium">Name</Label>
            <Input value={newFarmerName} onChange={(e) => setNewFarmerName(e.target.value)} className="w-full" />
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
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
                className="w-full sm:w-auto"
              >
                Create Farmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report year dialog */}
        <Dialog open={pdfYearDialogOpen} onOpenChange={setPdfYearDialogOpen}>
          <DialogContent className="bg-white h-fit w-[90vw] max-w-[400px] overflow-auto">
            <div className="mb-4">
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2">Select Year</h2>
              <p className="text-gray-600">Choose which year's data to include in the PDF report.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 my-4">
              {availableYears.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  className={selectedYear === year ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </Button>
              ))}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={() => {
                  setPdfYearDialogOpen(false)
                  handleDownloadPDF()
                }}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                Generate Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="w-full overflow-x-auto">
          {/* Header row - ADDED ACTION COLUMN */}
          <div
            className="grid text-base lg:text-lg xl:text-xl font-semibold bg-[#ededed] p-4 xl:p-5 rounded min-w-max"
            style={{ gridTemplateColumns: "60px 1.2fr 2fr 1fr 1.2fr 1.2fr 1.5fr 1.5fr 80px" }}
          >
            <div>S.No</div>
            <div className="cursor-pointer" onClick={() => handleSort("id")}>
              {getSortIcon("id")} Id
            </div>
            <div className="cursor-pointer" onClick={() => handleSort("name")}>
              Name {getSortIcon("name")}
            </div>
            <div className="cursor-pointer" onClick={() => handleSort("gender")}>
              Gender {getSortIcon("gender")}
            </div>
            <div className="cursor-pointer" onClick={() => handleSort("emailVerified")}>
              Verified {getSortIcon("emailVerified")}
            </div>
            <div className="cursor-pointer" onClick={() => handleSort("Status")}>
              Status {getSortIcon("Status")}
            </div>
            <div>Mobile</div>
            <div className="cursor-pointer" onClick={() => handleSort("createdAt")}>
              Joined At
            </div>
            <div className="text-center">Action</div>
          </div>

          {/* Data rows - ADDED FARMERACTION COMPONENT */}
          <div className="flex flex-col mt-3 w-full gap-2">
            {displayedFarmers.map((details, index) => {
              const name = `${details.user.first_name} ${details.user.middle_name ?? ""} ${details.user.last_name ?? ""}`.trim()
              return (
                <div
                  key={details.id}
                  className="grid items-center bg-white hover:bg-gray-50 transition-all duration-300 p-4 xl:p-5 rounded text-base md:text-lg min-w-max"
                  style={{ gridTemplateColumns: "60px 1.2fr 2fr 1fr 1.2fr 1.2fr 1.5fr 1.5fr 80px" }}
                >
                  <div className="truncate">{(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}</div>
                  <div className="truncate">{details.id.substring(0, 8)}...</div>
                  <div className="truncate">{name}</div>
                  <div className="truncate capitalize">{details.user.gender ?? "Not specified"}</div>
                  <div className="truncate">
                    <span className={details.user.emailVerified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {details.user.emailVerified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className={details.Status === 1 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {details.Status === 1 ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="truncate text-blue-600">
                    {details.user.mobile && details.user.country_code
                      ? `${details.user.country_code} ${details.user.mobile}`
                      : "No number"}
                  </div>
                  <div className="truncate">{formatDate(details.createdAt)}</div>
                  {/* FARMERACTION COMPONENT */}
                  <div className="flex items-center justify-center">
                    <FarmerAction
                      index={(pagination.currentPage - 1) * pagination.itemsPerPage + index}
                      name={name}
                      email={details.user.email}
                      emailVerified={details.user.emailVerified}
                      gender={details.user.gender}
                      mobile={details.user.mobile}
                      country_code={details.user.country_code}
                      creatDate={formatDate(details.createdAt)}
                      status={details.Status}
                      id={details.id}
                      onUpdate={fetchAllFarmers}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Cards - ADDED FARMERACTION COMPONENT */}
      <div className="lg:hidden">
        {loading && displayedFarmers.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center bg-white rounded">
            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
            <p className="text-gray-600">Loading farmers...</p>
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
            <p className="text-gray-600 mt-4">No farmers found</p>
            {searchTerm && (
              <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedFarmers.map((details, index) => {
              const name = `${details.user.first_name} ${details.user.middle_name ?? ""} ${details.user.last_name ?? ""}`.trim()
              return (
                <div key={details.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{name}</h3>
                      <p className="text-xs text-gray-500">ID: {details.id.substring(0, 8)}...</p>
                    </div>
                    <div
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        details.Status === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {details.Status === 1 ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div className="border-t my-3" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-gray-600 font-medium">Gender</p>
                      <p className="capitalize">{details.user.gender ?? "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Verified</p>
                      <p className={details.user.emailVerified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {details.user.emailVerified ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600 font-medium">Mobile</p>
                      <p className="text-blue-600">
                        {details.user.mobile ? `${details.user.country_code} ${details.user.mobile}` : "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600 font-medium">Joined Date</p>
                      <p>{formatDate(details.createdAt)}</p>
                    </div>
                  </div>

                  {/* FARMERACTION COMPONENT IN MOBILE VIEW */}
                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                    <FarmerAction
                      index={(pagination.currentPage - 1) * pagination.itemsPerPage + index}
                      name={name}
                      email={details.user.email}
                      emailVerified={details.user.emailVerified}
                      gender={details.user.gender}
                      mobile={details.user.mobile}
                      country_code={details.user.country_code}
                      creatDate={formatDate(details.createdAt)}
                      status={details.Status}
                      id={details.id}
                      onUpdate={fetchAllFarmers}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
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