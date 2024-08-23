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
// import { isNumberObject } from "util/types";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { useParams, useRouter } from "next/navigation";
import { Backdrop, Slider, SliderProps } from "@mui/material";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function valuetext(value: any) {
  return `${value}$`;
}

const AddAttachment = ({
  alreadyTractors,
}: {
  alreadyTractors: AttachmentInStore[];
}) => {
  const [open, setOpen] = useState(false);
  const [selectedTractorId, setSelectedTractorId] = useState("");
  const [allTractors, setAllTractors] = useState<Attachment[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hourlyPrice, setHourlyPrice] = useState<number>();
  const [inventory_id, set_inventoey_id] = useState("")

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const { slug } = useParams();
  const { refresh } = useRouter();

  function fetchAllTractors() {
    if (access_token) {
      setFetchingRoles(true);
      renderInstance
        .get("/attachment", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
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

    const addTractorDto = {
      attachment_ids: [selectedTractorId],
      hourly_price: `${hourlyPrice}`,
      inventory_id,
      store_id: slug,
    };

    setCreating(true);
    renderInstance
      .post("/store/addAttachments", addTractorDto, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        successMessage("Successful");
        refresh();
      })
      .catch((err) => {
        console.log(err)
        errorMessage("Some error occurred");
      })
      .finally(() => {
        setCreating(false);
      });
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
              <div className="flex flex-col gap-[4px] w-full">
                <Label>
                  Hourly price
                </Label>
                <Input
                  type="number"
                  placeholder='Give hourly price'
                  value={hourlyPrice}
                  onChange={e => { setHourlyPrice(Number(e.target.value)) }} />
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
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={creating}
        >
          {creating && <p>Adding to store</p>}
        </Backdrop>
      </DialogContent>
    </Dialog>
  );
};

export default AddAttachment;
