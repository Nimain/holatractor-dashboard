"use client";

import { useEffect, useState } from "react";
import { Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import Image from "next/image";
import { useCookie } from "next-cookie";
import { Backdrop, CircularProgress } from "@mui/material";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useParams } from "next/navigation";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { AttachmentInStore, TractorInStore } from "@/utils/Types/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const StoreBooking = () => {
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("us");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [startDate, setstartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [BookingHours, setBookingHours] = useState("");
  const [roadName, setRoadName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTractors, setLoadingTractors] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [allTractors, setAllTractors] = useState<TractorInStore[]>([]);
  const [allAttachments, setAllAttachments] = useState<AttachmentInStore[]>([]);

  const [selectedTractorIds, setSelectedTractorIds] = useState<string[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])

  // Step state variables
  const [stepOne, setStepOne] = useState(false)
  const [stepTwo, setStepTwo] = useState(false)
  const [stepThree, setStepThree] = useState(false)
  const [setStepFour, setStepFoursetStepFour] = useState(false)

  const { slug } = useParams();

  const { cookie } = useCookie();
  const user = cookie.get("user");
  const access_token = cookie.get("access_token");

  function fetchTractors() {
    setLoadingTractors(true);
    renderInstance
      .get(`/store/${slug}`)
      .then((res) => {
        setAllTractors(res.data.TractorInStore);
        setAllAttachments(res.data.AttachmentInStore);
      })
      .catch((err) => {
        errorMessage("Error fetching tractors");
        console.log(err);
      })
      .finally(() => {
        setLoadingTractors(false);
      });
  }

  function handleBookClick(tractorId: string) {
    setSelectedTractorIds((prevIds) => {
      if (prevIds.includes(tractorId)) {
        // If already selected, remove it
        return prevIds.filter((id) => id !== tractorId);
      } else {
        // Otherwise, add it
        return [...prevIds, tractorId];
      }
    });
  }

  function handleBookAttachmentClick(attachmentId: string) {
    setSelectedAttachmentIds((prevIds) => {
      if (prevIds.includes(attachmentId)) {
        return prevIds.filter((id) => id !== attachmentId);
      } else {
        return [...prevIds, attachmentId];
      }
    });
  }

  useEffect(() => {
    if (slug) {
      fetchTractors();
    }
  }, [slug]);

  function handleBooking() {
    setLoading(true);
    const booking = {
      location_name: roadName,
      location_address: address,
      location_city: city,
      location_state: state,
      location_zip_code: zipCode,
      location_country: country,
      user_id: user.userId,
      store_id: slug,
      start_date: new Date(startDate),
      end_date: BookingHours === "more" ? new Date(endDate) : new Date(),
      booking_hours: BookingHours === "more" ? "" : BookingHours,
      tractor_ids: selectedTractorIds,
      attachment_ids: selectedAttachmentIds,
    };

    renderInstance
      .post("/booking", booking, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        console.log(res)
        successMessage("Booked successful");
      })
      .catch((err) => {
        errorMessage("Some error occurred");
        console.log(err)
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="w-full h-full flex flex-col gap-5 py-10">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress />
      </Backdrop>

      <Dialog
        open={stepOne} onOpenChange={setStepOne}>

        <DialogContent
          className="bg-white max-h-[90vh] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >

          <Label className="mb-3">
            Booking hours
            </Label>

          <Select
            onValueChange={(value) => {setBookingHours(value)}}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select booking hours" />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="One_Hour">1 hour</SelectItem>
            <SelectItem value="Two_Hours">2 hour</SelectItem>
            <SelectItem value="Three_Hours">3 hour</SelectItem>
            <SelectItem value="Four_Hours">4 hour</SelectItem>
            <SelectItem value="Five_Hours">5 hour</SelectItem>
            <SelectItem value="Six_Hours">6 hour</SelectItem>
            <SelectItem value="Seven_Hours">7 hour</SelectItem>
            <SelectItem value="Eight_Hours">8 hour</SelectItem>
            <SelectItem value="more">More than 8 hours</SelectItem>
            </SelectContent>
          </Select>

        </DialogContent>

      </Dialog>

      <p className="text-2xl font-bold text-center">
        Give your location details
      </p>

      <div className="w-full p-4 grid gap-8 grid-cols-3">
        <div className="mb-4 w-full">
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700"
          >
            Country
          </label>
          <input
            type="text"
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
          />
        </div>

        <div className="mb-4 w-full">
          <label
            htmlFor="zipCode"
            className="block text-sm font-medium text-gray-700"
          >
            Zip Code
          </label>
          <input
            type="text"
            id="zipCode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700"
          >
            City
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700"
          >
            State
          </label>
          <input
            type="text"
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="roadName"
            className="block text-sm font-medium text-gray-700"
          >
            Road Name
          </label>
          <input
            type="text"
            id="roadName"
            value={roadName}
            onChange={(e) => setRoadName(e.target.value)}
            className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="roadName"
            className="block text-sm font-medium text-gray-700"
          >
            Start date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setstartDate(e.target.value)}
            className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="roadName"
            className="block text-sm font-medium text-gray-700"
          >
            Booking hours
          </label>
          <select
            name="bookingHours"
            id="bookingHours"
            onChange={(e) => {
              setBookingHours(e.target.value);
            }}
            className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
          >
            <option defaultChecked={true}>Choose booking hours</option>
            <option value="One_Hour">1 hour</option>
            <option value="Two_Hours">2 hour</option>
            <option value="Three_Hours">3 hour</option>
            <option value="Four_Hours">4 hour</option>
            <option value="Five_Hours">5 hour</option>
            <option value="Six_Hours">6 hour</option>
            <option value="Seven_Hours">7 hour</option>
            <option value="Eight_Hours">8 hour</option>
            <option value="more">More than 8 hours</option>
          </select>
        </div>

        {BookingHours === "more" && (
          <div className="mb-4">
            <label
              htmlFor="roadName"
              className="block text-sm font-medium text-gray-700"
            >
              Start date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full px-2 py-2 text-base border border-gray-300 sm:text-sm rounded-md"
            />
          </div>
        )}
      </div>

      <p className="text-lg font-bold w-full text-left p-4">Tractors:</p>

      <div className="px-4 py-2 w-full">
        {loadingTractors ? (
          <p className="text-center text-lg text-gray-600 font-bold">
            Loading Tractors
          </p>
        ) : allTractors.length === 0 ? (
          <p className="text-center text-lg text-gray-600 font-bold">
            0 Tractors available in this store
          </p>
        ) : (
          <div className="w-full grid gap-5 grid-cols-4">
            {allTractors.map((tractor, index) => {
              return (
                <div
                  key={index}
                  className="w-full drop-shadow-md px-2 rounded-md border flex gap-2 flex-col"
                >
                  <Swiper
                    modules={[Autoplay, Pagination]}
                    spaceBetween={0}
                    slidesPerView={1}
                    loop={true}
                    pagination={true}
                    autoplay={true}
                    className="w-full h-full"
                  >
                    {tractor.baseTractor.images.map((image, index) => {
                      return (
                        <SwiperSlide key={index}>
                          <Image
                            src={image}
                            alt="tractor_image"
                            className="w-full h-40 object-cover rounded-xl"
                            width={300}
                            height={400}
                            unoptimized={true}
                          />
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>

                  <p>
                    <span className="font-medium">Hourly Price: </span>{" "}
                    {tractor.hourly_price}/hr
                  </p>

                  <button
                    name="Book button"
                    className="px-4 py-2 rounded bg-black text-white"
                    onClick={() => {
                      handleBookClick(tractor.id);
                    }}
                  >
                    {selectedTractorIds.includes(tractor.id)
                      ? "Remove"
                      : "Book"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-lg font-bold w-full text-left p-4">Attachments:</p>

      <div className="px-4 py-2 w-full">
        {loadingAttachments ? (
          <p className="text-center text-lg text-gray-600 font-bold">
            Loading Tractors
          </p>
        ) : allAttachments.length === 0 ? (
          <p className="text-center text-lg text-gray-600 font-bold">
            0 Tractors available in this store
          </p>
        ) : (
          <div className="w-full grid gap-5 grid-cols-4">
            {allAttachments.map((tractor, index) => {
              console.log(tractor);
              return (
                <div
                  key={index}
                  className="w-full drop-shadow-md px-2 rounded-md border flex gap-2 flex-col"
                >
                  <Swiper
                    modules={[Autoplay, Pagination]}
                    spaceBetween={0}
                    slidesPerView={1}
                    loop={true}
                    pagination={true}
                    autoplay={true}
                    className="w-full h-full"
                  >
                    {tractor.baseAttachment.images.map((image, index) => {
                      return (
                        <SwiperSlide key={index}>
                          <Image
                            src={image}
                            alt="tractor_image"
                            className="w-full h-40 object-cover rounded-xl"
                            width={300}
                            height={400}
                            unoptimized={true}
                          />
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>

                  <p>
                    <span className="font-medium">Hourly Price: </span>{" "}
                    {tractor.hourly_price}/hr
                  </p>

                  <button
                    name="Book button"
                    className="px-4 py-2 rounded bg-black text-white"
                    onClick={() => {
                      handleBookAttachmentClick(tractor.id);
                    }}
                  >
                    {selectedAttachmentIds.includes(tractor.id)
                      ? "Remove"
                      : "Book"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        name="Book button"
        className="px-4 py-2 rounded bg-black text-white mx-auto mt-2"
        onClick={handleBooking}
      >
        Proceed
      </button>
    </div>
  );
};

export default StoreBooking;
