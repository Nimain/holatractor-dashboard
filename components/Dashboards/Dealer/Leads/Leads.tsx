'use client'
import { useState } from 'react'
import { MoreHorizontal, Filter, Search, Calendar, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RentalDetailsModal } from '@/components/Dashboards/Dealer/Modals/RentalDetailsModal'
interface TractorRental {
  id: number
  userId: string
  tractorNameModel: string
  startDate: string
  duration: string
  cost: number
  paymentStatus: 'Paid' | 'Pending' | 'Overdue'
  status: 'Active' | 'Completed' | 'Cancelled'
}
const initialRentals: TractorRental[] = [
  { id: 1, userId: "U001", tractorNameModel: "John Deere 5045D", startDate: "2023-06-01", duration: "7 days", cost: 500, paymentStatus: "Paid", status: "Completed" },
  { id: 2, userId: "U002", tractorNameModel: "Mahindra 575 DI", startDate: "2023-06-05", duration: "5 days", cost: 400, paymentStatus: "Pending", status: "Active" },
  { id: 3, userId: "U003", tractorNameModel: "New Holland 3630", startDate: "2023-06-10", duration: "3 days", cost: 300, paymentStatus: "Overdue", status: "Completed" },
  { id: 4, userId: "U004", tractorNameModel: "Massey Ferguson 241", startDate: "2023-06-15", duration: "10 days", cost: 700, paymentStatus: "Paid", status: "Active" },
  { id: 5, userId: "U005", tractorNameModel: "Kubota MU4501", startDate: "2023-06-20", duration: "4 days", cost: 350, paymentStatus: "Pending", status: "Cancelled" },
]
export default function EnhancedTractorRentalTable() {
  const [rentals, setRentals] = useState<TractorRental[]>(initialRentals)
  const [selectedRentals, setSelectedRentals] = useState<number[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRental, setSelectedRental] = useState<TractorRental | null>(null)
  const toggleSelectAll = () => {
    if (selectedRentals.length === rentals.length) {
      setSelectedRentals([])
    } else {
      setSelectedRentals(rentals.map(rental => rental.id))
    }
  }
  const toggleSelectRental = (id: number) => {
    setSelectedRentals(prev => 
      prev.includes(id) ? prev.filter(rentalId => rentalId !== id) : [...prev, id]
    )
  }
  const openModal = (rental: TractorRental) => {
    setSelectedRental(rental)
    setIsModalOpen(true)
  }
  return (
    <div className="w-full p-1">
      {/* First Row Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-10 px-4 bg-white border shadow-sm rounded-lg flex items-center">
            <Filter className="mr-2 h-4 w-4 text-gray-500" />
            All Rentals
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </Button>
          <Button variant="ghost" className="h-10 px-4 bg-white border shadow-sm rounded-lg flex items-center">
            <div className="mr-2 h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="h-4 w-4 text-gray-500">👤</div>
            </div>
            Rented by
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search in the list..." 
              className="h-10 pl-10 pr-4 w-[360px] text-sm border shadow-sm rounded-lg" 
            />
          </div>
          <Button variant="ghost" className="h-10 w-10 bg-white border shadow-sm rounded-lg flex items-center justify-center">
            <Calendar size={39} className="w-14 h-14 text-gray-500 text-3xl" />
          </Button>
        </div>
      </div>
      {/* Second Row Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Total Rentals: {rentals.length}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Sort by</span>
            <Button variant="ghost" className="text-blue-600 px-1 hover:bg-transparent hover:text-blue-700">
              Date
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Results</span>
            <Button variant="ghost" className="text-gray-900 px-1 hover:bg-transparent">
              {rentals.length}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <div className="grid grid-cols-3 gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-gray-400 rounded-full" />
              ))}
            </div>
          </Button>
         
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      </div>
      {/* Table */}
      <div className="px-0 bg-white">
        <div className="overflow-hidden rounded-lg border border-gray-100 bottom-7">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-[40px] px-4 py-3">
                  <Checkbox 
                    checked={selectedRentals.length === rentals.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">SL NO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">USER ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">TRACTOR NAME AND MODEL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">START DATE</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">DURATION</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">COST</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">PAYMENT STATUS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">STATUS</th>
                <th className="w-[40px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rentals.map((rental, index) => (
                <tr 
                  key={rental.id} 
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => openModal(rental)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedRentals.includes(rental.id)}
                      onCheckedChange={() => toggleSelectRental(rental.id)}
                    />
                  </td>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{rental.userId}</td>
                  <td className="px-4 py-3">{rental.tractorNameModel}</td>
                  <td className="px-4 py-3">{rental.startDate}</td>
                  <td className="px-4 py-3">{rental.duration}</td>
                  <td className="px-4 py-3">${rental.cost}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rental.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : rental.paymentStatus === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rental.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rental.status === 'Active' 
                        ? 'bg-blue-100 text-blue-800' 
                        : rental.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rental.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
          
          
      <RentalDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rental={selectedRental}
      />
    </div>
  )
}