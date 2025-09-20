"use client";

import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import { Attachment, AttachmentInStore } from "@/utils/Types/types";
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
import { useParams } from "next/navigation";
import { Backdrop } from "@mui/material";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { singleStoreOwnerTranslations } from "../SingleStoreTranslation";
import { useAddStoreItemContext } from "@/components/wrappers/AddStoreItemProvider";
import { CircleDollarSign, ChevronLeft, Loader2 } from "lucide-react";

const AddAttachment = ({
  alreadyAttachments,
}: {
  alreadyAttachments: AttachmentInStore[];
}) => {
  // Step management
  type Step = "attachment" | "details";
  const [step, setStep] = useState<Step>("attachment");
  
  const [open, setOpen] = useState(false);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hourlyPrice, setHourlyPrice] = useState<number>();

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");
  const { slug } = useParams();
  const { fetchStoreDetails } = useAddStoreItemContext();

  function fetchAllAttachments() {
    if (access_token) {
      setFetchingAttachments(true);
      renderInstance
        .get("/attachment", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then((res) => {
          if (res.status === 200) {
            setAllAttachments(res.data);
          }
        })
        .catch((err) => {
          errorMessage("Error in fetching attachment lists");
        })
        .finally(() => {
          setFetchingAttachments(false);
        });
    } else errorMessage("Admin not logged in");
  }

  useEffect(() => {
    if (open) {
      fetchAllAttachments();
      // Reset state when modal opens
      setStep("attachment");
      setSelectedAttachmentId("");
      setSelectedAttachment(null);
      setHourlyPrice(undefined);
    }
  }, [open]);

  const handleAttachmentSelect = (attachment: Attachment) => {
    setSelectedAttachmentId(attachment.id);
    setSelectedAttachment(attachment);
    setStep("details");
  };

  async function saveAttachment() {
    if (!hourlyPrice) {
      errorMessage("Hourly price is needed");
      return;
    }

    const addAttachmentDto = {
      attachment_ids: [selectedAttachmentId],
      hourly_price: `${hourlyPrice}`,
      store_id: slug,
    };

    setCreating(true);
    renderInstance
      .post("/store/addAttachments", addAttachmentDto, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        fetchStoreDetails();
        successMessage("Attachment added successfully");
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Store not present"
        ) {
          errorMessage("Store not present");
        } else if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "User not present"
        ) {
          errorMessage("User not present");
        } else if (
          err.response &&
          err.response.status === 400 &&
          err.response.data.message === "No owner is availalable for this store"
        ) {
          errorMessage("No owner is availalable for this store");
        } else if (
          err.response &&
          err.response.status === 401 &&
          err.response.data.message ===
            "You are not allowed to modify the store"
        ) {
          errorMessage("You are not allowed to modify the store");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "No active subscriptions"
        ) {
          errorMessage("No active subscriptions");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "Maximum attachments reached"
        ) {
          errorMessage("Maximum attachments reached");
        } else if (
          err.response &&
          err.response.status === 404 &&
          err.response.data.message === "Attachment not found"
        ) {
          errorMessage("Attachment not found");
        } else {
          errorMessage("Some error occurred");
        }
      })
      .finally(() => {
        setCreating(false);
        setOpen(false);
      });
  }

  const getStepTitle = () => {
    switch (step) {
      case "attachment":
        return "Select Attachment";
      case "details":
        return "Additional Attachment Details";
      default:
        return "Add Attachment";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <button
              className="bg-orange-500 text-white px-4 py-2 mr-10 rounded-md font-semibold"
              onClick={() => {
                setOpen(true);
              }}
            >
              + Add Attachment
            </button>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className={`max-w-4xl max-h-[80vh] overflow-hidden flex flex-col ${
        step === "attachment" 
          ? "bg-white border-gray-200 text-red-600" 
          : "bg-gradient-to-r from-[#8c0000] to-[#4d0000] border-[#4d0000] text-white"
      }`}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === "details" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("attachment")}
                className="text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <DialogTitle className={`text-3xl font-bold ${
              step === "attachment" ? "text-red-600" : "text-white"
            }`}>
              {getStepTitle()}
            </DialogTitle>
          </div>
          {step === "attachment" && (
            <h3 className="text-red-500">
              Choose from all the attachments in your inventory
            </h3>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Attachment Selection Step */}
          {step === "attachment" && (
            <div className="space-y-4">
              {fetchingAttachments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2 text-red-600">
                    <TranslatedText
                      greetings={singleStoreOwnerTranslations.loadingTractors}
                    />
                    ...
                  </span>
                </div>
              ) : allAttachments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-red-400">No attachments available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {allAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="border rounded-xl overflow-hidden bg-red-50 border-red-200 cursor-pointer transition-all hover:bg-red-100"
                      onClick={() => handleAttachmentSelect(attachment)}
                    >
                      {/* Image Section with Swiper */}
                      <div className="w-full h-32 overflow-hidden">
                        <Swiper
                          modules={[Autoplay, Pagination]}
                          spaceBetween={0}
                          slidesPerView={1}
                          loop={true}
                          pagination={true}
                          autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                          }}
                          className="w-full h-full"
                        >
                          {attachment.images.map((image, i) => (
                            <SwiperSlide key={i}>
                              <Image
                                src={image}
                                alt="attachment_image"
                                width={300}
                                height={128}
                                className="w-full h-full object-cover"
                                unoptimized={true}
                              />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>

                      {/* Info Section */}
                      <div className="p-4 bg-gradient-to-r from-[#8c0000] to-[#4d0000] h-full">
                        <h3 className="font-semibold text-white text-sm leading-tight">
                          {attachment.name}
                        </h3>
                        <p className="text-xs text-white mt-1 line-clamp-3">
                          {attachment.description}
                        </p>
                        <Button
                          size="sm"
                          className="mt-3 w-full bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                        >
                          <TranslatedText
                            greetings={singleStoreOwnerTranslations.select}
                          />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details Step */}
          {step === "details" && selectedAttachment && (
            <div className="space-y-6">
              {/* Form Fields */}
              <div className="space-y-4">
                {/* Hourly Price */}
                <div>
                  <Label htmlFor="hourly-price" className="flex items-center text-white">
                    <CircleDollarSign className="w-4 h-4" />
                    <span className="ml-2">
                      <TranslatedText
                        greetings={singleStoreOwnerTranslations.hourlyPrice}
                      />{" "}
                      ($)
                    </span>
                  </Label>
                  <Input
                    id="hourly-price"
                    type="number"
                    value={hourlyPrice}
                    onChange={(e) => setHourlyPrice(Number(e.target.value))}
                    className="mt-1 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-white/20">
          {step === "details" && (
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600 w-full"
              onClick={saveAttachment}
              disabled={creating}
            >
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <TranslatedText greetings={singleStoreOwnerTranslations.saveAttachment} />
            </Button>
          )}
        </div>

        <Backdrop open={creating}>
          <p className="text-white">
            <TranslatedText
              greetings={singleStoreOwnerTranslations.addingAttachmentToStore}
            />
            ...
          </p>
        </Backdrop>
      </DialogContent>
    </Dialog>
  );
};

export default AddAttachment;