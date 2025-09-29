"use client";

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Inventory, Attachment } from "@/utils/Types/types";
import { Avatar, Backdrop, CircularProgress } from "@mui/material";
import { useCookie } from "next-cookie";
import { useState, useEffect, useRef } from "react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import Image from 'next/image';
import NullImage from "@/assets/AnimateIcons/Tractor.svg";
import { 
  Edit, 
  Eye, 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Search,
  Settings,
  Wrench,
  Upload
} from "lucide-react";

interface TractorAttachment {
  id: string;
  tractorId: string;
  attachmentId: string;
  attachment: Attachment;
  quantity: number;
  rentalPrice?: number;
  createdAt: string;
}

const InventorySection = () => {
  const [activeHover, setActiveHover] = useState("");
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [tractorAttachments, setTractorAttachments] = useState<TractorAttachment[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);
  const [updatingTractor, setUpdatingTractor] = useState(false);
  
  // States for image uploading
  const [uploadingImages, setUploadingImages] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedTractor, setSelectedTractor] = useState<Inventory | null>(null);

  // Edit form states
  const [editForm, setEditForm] = useState({
    name: "",
    model: "",
    type: "",
    year: "",
    images: [] as string[] // Added for image management
  });

  // Attachment management states
  const [selectedAttachments, setSelectedAttachments] = useState<{
    [key: string]: { quantity: number; rentalPrice: number }
  }>({});
  const [attachmentSearch, setAttachmentSearch] = useState("");

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  // Fetch all tractors
  function fetchAllTractors() {
    if (access_token) {
      setFetchingRoles(true);
      renderInstance
        .get("/inventory", {
          headers: { Authorization: `Bearer ${access_token}` }
        })
        .then((res) => {
          if (res.status === 200) setAllTractors(res.data);
        })
        .catch((err) => {
          errorMessage("Error in fetching inventory lists");
        })
        .finally(() => {
          setFetchingRoles(false);
        });
    } else errorMessage("Admin not logged in");
  }

  // Fetch all attachments
  function fetchAllAttachments() {
    if (access_token) {
      setFetchingAttachments(true);
      renderInstance
        .get("/attachment", {
          headers: { Authorization: `Bearer ${access_token}` }
        })
        .then((res) => {
          if (res.status === 200) setAllAttachments(res.data);
        })
        .catch((err) => {
          errorMessage("Error in fetching attachments");
        })
        .finally(() => {
          setFetchingAttachments(false);
        });
    }
  }

  // Fetch tractor attachments for a specific tractor
  const fetchTractorAttachments = async (tractorId: string) => {
    if (access_token) {
      try {
        const response = await renderInstance.get(`/tractor/${tractorId}/attachments`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        return response.data || [];
      } catch (error) {
        console.error("Error fetching tractor attachments:", error);
        return [];
      }
    }
    return [];
  };

  // Handle row click - open edit modal
  const handleRowClick = async (tractor: Inventory) => {
    setSelectedTractor(tractor);
    setEditForm({
      name: tractor.tractor.name,
      model: tractor.tractor.model || "",
      type: tractor.tractor.type,
      year: tractor.tractor.year ? new Date(tractor.tractor.year).getFullYear().toString() : "",
      images: tractor.tractor.images || [] // Populate existing images
    });

    // Reset image states
    setNewImages([]);
    setPreviewImages([]);

    const existingAttachments = await fetchTractorAttachments(tractor.id);
    const attachmentMap: { [key: string]: { quantity: number; rentalPrice: number } } = {};
    
    existingAttachments.forEach((ta: TractorAttachment) => {
      attachmentMap[ta.attachmentId] = {
        quantity: ta.quantity,
        rentalPrice: ta.rentalPrice || 0
      };
    });
    
    setSelectedAttachments(attachmentMap);
    setEditModalOpen(true);
  };

  // Handle edit form changes
  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };
  
  // --- START: New Image Handling Functions ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024 && file.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      errorMessage("Some files were invalid. Please select only image files smaller than 5MB.");
    }
    
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setNewImages(prev => [...prev, ...validFiles]);
    setPreviewImages(prev => [...prev, ...previews]);
  };
  
  const handleRemoveExistingImage = (index: number) => {
    setEditForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(previewImages[index]);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (newImages.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    try {
      for (const file of newImages) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await renderInstance.post('/upload/image', formData, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (res.data?.url) uploadedUrls.push(res.data.url);
      }
      return uploadedUrls;
    } catch (error) {
      errorMessage("Error uploading images.");
      return [];
    } finally {
      setUploadingImages(false);
    }
  };
  // --- END: New Image Handling Functions ---

  // Handle attachment selection
  const handleAttachmentToggle = (attachmentId: string) => {
    setSelectedAttachments(prev => {
      const newState = { ...prev };
      if (newState[attachmentId]) {
        delete newState[attachmentId];
      } else {
        newState[attachmentId] = { quantity: 1, rentalPrice: 0 };
      }
      return newState;
    });
  };

  // Update attachment details
  const updateAttachmentDetails = (attachmentId: string, field: 'quantity' | 'rentalPrice', value: number) => {
    setSelectedAttachments(prev => ({
      ...prev,
      [attachmentId]: {
        ...prev[attachmentId],
        [field]: value
      }
    }));
  };

  // Save tractor and attachments
  const handleSaveTractor = async () => {
    if (!selectedTractor || !access_token) return;

    setUpdatingTractor(true);

    try {
      // --- START: Image Upload Logic ---
      const uploadedImageUrls = await uploadNewImages();
      const finalImages = [...editForm.images, ...uploadedImageUrls];
      // --- END: Image Upload Logic ---

      const updateData = {
        name: editForm.name,
        model: editForm.model || null,
        type: editForm.type,
        year: editForm.year ? new Date(`${editForm.year}-01-01`).toISOString() : null,
        images: finalImages // Send the final list of images
      };

      await renderInstance.patch(
        `/inventory/${selectedTractor.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      
      if (Object.keys(selectedAttachments).length > 0) {
        const attachmentUpdates = Object.entries(selectedAttachments).map(
          ([attachmentId, details]) => ({
            attachmentId,
            quantity: details.quantity,
            rentalPrice: details.rentalPrice
          })
        );
        
        await renderInstance.post(
          `/inventory/${selectedTractor.id}/attachments`,
          { attachments: attachmentUpdates },
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
      }
      
      // Update local state immediately
      setAllTractors(prev => prev.map(t =>t.id === selectedTractor.id ? { ...t, tractor: { ...t.tractor, ...updateData } } : t));

      successMessage("Tractor updated successfully");
      handleEditModalClose();

    } catch (error) {
      errorMessage("Error updating tractor");
    } finally {
      setUpdatingTractor(false);
    }
  };

  // Filter attachments for search
  const filteredAttachments = allAttachments.filter(attachment =>
    attachment.name.toLowerCase().includes(attachmentSearch.toLowerCase())
  );

  // Close modals
  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedTractor(null);
    setSelectedAttachments({});
    setEditForm({ name: "", model: "", type: "", year: "", images: [] });
    // Reset image states on close
    setNewImages([]);
    setPreviewImages([]);
  };

  useEffect(() => {
    fetchAllTractors();
    fetchAllAttachments();
  }, []);
  
  // Cleanup preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previewImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  return (
    <div className="w-full py-[20px]">
      <Backdrop
        sx={{ color: "#fff", zIndex: 1301 }}
        open={fetchingRoles || fetchingAttachments || updatingTractor || uploadingImages}
      >
        <CircularProgress />
      </Backdrop>

      {/* Header */}
      <div className="w-full flex items-center justify-between gap-[20px] mb-6">
        <p className="text-[20px]">
          <span className="font-[600]">Total tractors: {allTractors.length}</span>
        </p>
        <Link
          href={"/Inventory/new"}
          className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] hover:bg-gray-800 transition-colors"
        >
          <AddIcon />
          <span>New inventory</span>
        </Link>
      </div>

      {/* Table Header */}
      <div className="text-lg font-semibold flex items-center justify-between gap-4 bg-[#ededed] p-5 rounded mt-8">
        <div className="w-[50px]"></div>
        <div className="flex-1 min-w-[200px]"><p>Tractor name</p></div>
        <div className="flex-1 min-w-[150px]"><p>Model</p></div>
        <div className="flex-1 min-w-[180px]"><p>Category</p></div>
        <div className="flex-1 min-w-[140px]"><p>Date</p></div>
        <div className="flex-1 min-w-[140px]"><p>Status</p></div>
      </div>

      {/* Table Content */}
      <div className="flex flex-col gap-2 mt-4">
        {allTractors.length === 0 ? (
          <div className="w-full min-h-[60vh] flex items-center justify-center">
            <Image
              src={NullImage}
              alt="No tractors found"
              className="w-[400px] h-auto object-cover"
              unoptimized={true}
            />
          </div>
        ) : (
          allTractors.map((tractorDetails) => (
            <div
              key={tractorDetails.id}
              onClick={() => handleRowClick(tractorDetails)}
              className="text-base flex items-center justify-between gap-4 bg-[#fafafa] p-4 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-md"
            >
              <div className="w-[50px]">
                {tractorDetails.tractor.images?.[0] ? (
                  <Image
                    src={tractorDetails.tractor.images[0]}
                    className="w-[50px] h-[50px] rounded-full object-cover"
                    alt={tractorDetails.tractor.name}
                    width={50}
                    height={50}
                    unoptimized={true}
                  />
                ) : (
                  <Avatar />
                )}
              </div>
              <p className="flex-1 min-w-[200px] truncate font-medium">{tractorDetails.tractor.name}</p>
              <p className="flex-1 min-w-[150px] truncate">{tractorDetails.tractor.model ?? "N/A"}</p>
              <p className="flex-1 min-w-[180px] truncate">{tractorDetails.tractor.type}</p>
              <p className="flex-1 min-w-[140px]">
                {tractorDetails.tractor.year ? new Date(tractorDetails.tractor.year).toLocaleDateString() : "N/A"}
              </p>
              <p className="flex-1 min-w-[140px] text-center">
                <span className="px-3 py-1 text-sm rounded-full text-green-800 bg-green-100">Available</span>
              </p>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedTractor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Edit Tractor & Manage Attachments</h2>
              <button onClick={handleEditModalClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN: Tractor Details & Images */}
              <div className="space-y-6">
                {/* Tractor Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Tractor Information</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tractor Name *</label>
                    <input type="text" value={editForm.name} onChange={(e) => handleEditFormChange('name', e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <input type="text" value={editForm.model} onChange={(e) => handleEditFormChange('model', e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type/Category</label>
                    <input type="text" value={editForm.type} onChange={(e) => handleEditFormChange('type', e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <input type="number" value={editForm.year} onChange={(e) => handleEditFormChange('year', e.target.value)} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500" min="1900" max="2030" />
                  </div>
                </div>

                {/* --- START: NEW IMAGE SECTION --- */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-medium text-gray-800">Manage Images</h3>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                      <Upload size={16} /> Add Images
                    </button>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Existing Images */}
                    {editForm.images.map((image, index) => (
                      <div key={image + index} className="relative group">
                        <Image src={image} alt={`Current ${index + 1}`} width={150} height={150} className="w-full h-28 object-cover rounded-lg border" />
                        <button type="button" onClick={() => handleRemoveExistingImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove image">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {/* New Images Preview */}
                    {previewImages.map((preview, index) => (
                      <div key={preview} className="relative group">
                        <Image src={preview} alt={`Preview ${index + 1}`} width={150} height={150} className="w-full h-28 object-cover rounded-lg border border-blue-500" />
                        <button type="button" onClick={() => handleRemoveNewImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove image">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* --- END: NEW IMAGE SECTION --- */}
              </div>

              {/* RIGHT COLUMN: Attachments Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Manage Attachments</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Search attachments..." value={attachmentSearch} onChange={(e) => setAttachmentSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                  {filteredAttachments.map((attachment) => (
                    <div key={attachment.id} className={`p-4 border-b last:border-b-0 ${selectedAttachments[attachment.id] ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <input type="checkbox" checked={!!selectedAttachments[attachment.id]} onChange={() => handleAttachmentToggle(attachment.id)} className="w-4 h-4 text-blue-600" />
                        {attachment.images?.[0] ? <Image src={attachment.images[0]} alt={attachment.name} width={32} height={32} className="rounded-lg object-cover" unoptimized /> : <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center"><Wrench size={14} className="text-gray-500" /></div>}
                        <div className="flex-1">
                          <p className="font-medium">{attachment.name}</p>
                          <p className="text-sm text-gray-500">Fixed Price: ${attachment.fixedPrice || 0}</p>
                        </div>
                      </div>
                      {selectedAttachments[attachment.id] && (
                        <div className="grid grid-cols-2 gap-3 ml-7">
                          <div>
                            <label className="block text-xs font-medium mb-1">Quantity</label>
                            <input type="number" min="1" value={selectedAttachments[attachment.id].quantity} onChange={(e) => updateAttachmentDetails(attachment.id, 'quantity', parseInt(e.target.value) || 1)} className="w-full border rounded p-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Rental Price ($)</label>
                            <input type="number" min="0" step="0.01" value={selectedAttachments[attachment.id].rentalPrice} onChange={(e) => updateAttachmentDetails(attachment.id, 'rentalPrice', parseFloat(e.target.value) || 0)} className="w-full border rounded p-2 text-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  Selected: {Object.keys(selectedAttachments).length} attachment(s)
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
              <button onClick={handleEditModalClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50" disabled={updatingTractor || uploadingImages}>
                Cancel
              </button>
              <button onClick={handleSaveTractor} disabled={!editForm.name.trim() || updatingTractor || uploadingImages} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <Save size={16} />
                {updatingTractor ? "Saving..." : uploadingImages ? "Uploading..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySection;