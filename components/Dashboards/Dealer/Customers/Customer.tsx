"use client";
import { useState, useRef, useEffect } from "react";
import type React from "react";
import { MoreHorizontal, Plus, Upload, Search, Edit2, Trash2, X } from "lucide-react";
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
        <div className="absolute left-0 top-full mt-2 z-50 p-2 bg-gray-800 text-white text-sm rounded shadow-lg whitespace-nowrap max-w-xs break-words">
          {text}
        </div>
      )}
    </div>
  );
}

// Mobile Customer Card Component
const MobileCustomerCard = ({
  owner,
  index,
  onEdit,
  onDelete,
}: {
  owner: Owner;
  index: number;
  onEdit: (owner: Owner) => void;
  onDelete: (owner: Owner) => void;
}) => (
  <div className="bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg shadow-md p-4 space-y-3 border border-gray-200">
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={owner.image || "/placeholder.svg"}
            alt={`${owner.first_name} ${owner.last_name}`}
          />
          <AvatarFallback className="bg-[#F91F1F] text-white">
            {owner.first_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-white">
            {owner.first_name} {owner.last_name}
          </h3>
          <p className="text-xs text-white">ID: {index + 1}</p>
        </div>
      </div>
      <span
        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${
          owner.status === "Active" ? "bg-[#F76A1E]" : "bg-gray-500"
        }`}
      >
        {owner.status}
      </span>
    </div>

    <div className="space-y-2 text-sm">
      <div className="flex items-start">
        <span className="font-medium text-white w-20 flex-shrink-0">Email:</span>
        <span className="text-white break-all">{owner.email}</span>
      </div>
      <div className="flex items-start">
        <span className="font-medium text-white w-20 flex-shrink-0">Mobile:</span>
        <span className="text-white">{owner.mobile}</span>
      </div>
      <div className="flex items-start">
        <span className="font-medium text-white w-20 flex-shrink-0">Gender:</span>
        <span className="text-white">{owner.gender}</span>
      </div>
      {owner.city && (
        <div className="flex items-start">
          <span className="font-medium text-white w-20 flex-shrink-0">City:</span>
          <span className="text-white">{owner.city}</span>
        </div>
      )}
    </div>

    <div className="flex gap-2 pt-2 border-t border-gray-100">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border-[#F91F1F] text-[#F91F1F] hover:bg-[#F91F1F] hover:text-white"
        onClick={() => onEdit(owner)}
      >
        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
        onClick={() => onDelete(owner)}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Delete
      </Button>
    </div>
  </div>
);

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customerName: string;
  isDeleting: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Confirm Delete</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Are you sure you want to delete <strong>{customerName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-sm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <CircularProgress size={16} className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Edit Customer Modal Component
const EditCustomerModal = ({
  isOpen,
  onClose,
  customer,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: Owner | null;
  onSubmit: () => void;
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    gender: '',
    city: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { cookie } = useCookie();
  const access_token = cookie?.get("access_token");

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        mobile: customer.mobile || '',
        gender: customer.gender || '',
        city: customer.city || '',
        status: customer.status || 'Active',
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !access_token) return;

    setIsSubmitting(true);
    try {
      await renderInstance.patch(`/dealer/customers/${customer.id}`, formData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      successMessage('Customer updated successfully');
      onSubmit();
    } catch (error) {
      console.error('Error updating customer:', error);
      errorMessage('Error updating customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Customer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                required
                className="text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Mobile
            </label>
            <Input
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              required
              className="text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F91F1F]/50 focus:border-[#F91F1F]"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F91F1F]/50 focus:border-[#F91F1F]"
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="text-sm"
            />
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#F91F1F] hover:bg-[#E01010] text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={16} className="mr-2" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TableHeader = ({
  children,
  sortable = false,
  className = "",
}: {
  children: React.ReactNode;
  sortable?: boolean;
  className?: string;
}) => (
  <th className={`px-2 sm:px-4 py-3 text-left text-xs font-semibold text-white ${className}`}>
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Owner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cookie } = useCookie();
  const dealerUser = cookie?.get("user");
  const access_token = cookie?.get("access_token");

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

  const handleEditCustomer = (customer: Owner) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    fetchCustomers();
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = (customer: Owner) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!selectedCustomer || !access_token) return;

    setIsDeleting(true);
    try {
      await renderInstance.delete(`/dealer/customers/${selectedCustomer.id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      successMessage('Customer deleted successfully');
      fetchCustomers();
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      errorMessage('Error deleting customer');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOwners = owners.filter((owner) =>
    Object.values(owner)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (fetching) {
    return (
      <div className="w-full p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-lg shadow-sm">
          <CircularProgress size={48} />
          <p className="mt-4 text-base sm:text-lg text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-full">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-[#F91F1F]">
              Customers ({owners.length})
            </h1>
            
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search Customers..."
                className="pl-10 w-full h-10 sm:h-12 border border-gray-300 shadow-md focus:shadow-lg focus:ring-2 focus:ring-[#F91F1F]/50 focus:border-[#F91F1F] transition-all duration-200 rounded-md text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                className="bg-[#F91F1F] hover:bg-[#E01010] text-white shadow-lg h-10 sm:h-12 font-medium text-sm sm:text-base flex-1 sm:flex-initial"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
              <Button
                className="bg-[#F76A1E] hover:bg-[#E55A0E] text-white shadow-lg h-10 sm:h-12 font-medium text-sm sm:text-base flex-1 sm:flex-initial"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Import Excel
              </Button>
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

        {/* Content */}
        {filteredOwners.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg">
            <div className="mx-auto h-20 w-20 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 text-xl sm:text-2xl">👤</div>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "No matching customers" : "No customers available"}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
              {searchTerm
                ? "Try a different search term."
                : "Add a new customer to get started."}
            </p>
            <Button onClick={fetchCustomers} className="bg-red-500 hover:bg-red-600 text-sm sm:text-base">
              Refresh Data
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {filteredOwners.map((owner, index) => (
                <MobileCustomerCard
                  key={owner.id}
                  owner={owner}
                  index={index}
                  onEdit={handleEditCustomer}
                  onDelete={handleDeleteCustomer}
                />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-gradient-to-br from-[#A10A0C] to-[#3B0404] rounded-lg shadow-xl overflow-x-auto">
              <table className="w-full min-w-[1124px]">
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
                    <TableHeader className="w-32 text-center">Actions</TableHeader>
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
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20 h-8 w-8 p-0"
                            onClick={() => handleEditCustomer(owner)}
                            title="Edit Customer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-red-500/30 h-8 w-8 p-0"
                            onClick={() => handleDeleteCustomer(owner)}
                            title="Delete Customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCustomer}
      />

      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSubmit={handleEditSubmit}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCustomer(null);
        }}
        onConfirm={confirmDeleteCustomer}
        customerName={selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}