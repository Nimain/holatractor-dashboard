"use client";

import { Attachment } from "@/utils/Types/types";
import { Backdrop, CircularProgress } from "@mui/material";
import { useCookie } from "next-cookie";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Eye,
  DollarSign,
  Search,
  X,
  Save,
  Upload,
  ImageIcon,
  Camera,
} from "lucide-react";
import Image from "next/image";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import NullImage from "@/assets/AnimateIcons/Attachment.svg";

interface AttachmentsProps {
  theme?: "light" | "dark";
}

interface EditFormState {
  name: string;
  description: string;
  fixed_price: string;
  images: string[];
}

const Attachments = ({ theme = "light" }: AttachmentsProps) => {
  // Data states
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [filteredAttachments, setFilteredAttachments] = useState<Attachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Loading states
  const [fetchingAttachments, setFetchingAttachments] = useState(false);
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [updatingAttachment, setUpdatingAttachment] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form states
  const [fixedPrice, setFixedPrice] = useState("");
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    description: "",
    fixed_price: "",
    images: [],
  });

  // Image states
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Grid layout
  const rowLayout =
    "grid grid-cols-[60px_120px_2fr_2fr_120px_80px] items-center gap-x-4 p-5";

  // Theme classes
  const themeClasses = {
    bgColor: theme === "dark" ? "bg-gray-800" : "bg-white",
    textColor: theme === "dark" ? "text-white" : "text-gray-900",
    cardBg: theme === "dark" ? "bg-gray-700" : "bg-[#fafafa]",
    headerBg: theme === "dark" ? "bg-gray-600" : "bg-[#ededed]",
    borderColor: theme === "dark" ? "border-gray-600" : "border-gray-200",
    inputBg:
      theme === "dark" ? "bg-gray-600 text-white" : "bg-white text-gray-900",
    hoverBg: theme === "dark" ? "bg-gray-600" : "bg-white",
  };

  // Fetch attachments from API
  const fetchAllAttachments = async () => {
    if (!access_token) {
      errorMessage("Admin not logged in");
      return;
    }

    setFetchingAttachments(true);
    try {
      const response = await renderInstance.get("/attachment", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (response.status === 200) {
        setAllAttachments(response.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      errorMessage("Error in fetching attachment lists");
    } finally {
      setFetchingAttachments(false);
    }
  };

  // Image validation
  const isValidImageUrl = (url: string): boolean => {
    if (!url || typeof url !== "string") return false;

    try {
      const urlObj = new URL(url);
      if (!["http:", "https:", "data:"].includes(urlObj.protocol)) return false;
    } catch {
      return false;
    }

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
    const isDataUrl = url.startsWith("data:image/");
    const isCloudinaryUrl = url.includes("cloudinary.com");
    const isAwsUrl = url.includes("amazonaws.com");

    return imageExtensions.test(url) || isDataUrl || isCloudinaryUrl || isAwsUrl;
  };

  // Get first valid image
  const getDisplayImage = (attachment: Attachment): string | null => {
    if (!attachment.images?.length) return null;

    const validImages = attachment.images.filter(
      (img) => img && isValidImageUrl(img) && !imageLoadErrors.has(img)
    );

    return validImages.length > 0 ? validImages[0] : null;
  };

  // Safe Image Component
  const SafeImage = ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      setHasError(imageLoadErrors.has(src));
      setIsLoading(!imageLoadErrors.has(src));
    }, [src]);

    if (hasError || !isValidImageUrl(src)) {
      return (
        <div
          className={`bg-gray-200 flex items-center justify-center ${className}`}
        >
          <ImageIcon size={20} className="text-gray-400" />
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover rounded-lg ${
            isLoading ? "opacity-0" : "opacity-100"
          } transition-opacity`}
          unoptimized
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            setImageLoadErrors((prev) => new Set([...prev, src]));
          }}
        />
      </div>
    );
  };

  // Modal handlers
  const handleRowClick = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setEditForm({
      name: attachment.name,
      description: attachment.description || "",
      fixed_price: attachment.fixedPrice?.toString() || "",
      images: attachment.images || [],
    });
    setNewImages([]);
    setPreviewImages([]);
    setEditModalOpen(true);
  };

  const handlePriceClick = (e: React.MouseEvent, attachment: Attachment) => {
    e.stopPropagation();
    setSelectedAttachment(attachment);
    setFixedPrice(attachment.fixedPrice?.toString() || "");
    setPriceModalOpen(true);
  };

  const handleViewClick = (e: React.MouseEvent, attachment: Attachment) => {
    e.stopPropagation();
    setSelectedAttachment(attachment);
    setViewModalOpen(true);
  };

  const closeAllModals = () => {
    setPriceModalOpen(false);
    setEditModalOpen(false);
    setViewModalOpen(false);
    setSelectedAttachment(null);
    setFixedPrice("");
    setEditForm({ name: "", description: "", fixed_price: "", images: [] });
    setNewImages([]);
    setPreviewImages([]);
  };

  // Image handling
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024;

    const validFiles = files.filter((file) => {
      if (!validTypes.includes(file.type)) return false;
      if (file.size > maxSize) return false;
      return true;
    });

    if (validFiles.length !== files.length) {
      errorMessage(
        "Some files were invalid. Only JPEG, PNG, GIF, WebP under 5MB allowed"
      );
    }

    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setNewImages((prev) => [...prev, ...validFiles]);
    setPreviewImages((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (!newImages.length) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of newImages) {
        const formData = new FormData();
        formData.append("image", file);

        const response = await renderInstance.post("/upload/image", formData, {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (response.data?.url) {
          uploadedUrls.push(response.data.url);
        }
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Image upload error:", error);
      errorMessage("Error uploading images");
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  // Save handlers
  const handlePriceSave = async () => {
    if (!selectedAttachment || !access_token) return;

    setUpdatingPrice(true);
    try {
      await renderInstance.patch(
        `/attachment/${selectedAttachment.id}`,
        { fixed_price: fixedPrice },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      setAllAttachments((prev) =>
        prev.map((att) =>
          att.id === selectedAttachment.id
            ? { ...att, fixedPrice: parseFloat(fixedPrice) || 0 }
            : att
        )
      );

      successMessage("Fixed price updated successfully");
      closeAllModals();
      setTimeout(fetchAllAttachments, 500);
    } catch (error) {
      console.error("Price update error:", error);
      errorMessage("Error updating fixed price");
    } finally {
      setUpdatingPrice(false);
    }
  };

  const handleEditSave = async () => {
    if (!selectedAttachment || !access_token) return;

    setUpdatingAttachment(true);
    try {
      const uploadedImageUrls = await uploadNewImages();
      const allImages = [...editForm.images, ...uploadedImageUrls];

      await renderInstance.patch(
        `/attachment/${selectedAttachment.id}`,
        {
          name: editForm.name,
          description: editForm.description,
          fixed_price: editForm.fixed_price,
          images: allImages,
        },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      setAllAttachments((prev) =>
        prev.map((att) =>
          att.id === selectedAttachment.id
            ? {
                ...att,
                name: editForm.name,
                description: editForm.description,
                fixedPrice: parseFloat(editForm.fixed_price) || 0,
                images: allImages,
              }
            : att
        )
      );

      successMessage("Attachment updated successfully");
      closeAllModals();
      setTimeout(fetchAllAttachments, 500);
    } catch (error) {
      console.error("Attachment update error:", error);
      errorMessage("Error updating attachment");
    } finally {
      setUpdatingAttachment(false);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) return "Not Set";
    return `$${price.toFixed(2)}`;
  };

  // Effects
  useEffect(() => {
    fetchAllAttachments();
  }, []);

  useEffect(() => {
    const filtered = allAttachments.filter(
      (attachment) =>
        attachment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attachment.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredAttachments(filtered);
  }, [searchTerm, allAttachments]);

  useEffect(() => {
    return () => {
      previewImages.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  return (
    <div
      className={`w-full py-5 ${themeClasses.bgColor} ${themeClasses.textColor}`}
    >
      <Backdrop
        sx={{ color: "#fff", zIndex: 1301 }}
        open={
          fetchingAttachments ||
          updatingPrice ||
          updatingAttachment ||
          uploadingImages
        }
      >
        <CircularProgress />
      </Backdrop>

      {/* Header */}
      <div className="w-full flex items-center justify-between gap-5 px-5 mb-5">
        <div>
          <p className="text-xl font-semibold">
            Total Attachments: {allAttachments.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Click on any row to edit</p>
        </div>
        <Link
          href="/Attachments/new"
          className="px-5 py-2.5 text-lg rounded-md bg-black text-white flex items-center gap-2.5 hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          <span>Add Attachment</span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search attachments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 pr-4 py-2 border rounded-lg w-full ${themeClasses.inputBg} ${themeClasses.borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {filteredAttachments.length} results found
        </p>
      </div>

      {/* Table Header */}
      <div
        className={`${rowLayout} text-lg font-semibold ${themeClasses.headerBg} rounded mt-8`}
      >
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
                alt="No attachments"
                className="w-48 h-48 mx-auto opacity-50"
                width={192}
                height={192}
                unoptimized
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
                className={`${rowLayout} text-base ${themeClasses.cardBg} rounded cursor-pointer transition-colors hover:${themeClasses.hoverBg} ${themeClasses.borderColor} border`}
              >
                <p className="text-center">{index + 1}</p>

                <div className="w-[60px] h-[60px] relative mx-auto">
                  {displayImage ? (
                    <SafeImage
                      src={displayImage}
                      alt={attachment.name}
                      className="w-[60px] h-[60px]"
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center">
                      <ImageIcon size={24} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="truncate font-medium">{attachment.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    ID: {attachment.id.slice(-8)}
                  </p>
                </div>

                <p className="truncate text-sm">
                  {attachment.description || "No description"}
                </p>

                <div className="text-center">
                  <span
                    className={`font-medium ${
                      attachment.fixedPrice && attachment.fixedPrice > 0
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
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
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="View Attachment"
                  >
                    <Eye size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedAttachment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl my-8 shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative">
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Inventory Management</p>
              <h2 className="text-xl font-bold">Edit Attachment</h2>
              <p className="text-xs text-slate-300 mt-1">Update attachment specifications, fixed pricing, and media gallery.</p>
              <button
                onClick={closeAllModals}
                className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-1.5 transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">Attachment Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  placeholder="e.g. Heavy Duty Disc Harrow"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Detailed Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  placeholder="Equipment condition, compatibility, and technical specs..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Fixed Price ($ USD) *
                </label>
                <input
                  type="number"
                  value={editForm.fixed_price}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      fixed_price: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>

              {/* Existing Images */}
              {editForm.images.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">Current Media Gallery</p>
                  <div className="grid grid-cols-3 gap-3">
                    {editForm.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group w-full h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                      >
                        <SafeImage
                          src={image}
                          alt={`Current ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          className="absolute top-1.5 right-1.5 bg-red-500/90 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Previews */}
              {previewImages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">New Uploads</p>
                  <div className="grid grid-cols-3 gap-3">
                    {previewImages.map((preview, index) => (
                      <div
                        key={index}
                        className="relative group w-full h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                      >
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          fill
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-1.5 right-1.5 bg-red-500/90 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all"
                >
                  <Upload size={14} className="text-emerald-600" />
                  Upload Additional Images
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAllModals}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={updatingAttachment || uploadingImages}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
              >
                {updatingAttachment || uploadingImages ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && selectedAttachment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl my-8 shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative">
            <div className="bg-slate-900 p-6 text-white relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Equipment Details</p>
                  <h2 className="text-xl font-bold">{selectedAttachment.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Fixed Value</p>
                  <p className="text-lg font-bold text-emerald-400">{formatPrice(selectedAttachment.fixedPrice)}</p>
                </div>
              </div>
              <button
                onClick={closeAllModals}
                className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-1.5 transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[calc(90vh-160px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {selectedAttachment.description || "No description provided."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">Gallery Preview</p>
                {selectedAttachment.images?.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedAttachment.images
                      .filter(
                        (img) =>
                          img && isValidImageUrl(img) && !imageLoadErrors.has(img)
                      )
                      .map((image, index) => (
                        <div
                          key={index}
                          className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 shadow-sm group"
                        >
                          <SafeImage
                            src={image}
                            alt={`${selectedAttachment.name} ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-slate-200">
                    <Camera size={36} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">No media uploaded for this attachment</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={closeAllModals}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {priceModalOpen && selectedAttachment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative">
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Pricing Configuration</p>
              <h2 className="text-xl font-bold">Update Fixed Price</h2>
              <p className="text-xs text-slate-300 mt-1">Set the baseline purchase/rental price for {selectedAttachment.name}.</p>
              <button
                onClick={closeAllModals}
                className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-1.5 transition-all text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Fixed Price ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAllModals}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePriceSave}
                disabled={updatingAttachment}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
              >
                {updatingAttachment ? "Updating..." : "Update Price"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attachments;
