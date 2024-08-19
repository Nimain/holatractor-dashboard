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
import { Inventory, TractorInStore } from "@/utils/Types/types";
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

function valuetext(value: any) {
  return `${value}$`;
}

const AddTractor = ({
  alreadyTractors,
}: {
  alreadyTractors: TractorInStore[];
}) => {
  const [open, setOpen] = useState(false);
  const [selectedTractorId, setSelectedTractorId] = useState("");
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File[]>([]);
  const [hourlyPrice, setHourlyPrice] = useState("");
  const [value, setValue] = useState([20, 100000]);
  const [creating, setCreating] = useState(false)

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const { slug } = useParams()
  const { refresh } = useRouter()

  const handleChange: SliderProps['onChange'] = (event, newValue) => {
    setValue(newValue as number[]);
  };

  function fetchAllTractors() {
    if (access_token) {
      setFetchingRoles(true);
      renderInstance
        .get("/inventory")
        .then((res) => {
          if (res.status === 200) {
            const availableTractors = res.data.filter(
              (tractor: Inventory) =>
                !alreadyTractors.some(
                  (existingTractor) =>
                    existingTractor.baseTractorId === tractor.tractor.id
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
      tractor_ids: [selectedTractorId],
      min_price: `${value[0]}`,
      max_price: `${value[1]}`,
      store_id: slug
    }

    setCreating(true)
    renderInstance.post('/store/addTractors', addTractorDto, {
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
          <span>Add tractor</span>
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
                <label className="text-[18px]">
                  Select minimum and maximum price per hour
                </label>
                <Slider
  getAriaLabel={() => 'Temperature range'}
  value={value}
  onChange={handleChange}
  valueLabelDisplay="auto"
  getAriaValueText={valuetext}
/>
              </div>

              <div className="w-full">
                <div className="flex flex-col gap-[4px] w-fit">
                  <label className="text-[18px]">Min price</label>
                  <div className="px-[10px] py-[4px] border border-black rounded-md text-[16px]">
                  <input
                    type="number"
                    placeholder="Hourly price"
                    className="outline-none bg-transparent border-none w-full"
                    value={value[0]}
                    onChange={(e) => {
                      setValue([Number(e.target.value), value[1]]);
                    }}
                  />
                </div>
                </div>
                <div className="flex flex-col gap-[4px] w-fit">
                  <label className="text-[18px]">Max price</label>
                  <div className="px-[10px] py-[4px] border border-black rounded-md text-[16px]">
                  <input
                    type="number"
                    className="outline-none bg-transparent border-none w-full"
                    value={value[1]}
                    onChange={(e) => {
                      setValue([value[0], Number(e.target.value)]);
                    }}
                  />
                </div>
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
                  {details.tractor.images.length === 0 ? (
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
                      {details.tractor.images.map((image, i) => {
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
                    <strong>{details.tractor.name}</strong>
                    <p>
                      <strong>Model:</strong>
                      <span>{details.tractor.model}</span>
                    </p>
                  </div>

                  <button
                    name="select button"
                    className="px-4 py-2 bg-black text-white rounded-md mx-auto w-full"
                    onClick={() => {
                      setSelectedTractorId(details.tractor_id);
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
                open={creating}>

                  {
                    creating && <p>Adding to store</p>
                  }

                </Backdrop>
      </DialogContent>
    </Dialog>
  );
};

export default AddTractor;
