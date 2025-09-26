"use client";

import { Attachment } from "@/utils/Types/types";
import { 
  Backdrop, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField
} from "@mui/material";
import { useCookie } from "next-cookie";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Eye, DollarSign, Search, User, X, Save, Upload, Trash2, Camera } from "lucide-react";
import Image from "next/image";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import NullImage from "@/assets/AnimateIcons/Attachment.svg";

interface AttachmentsProps {
  theme?: "light" | "dark";
}

const Attachments = ({ theme = "light" }: AttachmentsProps) => {
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [fixedPrice, setFixedPrice] = useState("");
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [updatingAttachment, setUpdatingAttachment] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    fixedPrice: "",
    images: [] as string[]
  });
  
  // Image upload states
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Grid layout for table rows
  const rowLayout = "grid grid-cols-[60px_120px_2fr_2fr_120px_80px] items-center gap-x-4 p-5";

  // Theme classes
  const bgColor = theme === "dark" ? "bg-gray-800" : "bg-white";
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const cardBg = theme === "dark" ? "bg-gray-700" : "bg-[#fafafa]";
  const headerBg = theme === "dark" ? "bg-gray-600" : "bg-[#ededed]";
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-200";
  const inputBg = theme === "dark" ? "bg-gray-600 text-white" : "bg-white text-gray-900";

  function fetchAllAttachments() {
    if (access_token) {
      console.log("🔄 Fetching attachments from API...");
      setFetchingAttachments(true);
      renderInstance
        .get("/attachment", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then((res) => {
          console.log("📥 API Response Status:", res.status);
          console.log("📄 Fetched attachments data:", res.data);
          console.log("📊 Number of attachments:", res.data?.length || 0);
          
          if (res.status === 200) {
            setAllAttachments(res.data);
            console.log("✅ State updated with fetched data");
          }
        })
        .catch((error: unknown) => {
          console.error("❌ Fetch error:", error);
          if (error instanceof Error) {
            console.error("❌ Error message:", error.message);
          }
          if (typeof error === 'object' && error !== null && 'response' in error) {
            const axiosError = error as any;
            console.error("❌ Error response:", axiosError.response?.data);
          }
          errorMessage("Error in fetching attachment lists");
        })
        .finally(() => {
          setFetchingAttachments(false);
          console.log("🏁 Fetch operation completed");
        });
    } else {
      console.error("❌ No access token found");
      errorMessage("Admin not logged in");
    }
  }

  const handleRowClick = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setEditForm({
      name: attachment.name,
      description: attachment.description || "",
      fixedPrice: attachment.fixedPrice?.toString() || "",
      images: attachment.images || []
    });
    setNewImages([]);
    setPreviewImages([]);
    setEditModalOpen(true);
  };

  const handlePriceClick = (e: React.MouseEvent, attachment: Attachment) => {
    e.stopPropagation();
    console.log("💰 Opening price modal for:", attachment);
    setSelectedAttachment(attachment);
    setFixedPrice(attachment.fixedPrice?.toString() || "");
    setPriceModalOpen(true);
  };

  const handleViewClick = (e: React.MouseEvent, attachment: Attachment) => {
    e.stopPropagation();
    setSelectedAttachment(attachment);
    setViewModalOpen(true);
  };

  const handlePriceModalClose = () => {
    setPriceModalOpen(false);
    setSelectedAttachment(null);
    setFixedPrice("");
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedAttachment(null);
    setEditForm({
      name: "",
      description: "",
      fixedPrice: "",
      images: []
    });
    setNewImages([]);
    setPreviewImages([]);
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedAttachment(null);
  };

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validFiles = files.filter(file => validTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      errorMessage("Some files were skipped. Please select only image files (JPEG, PNG, GIF, WebP)");
    }

    // Validate file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validSizeFiles = validFiles.filter(file => file.size <= maxSize);
    
    if (validSizeFiles.length !== validFiles.length) {
      errorMessage("Some files were skipped. Please select files smaller than 5MB");
    }

    // Create preview URLs
    const previews = validSizeFiles.map(file => URL.createObjectURL(file));
    
    setNewImages(prev => [...prev, ...validSizeFiles]);
    setPreviewImages(prev => [...prev, ...previews]);
  };

  // Remove existing image from attachment
  const handleRemoveExistingImage = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Remove new image before upload
  const handleRemoveNewImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index]);
    
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Upload images to server
  const uploadNewImages = async (): Promise<string[]> => {
    if (newImages.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of newImages) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await renderInstance.post('/upload/image', formData, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'multipart/form-data'
          },
        });

        if (response.data?.url) {
          uploadedUrls.push(response.data.url);
        }
      }
      
      console.log("📤 Uploaded image URLs:", uploadedUrls);
      return uploadedUrls;
    } catch (error: unknown) {
      console.error("❌ Image upload error:", error);
      if (error instanceof Error) {
        errorMessage(`Error uploading images: ${error.message}`);
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        errorMessage(`Error uploading images: ${axiosError.response?.data?.message || 'Unknown error'}`);
      } else {
        errorMessage("Error uploading images");
      }
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handlePriceSave = async () => {
    if (selectedAttachment && access_token) {
      setUpdatingPrice(true);
      console.log("🔄 Starting price update for:", selectedAttachment.id);
      console.log("💰 New price:", fixedPrice);
      
      try {
        const requestData = {
          fixedPrice: parseFloat(fixedPrice) || 0
        };
        
        console.log("📤 Sending PATCH request:", requestData);
        
        const response = await renderInstance.patch(
          `/attachment/${selectedAttachment.id}`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            },
          }
        );
        
        console.log("📥 API Response:", response);
        console.log("📊 Response Status:", response.status);
        console.log("📄 Response Data:", response.data);
        
        if (response.status === 200 || response.status === 201) {
          const newPrice = parseFloat(fixedPrice) || 0;
          
          setAllAttachments(prevAttachments => {
            const updated = prevAttachments.map(att => {
              if (att.id === selectedAttachment.id) {
                console.log("🔄 Updating attachment in state:", att.id, "New price:", newPrice);
                return { ...att, fixedPrice: newPrice };
              }
              return att;
            });
            console.log("📱 Updated attachments state:", updated);
            return updated;
          });
          
          successMessage("Fixed price updated successfully");
          handlePriceModalClose();
          
          setTimeout(() => {
            console.log("🔄 Refetching data from backend...");
            fetchAllAttachments();
          }, 500);
        } else {
          console.error("❌ Unexpected response status:", response.status);
          errorMessage("Unexpected response from server");
        }
      } catch (error: unknown) {
        console.error("❌ Price update error:", error);
        if (error instanceof Error) {
          errorMessage(`Error updating fixed price: ${error.message}`);
        } else if (typeof error === 'object' && error !== null && 'response' in error) {
          const axiosError = error as any;
          console.error("❌ Error details:", axiosError.response?.data);
          console.error("❌ Error status:", axiosError.response?.status);
          errorMessage(`Error updating fixed price: ${axiosError.response?.data?.message || 'Unknown error'}`);
        } else {
          errorMessage("Error updating fixed price");
        }
      } finally {
        setUpdatingPrice(false);
      }
    } else {
      console.error("❌ Missing required data:", { 
        selectedAttachment: !!selectedAttachment, 
        access_token: !!access_token 
      });
    }
  };

  const handleEditSave = async () => {
    if (selectedAttachment && access_token) {
      setUpdatingAttachment(true);
      console.log("🔄 Starting attachment update for:", selectedAttachment.id);
      console.log("📝 Form data:", editForm);
      
      try {
        // First, upload new images if any
        const uploadedImageUrls = await uploadNewImages();
        
        // Combine existing images with newly uploaded ones
        const allImages = [...editForm.images, ...uploadedImageUrls];
        
        const requestData = {
          name: editForm.name,
          description: editForm.description,
          fixedPrice: parseFloat(editForm.fixedPrice) || 0,
          images: allImages
        };
        
        console.log("📤 Sending PATCH request:", requestData);
        
        const response = await renderInstance.patch(
          `/attachment/${selectedAttachment.id}`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            },
          }
        );
        
        console.log("📥 API Response:", response);
        console.log("📊 Response Status:", response.status);
        console.log("📄 Response Data:", response.data);
        
        if (response.status === 200 || response.status === 201) {
          setAllAttachments(prevAttachments => {
            const updated = prevAttachments.map(att => {
              if (att.id === selectedAttachment.id) {
                console.log("🔄 Updating attachment in state:", att.id);
                return { 
                  ...att, 
                  name: editForm.name,
                  description: editForm.description,
                  fixedPrice: parseFloat(editForm.fixedPrice) || 0,
                  images: allImages
                };
              }
              return att;
            });
            console.log("📱 Updated attachments state:", updated);
            return updated;
          });
          
          successMessage("Attachment updated successfully");
          handleEditModalClose();
          
          setTimeout(() => {
            console.log("🔄 Refetching data from backend...");
            fetchAllAttachments();
          }, 500);
        } else {
          console.error("❌ Unexpected response status:", response.status);
          errorMessage("Unexpected response from server");
        }
      } catch (error: unknown) {
        console.error("❌ Attachment update error:", error);
        if (error instanceof Error) {
          errorMessage(`Error updating attachment: ${error.message}`);
        } else if (typeof error === 'object' && error !== null && 'response' in error) {
          const axiosError = error as any;
          console.error("❌ Error details:", axiosError.response?.data);
          console.error("❌ Error status:", axiosError.response?.status);
          errorMessage(`Error updating attachment: ${axiosError.response?.data?.message || 'Unknown error'}`);
        } else {
          errorMessage("Error updating attachment");
        }
      } finally {
        setUpdatingAttachment(false);
      }
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter attachments based on search term
  const filteredAttachments = allAttachments.filter(attachment =>
    attachment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attachment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to check if image URL is valid and get display image
  const getDisplayImage = (attachment: Attachment) => {
    if (attachment.images && attachment.images.length > 0) {
      return attachment.images[0];
    }
    return null;
  };

  // Format price for display
  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) return "Not Set";
    return `$${price}`;
  };

  useEffect(() => {
    fetchAllAttachments();
  }, []);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className={`w-full py-5 ${bgColor} ${textColor}`}>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={fetchingAttachments || updatingPrice || updatingAttachment || uploadingImages}
      >
        <CircularProgress />
      </Backdrop>

      {/* Header Section */}
      <div className="w-full flex items-center justify-between gap-5 px-5 mb-5">
        <div>
          <p className="text-xl font-semibold">
            Total Attachments: {allAttachments.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Click on any row to edit • Check console for debug logs
          </p>
        </div>
        <Link
          href="/Attachments/new"
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white w-fit flex items-center justify-center gap-2.5 ml-auto hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          <span>Add Attachment</span>
        </Link>
      </div>

      {/* Search Section */}
      <div className="px-5 mb-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search attachments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 pr-4 py-2 border rounded-lg w-full ${inputBg} ${borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {filteredAttachments.length} results found
        </p>
      </div>

      {/* Table Header */}
      <div className={`${rowLayout} text-lg font-semibold ${headerBg} rounded mt-8 ${textColor}`}>
        <p className="text-center">Sl No</p>
        <p className="text-center">Image</p>
        <p>Name</p>
        <p>Description</p>
        <p className="text-center">Price</p>
        <p className="text-center">Actions</p>
      </div>

      {/* Table Content */}
      <div className="flex flex-col gap-2 mt-5">
        {filteredAttachments.length === 0 ? (
          <div className="w-full min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <Image
                src={NullImage}
                alt="No attachments found"
                className="w-48 h-48 mx-auto opacity-50"
                width={192}
                height={192}
                unoptimized={true}
              />
              <p className="text-gray-400 mt-4">No attachments found</p>
            </div>
          </div>
        ) : (
          filteredAttachments.map((attachment, index) => {
            const displayImage = getDisplayImage(attachment);

            return (
              <div
                key={attachment.id}
                onClick={() => handleRowClick(attachment)}
                className={`${rowLayout} text-base ${cardBg} rounded cursor-pointer transition-colors duration-300 hover:${theme === "dark" ? "bg-gray-600" : "bg-white"} ${textColor} ${borderColor} border`}
              >
                <p className="text-center">{index + 1}</p>

                <div className="w-[50px] h-[50px] flex items-center justify-center">
                  {displayImage ? (
                    <div className="w-full h-full relative">
                      <Image
                        src={displayImage}
                        alt={attachment.name}
                        fill
                        className="rounded-full object-cover"
                        unoptimized={true}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector(".fallback-icon")) {
                            const fallback = document.createElement("div");
                            fallback.className = "fallback-icon w-[50px] h-[50px] bg-gray-300 rounded-full flex items-center justify-center";
                            fallback.innerHTML = '<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-[50px] h-[50px] bg-gray-300 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="truncate font-medium">{attachment.name}</p>
                  <p className="text-xs text-gray-500 truncate">ID: {attachment.id.slice(-8)}</p>
                </div>

                <p className="truncate text-sm">
                  {attachment.description || "No description available"}
                </p>

                <div className="text-center">
                  <span className={`font-medium ${attachment.fixedPrice && attachment.fixedPrice > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formatPrice(attachment.fixedPrice)}
                  </span>
                  <button
                    onClick={(e) => handlePriceClick(e, attachment)}
                    className="p-1 hover:bg-blue-100 rounded transition-colors ml-2"
                    title="Update Price"
                  >
                    <DollarSign size={16} className="text-blue-600" />
                  </button>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    onClick={(e) => handleViewClick(e, attachment)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Price Modal */}
      {priceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${bgColor} rounded-lg p-6 w-[450px] relative ${textColor}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Set Fixed Price</h2>
              <button
                onClick={handlePriceModalClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {selectedAttachment && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    {getDisplayImage(selectedAttachment) ? (
                      <Image
                        src={getDisplayImage(selectedAttachment)!}
                        alt={selectedAttachment.name}
                        width={50}
                        height={50}
                        className="rounded-lg object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedAttachment.name}</h3>
                      <p className="text-sm text-gray-600">Current: ${selectedAttachment.fixedPrice || 0}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fixed Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={fixedPrice}
                      onChange={(e) => {
                        console.log("💰 Price input changed:", e.target.value);
                        setFixedPrice(e.target.value);
                      }}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${borderColor}`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handlePriceModalClose}
                    className="px-4 py-2 rounded border hover:bg-gray-50"
                    disabled={updatingPrice}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePriceSave}
                    disabled={!fixedPrice || parseFloat(fixedPrice) < 0 || updatingPrice}
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {updatingPrice ? "Saving..." : "Save Price"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${bgColor} rounded-lg p-6 w-[600px] relative max-h-[90vh] overflow-y-auto ${textColor}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Attachment</h2>
              <button
                onClick={handleEditModalClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {selectedAttachment && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    {getDisplayImage(selectedAttachment) ? (
                      <Image
                        src={getDisplayImage(selectedAttachment)!}
                        alt={selectedAttachment.name}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Edit className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">Editing Attachment</p>
                      <p className="text-sm text-gray-600">ID: {selectedAttachment.id}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Attachment Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    placeholder="Enter attachment name"
                    className={`w-full border rounded-lg p-3 ${inputBg} ${borderColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    placeholder="Enter attachment description"
                    rows={3}
                    className={`w-full border rounded-lg p-3 ${inputBg} ${borderColor} focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fixed Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editForm.fixedPrice}
                      onChange={(e) => handleEditFormChange('fixedPrice', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${inputBg} ${borderColor}`}
                    />
                  </div>
                </div>

                {/* Image Management Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">
                      Images
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Add Images
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Existing Images */}
                  {editForm.images.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                      <div className="grid grid-cols-3 gap-3">
                        {editForm.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="w-full h-24 relative bg-gray-100 rounded-lg overflow-hidden">
                              <Image
                                src={image}
                                alt={`Current ${index + 1}`}
                                fill
                                className="object-cover"
                                unoptimized={true}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images Preview */}
                  {previewImages.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">New Images (will be uploaded):</p>
                      <div className="grid grid-cols-3 gap-3">
                        {previewImages.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="w-full h-24 relative bg-gray-100 rounded-lg overflow-hidden">
                              <Image
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                                unoptimized={true}
                              />
                              {/* Upload indicator */}
                              <div className="absolute top-1 left-1 bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs">
                                New
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Upload Info */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
                    <p>• Maximum file size: 5MB per image</p>
                    <p>• You can upload multiple images at once</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={handleEditModalClose}
                    className="px-4 py-2 rounded border hover:bg-gray-50"
                    disabled={updatingAttachment || uploadingImages}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={!editForm.name.trim() || updatingAttachment || uploadingImages}
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {updatingAttachment ? "Saving..." : uploadingImages ? "Uploading..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${bgColor} rounded-lg p-6 w-[500px] relative max-h-[90vh] overflow-y-auto ${textColor}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">View Attachment Details</h2>
              <button
                onClick={handleViewModalClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {selectedAttachment && (
              <div className="space-y-6">
                {/* Attachment Images */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Images</h3>
                  {selectedAttachment.images && selectedAttachment.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAttachment.images.map((image, index) => (
                        <div key={index} className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={image}
                            alt={`${selectedAttachment.name} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Camera size={48} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No images available</p>
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Basic Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Attachment ID</p>
                        <p className="text-sm font-mono bg-white px-2 py-1 rounded border">{selectedAttachment.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Fixed Price</p>
                        <p className={`text-sm font-semibold ${selectedAttachment.fixedPrice && selectedAttachment.fixedPrice > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formatPrice(selectedAttachment.fixedPrice)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">Name</p>
                      <p className="text-base">{selectedAttachment.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">Description</p>
                      <p className="text-base">{selectedAttachment.description || "No description available"}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Additional Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Total Images</p>
                        <p>{selectedAttachment.images?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Status</p>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleViewModalClose}
                    className="px-6 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attachments;