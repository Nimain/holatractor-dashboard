"use client"
import { useState, useRef } from 'react'
import { MoreHorizontal, Plus, Upload, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import * as XLSX from 'xlsx'
interface Owner {
  id: number
  name: string
  email: string
  mobile: string
  gender: string
  status: 'Active' | 'Inactive'
  avatar: string
}
const initialOwners: Owner[] = [
  { id: 1, name: "John Doe", email: "john@example.com", mobile: "123-456-7890", gender: "Male", status: "Active", avatar: "/avatars/01.png" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", mobile: "987-654-3210", gender: "Female", status: "Inactive", avatar: "/avatars/02.png" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", mobile: "456-789-0123", gender: "Male", status: "Active", avatar: "/avatars/03.png" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", mobile: "789-012-3456", gender: "Female", status: "Active", avatar: "/avatars/04.png" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", mobile: "321-654-0987", gender: "Male", status: "Inactive", avatar: "/avatars/05.png" },
]
function CustomTooltip({ text, maxLength }: { text: string; maxLength: number }) {
  const [isHovered, setIsHovered] = useState(false);
  if (text.length <= maxLength) return <span>{text}</span>;
  return (
    <div
      className="relative inline-block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{text.slice(0, maxLength)}...</span>
      {isHovered && (
        <div className="absolute left-0 top-full mt-2 z-50 p-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap">
          {text}
        </div>
      )}
    </div>
  );
}
const TableHeader = ({ children, sortable = false }: { children: React.ReactNode; sortable?: boolean }) => (
  <th className="px-6 py-4 bg-gray-50 text-left text-sm font-semibold text-gray-900">
    <div className="flex items-center space-x-2">
      <span>{children}</span>
      {sortable && (
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    </div>
  </th>
);
export default function EnhancedOwnerTable() {
  const [owners, setOwners] = useState<Owner[]>(initialOwners)
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return;
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Owner[]
        
        const newOwners = jsonData.map((item, index) => ({
          ...item,
          id: owners.length + index + 1,
          status: item.status as 'Active' | 'Inactive',
          avatar: `/avatars/0${(index % 5) + 1}.png`
        }))
        
        setOwners([...owners, ...newOwners])
      } catch (error) {
        console.error('Error processing file:', error)
        alert('Error processing file. Please ensure it\'s a valid Excel file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }
  const filteredOwners = owners.filter(owner =>
    Object.values(owner)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
  return (
    <div className="min-h-screen w-full bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Customers ({owners.length})
          </h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search customers..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => alert('Add customer feature coming soon')}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
            
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Import Excel
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200">
              <thead>
                <tr className="group">
                  <TableHeader>ID</TableHeader>
                  <TableHeader sortable>Name</TableHeader>
                  <TableHeader sortable>Email</TableHeader>
                  <TableHeader>Mobile</TableHeader>
                  <TableHeader>Gender</TableHeader>
                  <TableHeader sortable>Status</TableHeader>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {filteredOwners.map((owner, index) => (
                  <tr 
                    key={owner.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={owner.avatar} alt={owner.name} />
                          <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CustomTooltip text={owner.name} maxLength={20} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CustomTooltip text={owner.email} maxLength={25} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {owner.mobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {owner.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        owner.status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {owner.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}