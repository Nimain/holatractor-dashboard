"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
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
// import { isNumberObject } from "util/types";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { useParams, useRouter } from "next/navigation";
import { Backdrop } from "@mui/material";

const AddAttachment = ({
  alreadyTractors,
}: {
  alreadyTractors: AttachmentInStore[];
}) => {
  const [open, setOpen] = useState(false);
  const [selectedTractorId, setSelectedTractorId] = useState("");
  const [allTractors, setAllTractors] = useState<Attachment[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File[]>([]);
  const [hourlyPrice, setHourlyPrice] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [creating, setCreating] = useState(false)

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const { slug } = useParams()
  const { refresh } = useRouter()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImage((prevImages) => [...prevImages, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: false,
  });

  function fetchAllTractors() {
    if (access_token) {
      setFetchingRoles(true);
      renderInstance
      .get("/attachment", {headers: {
        Authorization: `Bearer ${access_token}`,
    }})
        .then((res) => {
          if (res.status === 200) {
            const availableTractors = res.data.filter(
              (tractor: Attachment) =>
                !alreadyTractors.some(
                  (existingTractor) =>
                    existingTractor.baseAttachmentId === tractor.id
                )
            );
            setAllTractors(availableTractors);
          }
        })
        .catch((err) => {
          errorMessage("Error in fetching inventory lists");
        })
        .finally(() => {
          setFetchingRoles(false);
        });
    } else errorMessage("Admin not logged in");
  }

  useEffect(() => {
    fetchAllTractors();
  }, []);

  async function saveTractor() {
    if (!selectedImage) {
      errorMessage("Please give at least one image");
      return;
    }

    if (!hourlyPrice) {
      errorMessage("Please give the price details");
      return;
    }

    // if (!isNumberObject(hourlyPrice)) {
    //   errorMessage("Please enter a valid price");
    //   return;
    // }
    let storeImages = "";

    if (selectedImage.length > 0) {
      setImageUploading(true);
      const buffer = Buffer.from(await selectedImage[0].arrayBuffer());
      storeImages = await uploadFileToS3(buffer, selectedImage[0].name);
      setImageUploading(false);
    }

    const addTractorDto = {
      attachment_ids: [selectedTractorId],
      hourly_price: hourlyPrice,
      images: storeImages,
      store_id: slug
    }

    setCreating(true)
    renderInstance.post('/store/addAttachments', addTractorDto, {
      headers: {
        Authorization: `Bearer ${access_token}`,
    }
    }).then((res)=>{
      successMessage("Successful")
      refresh()
    }).catch((err)=>{
      errorMessage("Some error occurred")
    }).finally(()=>{setCreating(false)})
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          name="new_tractor_add"
          className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto"
          onClick={() => {
            setOpen(true);
          }}
        >
          <AddIcon />
          <span>Add attachment</span>
        </button>
      </DialogTrigger>

      <DialogContent
        className="bg-white max-h-[90vh] w-[90vw] max-w-[900px] overflow-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <DialogHeader>
          <p className="text-2xl font-bold text-center">
            {selectedTractorId
              ? "Give the following details"
              : "Select a tractor"}
          </p>
        </DialogHeader>

        <div
          className={`bg-white rounded-xl p-[30px] ${
            !selectedTractorId && "grid grid-cols-4"
          } gap-5 relative overflow-auto`}
          style={{ scrollbarWidth: "none" }}
        >
          {fetchingRoles ? (
            "Wait a minute. Loading..."
          ) : allTractors.length === 0 ? (
            "No tractors available to show"
          ) : selectedTractorId ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-5">
              <div
                {...getRootProps()}
                className="dropzone text-center border-dashed border-2 border-gray-300 p-6 rounded-md w-full"
              >
                <input {...getInputProps()} />
                <p className="text-gray-600">
                  Drag 'n' drop an image here, or click to select one
                </p>
              </div>
              <div className="w-full my-[4px] flex items-center flex-wrap gap-[20px]">
                {selectedImage.length > 0 &&
                  selectedImage.map((image, index) => (
                    <Image
                      alt="image"
                      src={URL.createObjectURL(image)}
                      key={index}
                      width={80}
                      height={80}
                      className="object-cover w-[80px] h-[80px] cursor-pointer rounded-md"
                    />
                  ))}
              </div>
              <div className="flex flex-col gap-[4px] w-full">
                <label className="text-[18px]">Hourly price</label>
                <div className="px-[10px] py-[4px] border border-black rounded-md text-[16px]">
                  <input
                    type="text"
                    placeholder="Hourly price"
                    className="outline-none bg-transparent border-none w-full"
                    value={hourlyPrice}
                    onChange={(e) => {
                      setHourlyPrice(e.target.value);
                    }}
                  />
                </div>
              </div>

              <button
                className="px-5 py-2 bg-black text-white rounded-md mx-auto"
                name="save tractor button"
                onClick={() => {
                  saveTractor();
                }}
              >
                Save
              </button>
            </div>
          ) : (
            allTractors.map((details, index) => {
              return (
                <div
                  key={index}
                  className={`border-2 rounded-xl flex flex-col gap-5 p-2`}
                >
                  {details.images.length === 0 ? (
                    <Image
                      src={"https://wallpapercave.com/wp/wp13088808.jpg"}
                      alt="tractor_image"
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
                      className="w-full h-full"
                    >
                      {details.images.map((image, i) => {
                        return (
                          <SwiperSlide key={i}>
                            <Image
                              src={image}
                              alt="tractor_image"
                              className="w-full h-full object-cover rounded-xl"
                              width={300}
                              height={400}
                              unoptimized={true}
                            />
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                  )}

                  <div>
                    <strong>{details.name}</strong>
                    <p>
                      <strong>Description:</strong>
                      <span>{details.description}</span>
                    </p>
                  </div>

                  <button
                    name="select button"
                    className="px-4 py-2 bg-black text-white rounded-md mx-auto w-full"
                    onClick={() => {
                      setSelectedTractorId(details.id);
                    }}
                  >
                    Select
                  </button>
                </div>
              );
            })
          )}
        </div>

        <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={creating || imageUploading}>

                  {
                    creating && <p>Adding to store</p>
                  }
                  {
                    imageUploading && <p>Uploading image</p>
                  }

                </Backdrop>
      </DialogContent>
    </Dialog>
  );
};

export default AddAttachment;
