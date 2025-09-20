"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback, SetStateAction } from "react";
import AddIcon from "@mui/icons-material/Add";
import { Inventory, AttachmentInStore, Attachment } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { useParams, useRouter } from "next/navigation";
import { Backdrop, Slider, SliderProps } from "@mui/material";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AddAttachment = ({
  alreadyTractors,
}: {
  alreadyTractors: AttachmentInStore[];
}) => {
  // Modal and flow states
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Attachment selection states
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);
  
  // Form states
  const [attachmentFormData, setAttachmentFormData] = useState({
    name: '',
    description: '',
    hourly_price: '',
    category: '',
    image_url: ''
  });
  
  // Price setting states
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [creating, setCreating] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");
  const { slug } = useParams();
  const { refresh } = useRouter();

  // Reset modal state when opening/closing
  const resetModalState = () => {
    setShowForm(false);
    setSelectedAttachment(null);
    setAttachmentFormData({
      name: '',
      description: '',
      hourly_price: '',
      category: '',
      image_url: ''
    });
    setMinPrice(0);
    setMaxPrice(1000);
  };

  // Fetch all attachments
  const fetchAllAttachments = useCallback(() => {
    if (!access_token) {
      errorMessage("Admin not logged in");
      return;
    }

    setFetchingAttachments(true);
    renderInstance
      .get("/attachment", {
        headers: { Authorization: `Bearer ${access_token}` }
      })
      .then((res) => {
        if (res.status === 200) {
          setAllAttachments(res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching attachments:", err);
        errorMessage("Error in fetching attachment lists");
      })
      .finally(() => {
        setFetchingAttachments(false);
      });
  }, [access_token]);


  // Handle attachment selection
  const handleAttachmentSelect = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setAttachmentFormData({
      name: attachment.name,
      description: attachment.description,
      hourly_price: '',
      category: attachment.category || '',
      image_url: attachment.images[0] || ''
    });
    setShowForm(true);
  };

  // Save attachment to store
  const saveAttachmentToStore = async () => {
    if (!attachmentFormData.hourly_price) {
      errorMessage("Hourly price is required");
      return;
    }

    const hourlyPrice = parseFloat(attachmentFormData.hourly_price);
    if (hourlyPrice > maxPrice || hourlyPrice < minPrice) {
      errorMessage(`Price should be between ${minPrice} and ${maxPrice}`);
      return;
    }

    if (!selectedAttachment) {
      errorMessage("Please select an attachment");
      return;
    }

    const addAttachmentDto = {
      attachment_ids: [selectedAttachment.id],
      hourly_price: attachmentFormData.hourly_price,
      store_id: slug,
    };

    setCreating(true);
    renderInstance
      .post("/store/addAttachments", addAttachmentDto, {
        headers: { Authorization: `Bearer ${access_token}` }
      })
      .then((res) => {
        successMessage("Attachment successfully added to store!");
        setOpen(false);
        resetModalState();
        refresh();
      })
      .catch((err) => {
        console.error("Error adding attachment:", err);
        errorMessage("Some error occurred while adding attachment");
      })
      .finally(() => {
        setCreating(false);
      });
  };

  useEffect(() => {
    fetchAllAttachments();
  }, [fetchAllAttachments]);

  // Render attachment selection
  const renderAttachmentSelection = () => {
    if (fetchingAttachments) {
      return (
        <div className="flex items-center justify-center py-10">
          <p>Loading attachments...</p>
        </div>
      );
    }

    if (allAttachments.length === 0) {
      return (
        <div className="flex items-center justify-center py-10">
          <p>No attachments available to show</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allAttachments.map((attachment, index) => (
          <div
            key={index}
            className="border-2 rounded-xl flex flex-col gap-3 p-3 hover:shadow-lg transition-shadow"
          >
            {attachment.images.length === 0 ? (
              <Image
                src="https://wallpapercave.com/wp/wp13088808.jpg"
                alt="attachment_image"
                className="w-full h-32 object-cover rounded-xl"
                width={300}
                height={400}
                unoptimized={true}
              />
            ) : (
              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={0}
                slidesPerView={1}
                loop={true}
                pagination={true}
                autoplay={true}
                className="w-full h-32"
              >
                {attachment.images.map((image, i) => (
                  <SwiperSlide key={i}>
                    <Image
                      src={image}
                      alt="attachment_image"
                      className="w-full h-full object-cover rounded-xl"
                      width={300}
                      height={400}
                      unoptimized={true}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}

            <div className="flex-1">
              <h3 className="font-semibold text-sm">{attachment.name}</h3>
              <p className="text-xs text-gray-600 mt-1">
                {attachment.description}
              </p>
              {attachment.category && (
                <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                  {attachment.category}
                </p>
              )}
            </div>

            <button
              className="px-3 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
              onClick={() => handleAttachmentSelect(attachment)}
            >
              Select
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Render price setting form
  const renderAttachmentForm = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Attachment Details</h3>
          <button
            onClick={() => setShowForm(false)}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium">Selected Attachment:</h4>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Name:</strong> {selectedAttachment?.name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Description:</strong> {selectedAttachment?.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="attachmentName">Attachment Name</Label>
            <Input
              id="attachmentName"
              type="text"
              value={attachmentFormData.name}
              onChange={(e) => setAttachmentFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyPrice">Hourly Price ($)</Label>
            <Input
              id="hourlyPrice"
              type="number"
              placeholder={`Enter price between ${minPrice} - ${maxPrice}`}
              value={attachmentFormData.hourly_price}
              min={minPrice}
              max={maxPrice}
              onChange={(e) => setAttachmentFormData(prev => ({
                ...prev,
                hourly_price: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              type="text"
              value={attachmentFormData.category}
              onChange={(e) => setAttachmentFormData(prev => ({
                ...prev,
                category: e.target.value
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={attachmentFormData.image_url}
              onChange={(e) => setAttachmentFormData(prev => ({
                ...prev,
                image_url: e.target.value
              }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={attachmentFormData.description}
            onChange={(e) => setAttachmentFormData(prev => ({
              ...prev,
              description: e.target.value
            }))}
          />
        </div>

        {attachmentFormData.image_url && (
          <div className="space-y-2">
            <Label>Image Preview</Label>
            <div className="w-full h-48 border rounded-lg overflow-hidden">
              <Image
                src={attachmentFormData.image_url}
                alt="attachment_preview"
                className="w-full h-full object-cover"
                width={400}
                height={200}
                unoptimized={true}
              />
            </div>
          </div>
        )}

        <button
          className="w-full px-5 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-300"
          onClick={saveAttachmentToStore}
          disabled={!attachmentFormData.hourly_price || creating}
        >
          {creating ? "Adding to Store..." : "Add Attachment to Store"}
        </button>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetModalState();
      }}>
        <DialogTrigger asChild>
          <button
            className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto"
            onClick={() => setOpen(true)}
          >
            <AddIcon />
            <span>Add attachment</span>
          </button>
        </DialogTrigger>

        <DialogContent
          className="bg-white max-h-[90vh] w-[90vw] max-w-[1000px] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="p-6">
            {showForm ? (
              renderAttachmentForm()
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">Select Attachment</h2>
                {renderAttachmentSelection()}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={creating}
      >
        {creating && <p>Adding attachment to store...</p>}
      </Backdrop>
    </>
  );
};

export default AddAttachment;