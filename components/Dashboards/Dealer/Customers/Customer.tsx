"use client";
import { useState, useRef, useEffect } from "react";
import type React from "react";
import { MoreHorizontal, Plus, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import AddCustomerModal from "../Modals/AddCustomerModal";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { CircularProgress } from "@mui/material";

interface Owner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  gender: string;
  status: "Active" | "Inactive";
  image?: string;
  city?: string;
  dealer_id?: string;
  base_id?: string;
}

function CustomTooltip({
  text,
  maxLength,
}: {
  text: string;
  maxLength: number;
}) {
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

// Added 'className' prop for custom styling
const TableHeader = ({
  children,
  sortable = false,
  className = "",
}: {
  children: React.ReactNode;
  sortable?: boolean;
  className?: string;
}) => (
  <th className={`px-4 py-3 text-left text-xs font-semibold text-white ${className}`}>
    <div className="flex items-center space-x-2">
      <span>{children}</span>
      {sortable && (
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 text-white hover:bg-white/10 h-6 w-6 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    </div>
  </th>
);

export default function EnhancedOwnerTable() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cookie } = useCookie();
  const dealerUser = cookie?.get("user");
  const access_token = cookie?.get("access_token");

  // Fetch dealer info and customers (No changes needed here)
  function fetchCustomers() {
    if (!dealerUser?.userId) {
      errorMessage("User not found. Please login again.");
      console.error("User or userId is missing:", { dealerUser, userId: dealerUser?.userId });
      setFetching(false);
      return;
    }

    if (!access_token) {
      errorMessage("Access token not found. Please login again.");
      console.error("Access token is missing");
      setFetching(false);
      return;
    }

    console.log("=== Starting fetchCustomers ===");
    setFetching(true);

    renderInstance
      .get("/dealer", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((dealerRes) => {
        console.log("✅ Dealer API Response:", dealerRes.data);

        if (!Array.isArray(dealerRes.data) || dealerRes.data.length === 0) {
          errorMessage("Dealer information not found.");
          setFetching(false);
          return Promise.reject("No dealer data");
        }

        const fetchedDealerId = dealerRes.data[0].id;
        
        console.log("Fetched dealer_id:", fetchedDealerId);
        console.log("Now fetching customers with URL:", `/dealer/customers/all?dealer_id=${fetchedDealerId}`);

        return renderInstance.get(`/dealer/customers/all?dealer_id=${fetchedDealerId}`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
      })
      .then((customersRes) => {
        console.log("✅ Customers API Response:", customersRes.data);

        let customersData = [];
        if (Array.isArray(customersRes.data)) {
          customersData = customersRes.data;
        } else if (customersRes.data?.customers && Array.isArray(customersRes.data.customers)) {
          customersData = customersRes.data.customers;
        } else if (customersRes.data?.data && Array.isArray(customersRes.data.data)) {
          customersData = customersRes.data.data;
        } else {
          console.warn("⚠️ Unexpected response structure:", customersRes.data);
          customersData = [];
        }

        console.log("📊 Processed customers data:", customersData);
        setOwners(customersData);

        if (customersData.length > 0) {
          successMessage(`Loaded ${customersData.length} customers`);
        } else {
          console.log("No customers found in the response");
        }
      })
      .catch((err) => {
        if (err === "No dealer data") {
          console.error("Stopping fetch because no dealer data was found.");
          setOwners([]);
          return;
        }
        
        console.error("❌ Error fetching data:", err);
        if (err.response?.status === 401) {
          errorMessage("Unauthorized. Please login again.");
        } else if (err.response?.status === 404) {
          console.log("404 - No customers found, setting empty array");
          setOwners([]);
        } else {
          errorMessage("Error fetching customers");
        }
      })
      .finally(() => {
        console.log("=== fetchCustomers completed ===");
        setFetching(false);
      });
  }

  useEffect(() => {
    if (dealerUser?.userId && access_token) {
      fetchCustomers();
    } else {
      setFetching(false);
    }
  }, [dealerUser?.userId, access_token]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        console.log('Excel data to upload:', jsonData);
      } catch (error) {
        console.error("Error processing file:", error);
        errorMessage("Error processing file. Please ensure it's a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddCustomer = () => {
    fetchCustomers();
    setShowAddModal(false);
  };

  const filteredOwners = owners.filter((owner) =>
    Object.values(owner)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (fetching) {
    return (
      <div className="w-full p-6">
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm">
          <CircularProgress size={48} />
          <p className="mt-4 text-lg text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 sm:p-8">
      <div className="w-full max-w-full">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h1 className="text-2xl font-bold text-[#F91F1F]">
              Customers ({owners.length})
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search Customers..."
                  className="pl-10 w-full h-12 border border-gray-300 shadow-md focus:shadow-lg focus:ring-2 focus:ring-[#F91F1F]/50 focus:border-[#F91F1F] transition-all duration-200 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button
                  className="bg-[#F91F1F] hover:bg-[#E01010] text-white shadow-lg h-12 font-medium"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
                <Button
                  className="bg-[#F76A1E] hover:bg-[#E55A0E] text-white shadow-lg h-12 font-medium"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" /> Import Excel
                </Button>
              </div>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />
        </div>

        {/* Table Container */}
        {filteredOwners.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg">
             <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <div className="h-12 w-12 text-gray-400 text-2xl">👤</div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {searchTerm ? "No matching customers" : "No customers available"}
            </h2>
            <p className="text-gray-500 mb-6">
                {searchTerm
                    ? "Try a different search term."
                    : "Add a new customer to get started."}
            </p>
            <Button onClick={fetchCustomers} className="bg-red-500 hover:bg-red-600">
                Refresh Data
            </Button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg shadow-xl overflow-x-auto">
            <table className="w-full min-w-[1024px]">
              <thead className="border-b border-white/20">
                <tr className="group">
                  <TableHeader className="w-16 text-center">ID</TableHeader>
                  <TableHeader className="w-24 text-center">Image</TableHeader>
                  <TableHeader sortable className="w-64">Name</TableHeader>
                  <TableHeader sortable className="w-64">Email</TableHeader>
                  <TableHeader className="w-40">Mobile</TableHeader>
                  <TableHeader className="w-32 text-center">Gender</TableHeader>
                  <TableHeader className="w-40">City</TableHeader>
                  <TableHeader sortable className="w-32 text-center">Status</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredOwners.map((owner, index) => (
                  <tr
                    key={owner.id}
                    className="hover:bg-white/10 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-white">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Avatar className="h-10 w-10 mx-auto">
                        <AvatarImage
                          src={owner.image || "/placeholder.svg"}
                          alt={`${owner.first_name} ${owner.last_name}`}
                        />
                        <AvatarFallback>
                          {owner.first_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-medium">
                      <CustomTooltip text={`${owner.first_name} ${owner.last_name}`} maxLength={20} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      <CustomTooltip text={owner.email} maxLength={25} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {owner.mobile}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-white">
                      {owner.gender}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {owner.city || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold text-white w-20 shadow-md ${
                          owner.status === "Active"
                            ? "bg-[#F76A1E]"
                            : "bg-gray-500"
                        }`}
                      >
                        {owner.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCustomer}
      />
    </div>
  );
}