"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
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
import { useParams, useRouter } from "next/navigation";
import { Backdrop } from "@mui/material";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AddTractor = ({ alreadyTractors }: { alreadyTractors: TractorInStore[] }) => {
  const [open, setOpen] = useState(false);
  const [selectedTractorId, setSelectedTractorId] = useState("");
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [fetchingTractors, setFetchingTractors] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hourlyPrice, setHourlyPrice] = useState<number>();

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const { slug } = useParams();
  const { refresh } = useRouter();

  function fetchAllTractors() {
    if (access_token) {
      setFetchingTractors(true);
      renderInstance
        .get("/inventory")
        .then((res) => {
          if (res.status === 200) {
            setAllTractors(res.data);
          }
        })
        .catch((err) => {
          errorMessage("Error in fetching inventory lists");
        })
        .finally(() => {
          setFetchingTractors(false);
        });
    } else errorMessage("Admin not logged in");
  }

  useEffect(() => {
    fetchAllTractors();
  }, []);

  async function saveTractor() {
    if (!hourlyPrice) {
      errorMessage("Hourly price is needed");
      return;
    }

    const addTractorDto = {
      tractor_ids: [selectedTractorId],
      hourly_price: `${hourlyPrice}`,
      store_id: slug,
    };

    setCreating(true);
    renderInstance
      .post("/store/addTractors", addTractorDto, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        successMessage("Tractor added successfully");
        refresh();
      })
      .catch((err) => {
        console.log(err);
        errorMessage("Some error occurred");
      })
      .finally(() => {
        setCreating(false);
        setOpen(false);
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg w-full 
        min-w-[250px] sm:min-w-[300px] md:min-w-[350px] lg:min-w-[400px] 
        xl:w-[47%] xl:-mt-[8.7rem]">
        <div className="flex flex-col items-center justify-center h-full space-y-2 sm:space-y-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full flex items-center justify-center">
            <Image
              src="https://holaimagesdata.s3.us-west-2.amazonaws.com/web/serviso/land_preparation.webp"
              alt="Tractor Icon"
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-full"
              unoptimized={true}
            />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-center">Add New Tractor</h3>
          <p className="text-xs sm:text-sm text-gray-600 text-center px-2">
            Click to add a new tractor to your inventory
          </p>
          <Button
            className="mt-2 sm:mt-4 text-xs sm:text-sm"
            onClick={() => setOpen(true)}
          >
            <AddIcon className="mr-2 w-4 h-4" />
            Add Tractor
          </Button>
        </div>
      </div>
    </DialogTrigger>

    <DialogContent className="w-[95%] max-w-[425px] p-4 sm:p-6">
      <div className="grid gap-2 sm:gap-4 py-2 sm:py-4">
        {selectedTractorId ? (
          <div className="grid gap-2 sm:gap-4">
            <Label htmlFor="hourly-price" className="text-xs sm:text-sm">
              Hourly Price
            </Label>
            <Input
              id="hourly-price"
              type="number"
              value={hourlyPrice}
              onChange={(e) => setHourlyPrice(Number(e.target.value))}
              className="text-xs sm:text-sm"
            />
            <Button 
              onClick={saveTractor} 
              className="text-xs sm:text-sm"
            >
              Save Tractor
            </Button>
          </div>
        ) : fetchingTractors ? (
          <p className="text-xs sm:text-sm">Loading tractors...</p>
        ) : (
          allTractors.map((tractor) => (
            <div 
              key={tractor.id} 
              className="border p-2 sm:p-4 rounded-md mb-2 sm:mb-4"
            >
              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={0}
                slidesPerView={1}
                loop={true}
                pagination={true}
                autoplay={true}
                className="w-full h-24 sm:h-40 mb-2 sm:mb-4"
              >
                {tractor.tractor.images.map((image, i) => (
                  <SwiperSlide key={i}>
                    <Image
                      src={image}
                      alt="tractor_image"
                      layout="fill"
                      objectFit="cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <h3 className="font-bold text-xs sm:text-sm">{tractor.tractor.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {tractor.tractor.description}
              </p>
              <Button
                className="mt-2 w-full text-xs sm:text-sm"
                onClick={() => setSelectedTractorId(tractor.tractor.id)}
              >
                Select
              </Button>
            </div>
          ))
        )}
      </div>
      <Backdrop open={creating}>
        <p className="text-xs sm:text-sm">Adding tractor to store...</p>
      </Backdrop>
    </DialogContent>
  </Dialog>
  );
};

export default AddTractor;
