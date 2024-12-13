"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
import { useParams, useRouter } from "next/navigation";
import { Backdrop } from "@mui/material";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { singleStoreOwnerTranslations } from "../SingleStoreTranslation";

const AddAttachment = ({ alreadyAttachments }: { alreadyAttachments: AttachmentInStore[] }) => {
  const [open, setOpen] = useState(false);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState("");
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hourlyPrice, setHourlyPrice] = useState<number>();

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const { slug } = useParams();

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
    fetchAllAttachments();
  }, []);

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
        successMessage("Attachment added successfully");
      })
      .catch((err) => {
        if (err.response && err.response.status === 404 && err.response.data.message === "Store not present") {
          errorMessage("Store not present")
        } else if (err.response && err.response.status === 404 && err.response.data.message === "User not present") {
          errorMessage("User not present")
        } else if (err.response && err.response.status === 400 && err.response.data.message === "No owner is availalable for this store") {
          errorMessage("No owner is availalable for this store")
        } else if (err.response && err.response.status === 401 && err.response.data.message === "You are not allowed to modify the store") {
          errorMessage("You are not allowed to modify the store")
        } else if (err.response && err.response.status === 409 && err.response.data.message === "No active subscriptions") {
          errorMessage("No active subscriptions")
        } else if (err.response && err.response.status === 409 && err.response.data.message === "Maximum attachments reached") {
          errorMessage("Maximum attachments reached")
        } else if (err.response && err.response.status === 404 && err.response.data.message === "Attachment not found") {
          errorMessage("Attachment not found")
        } else {
          errorMessage("Some error occurred");
        }
      })
      .finally(() => {
        setCreating(false);
        setOpen(false);
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
              <Image
                src="https://holaimagesdata.s3.us-west-2.amazonaws.com/web/serviso/spray_tractor.webp"
                alt="Attachment Icon"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-full"
                unoptimized={true}
              />
            </div>
            <h3 className="text-2xl font-bold text-center"><TranslatedText greetings={singleStoreOwnerTranslations.addNewAttachment} /></h3>
            <p className="text-gray-600 text-center">
            <TranslatedText greetings={singleStoreOwnerTranslations.clickAddNewAttachment} />
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                setOpen(true);
              }}
            >
              <AddIcon className="mr-2" />
              <TranslatedText greetings={singleStoreOwnerTranslations.addAttachment} />
            </Button>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
        <div className="grid gap-4 py-4 grid-cols-2">
          {selectedAttachmentId ? (
            <div className="grid gap-4">
              <Label htmlFor="hourly-price"><TranslatedText greetings={singleStoreOwnerTranslations.hourlyPrice} /> ($)</Label>
              <Input
                id="hourly-price"
                type="number"
                value={hourlyPrice}
                onChange={(e) => setHourlyPrice(Number(e.target.value))}
              />
              <Button onClick={saveAttachment}><TranslatedText greetings={singleStoreOwnerTranslations.saveAttachment} /></Button>
            </div>
          ) : fetchingAttachments ? (
            <p><TranslatedText greetings={singleStoreOwnerTranslations.loadingTractors} />...</p>
          ) : (
            allAttachments.map((attachment) => (
              <div key={attachment.id} className="border p-4 rounded-md">
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={0}
                  slidesPerView={1}
                  loop={true}
                  pagination={true}
                  autoplay={true}
                  className="w-full h-40 mb-4"
                >
                  {attachment.images.map((image, i) => (
                    <SwiperSlide key={i}>
                      <Image
                        src={image}
                        alt="attachment_image"
                        layout="fill"
                        objectFit="cover"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <h3 className="font-bold">{attachment.name}</h3>
                <p className="text-sm text-gray-500">{attachment.description}</p>
                <Button
                  className="mt-2 w-full"
                  onClick={() => setSelectedAttachmentId(attachment.id)}
                >
                  <TranslatedText greetings={singleStoreOwnerTranslations.select} />
                </Button>
              </div>
            ))
          )}
        </div>
        <Backdrop open={creating}>
          <p><TranslatedText greetings={singleStoreOwnerTranslations.addingAttachmentToStore} />...</p>
        </Backdrop>
      </DialogContent>
    </Dialog>
  );
};

export default AddAttachment;
