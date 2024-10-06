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
import { AttachmentInStore, Booking, City, Country, Farmer, TractorInStore } from "@/utils/Types/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const StoreBooking = () => {
  const [zipCode, setZipCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [allCountry, setAllCountry] = useState<Country[]>([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [startDate, setstartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [BookingHours, setBookingHours] = useState("");
  const [roadName, setRoadName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTractors, setLoadingTractors] = useState(false);
  const [fetchingContry, setFetchingCountry] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false)

  const [allTractors, setAllTractors] = useState<TractorInStore[]>([]);
  const [allAttachments, setAllAttachments] = useState<AttachmentInStore[]>([]);

  const [selectedTractorIds, setSelectedTractorIds] = useState<string[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])

  const [fetchingFarmers, setFetchingFarmers] = useState(false)
  const [allFarmers, setAllFarmers] = useState<Farmer[]>([])
  const [farmerId, setFarmerId] = useState("")
  const [farmerName, setFarmerName] = useState("")

  // Step state variables
  const [stepOne, setStepOne] = useState(true)
  const [stepTwo, setStepTwo] = useState(false)
  const [stepThree, setStepThree] = useState(false)
  const [stepFour, setStepFour] = useState(false)
  const [stepFive, setStepFive] = useState(false)

  const [booking, setBooking] = useState<Booking | null>(null)
  const [bookingConfirm, setBookingConfirm] = useState(false)
  const [fetchingCity, setFetchingCity] = useState(false);
  const [allcity, setAllCity] = useState<City[]>([]);
  const [popoverOpenCity, setPopoverOpenCity] = useState(false)

  const { slug } = useParams();

  const { cookie } = useCookie();
  const user = cookie.get("user");
  const access_token = cookie.get("access_token");

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
      fetchAllCountry()
      if (!user.isAdmin.includes("farmer")) fetchFarmer()
    }
  }, [slug]);

  function handleBooking() {
    if (!roadName || !address || !city || !state || !zipCode || !countryName) {
      errorMessage("Add proper location details")
      return
    }

    if (!BookingHours) {
      errorMessage("Select booking hours")
      return
    }

    if (!startDate) {
      errorMessage("Select the start date")
      return
    }

    if (BookingHours === "more" && !endDate) {
      errorMessage("Select the end date")
      return
    }

    if (selectedAttachmentIds.length === 0 && selectedTractorIds.length === 0) {
      errorMessage("You need to select at least one item from store")
      return
    }

    if (!user.isAdmin.includes("farmer") && !farmerId) {
      errorMessage("You must select a farmer to book a plot");
      return
    }

    setLoading(true);
    const booking = {
      location_name: roadName,
      location_address: address,
      location_city: city,
      location_state: state,
      location_zip_code: zipCode,
      location_country: countryName,
      user_id: user.isAdmin.includes("farmer") ? user.userId : farmerId,
      store_id: slug,
      start_date: new Date(startDate),
      end_date: BookingHours === "more" ? endDate : new Date(),
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
        if (res.status === 201) {
          setStepFour(false)
          setStepFive(true)
          setBooking(res.data)
        }
      })
      .catch((err) => {
        errorMessage("Some error occurred");
        console.log(err)
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleFetchAvailableItems() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetting the time to midnight

    const selectedStartDate = startDate ? new Date(startDate) : new Date()
    selectedStartDate.setHours(0, 0, 0, 0); // Resetting the time to midnight

    let selectedEndDate = endDate ? new Date(endDate) : null;
    if (selectedEndDate) {
      selectedEndDate.setHours(0, 0, 0, 0); // Resetting the time to midnight
    } else {
      // If end date is not available, set it to one day after the start date
      selectedEndDate = new Date(selectedStartDate);
      selectedEndDate.setDate(selectedStartDate.getDate() + 1);
    }

    // Check if start date is in the past
    if (selectedStartDate < today) {
      errorMessage("Start date can't be in the past");
      return;
    }

    // Check if end date is in the past or if the gap between start and end date is more than 7 days
    if (selectedEndDate) {
      if (selectedEndDate < today) {
        errorMessage("End date can't be in the past");
        return;
      }
      const timeDifference = selectedEndDate.getTime() - selectedStartDate.getTime();
      const dayDifference = timeDifference / (1000 * 3600 * 24);
      if (dayDifference > 7) {
        errorMessage("The gap between start date and end date can't be more than 7 days");
        return;
      }
    }

    if (!user.isAdmin.includes("farmer") && !farmerId) {
      errorMessage("You must select a farmer to book a plot");
      return
    }

    if (!BookingHours) {
      errorMessage("Select booking hours")
      return
    }

    if (!startDate) {
      errorMessage("Select the start date")
      return
    }

    if (BookingHours === "more" && !endDate) {
      errorMessage("Select the end date")
      return
    }

    if (!slug) {
      errorMessage("Store id is not available")
      return
    }

    setStepOne(false)
    setStepTwo(true)

    setLoadingTractors(true);

    // Make the API call with query parameters
    renderInstance.get(`/store/${slug}/get_available_tractors?startDate=${selectedStartDate}&endDate=${selectedEndDate}`)
      .then(response => {
        // Handle the response data here
        setAllTractors(response.data);
      })
      .catch(error => {
        // Handle any errors here
        errorMessage("Failed to fetch available tractors");
      }).finally(() => { setLoadingTractors(false) })

    setLoadingTractors(true);

    // Make the API call with query parameters
    renderInstance.get(`/store/${slug}/get_available_attachments?startDate=${selectedStartDate}&endDate=${selectedEndDate}`)
      .then(response => {
        // Handle the response data here
        console.log(response.data)
        setAllAttachments(response.data);
      })
      .catch(error => {
        // Handle any errors here
        errorMessage("Failed to fetch available tractors");
      }).finally(() => { setLoadingTractors(false) })

  }

  function fetchAllCountry() {
    setFetchingCountry(true);
    renderInstance
      .get("/country")
      .then((res) => {
        setAllCountry(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching country");
      })
      .finally(() => {
        setFetchingCountry(false);
      });
  }

  function handlevalidateAddress() {
    if (!roadName || !address || !city || !state || !zipCode || !countryName) {
      errorMessage("Add proper location details")
      return
    }
    setStepTwo(false)
    setStepThree(true)
  }

  function fetchFarmer() {
    setFetchingFarmers(true)
    renderInstance.get('/farmer')
      .then((res) => { setAllFarmers(res.data) })
      .catch(() => { errorMessage("Error fetching farmers") })
      .finally(() => { setFetchingFarmers(false) })
  }

  const formatDateToDDMMYYYY = (date: string | Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleDateString(undefined, options);
  };

  function userBookingConfirm() {
    if (booking && booking.id) {
      setBookingConfirm(true)
      renderInstance.patch(`/booking/${booking.id}/user_confirm`, {}, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }).then((res) => {
        successMessage("Successfully booked")
        setTimeout(() => {
          setStepFive(false)
        }, 1000);
      }).catch((err) => {
        console.log(err)
        errorMessage("Some error occurred. Please try again...")
      }).finally(() => { setBookingConfirm(false) })
    } else {
      errorMessage("Booking is not available")
    }
  }

  function fetchAllCity() {
    setFetchingCity(true);
    renderInstance
      .get("/city")
      .then((res) => {
        setAllCity(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching cities");
      })
      .finally(() => {
        setFetchingCity(false);
      });
  }

  useEffect(() => {
    if (countryName) {
      fetchAllCity()
    }
  }, [countryName])

  return (
    <div className="w-full h-full flex flex-col gap-5 py-10">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || bookingConfirm}
      >
        <CircularProgress />
      </Backdrop>

      <Dialog
        open={stepOne} onOpenChange={setStepOne}>

        <DialogContent
          className="bg-white max-h-[90vh] w-[400px] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >

          <Label className="mb-3">
            Booking hours
          </Label>

          <Select
            onValueChange={(value) => { setBookingHours(value) }}
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

          {
            BookingHours && <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setstartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          }

          {
            BookingHours === "more" && <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          }

          {
            !user.isAdmin.includes("farmer") && fetchingFarmers ?
              <p>Getting all farmers list</p>
              :
              allFarmers.length === 0 ?
                <p>No farmers are available</p>
                :
                <div className="space-y-1">
                  <Label htmlFor="phonrnumber">Farmer name</Label>
                  <div className="w-full space-y-2">
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          // aria-expanded={popoverOpen}
                          className="w-full justify-between"
                        >
                          {farmerName
                            ? allFarmers.find((country) => `${country.user.first_name} ${country.user.middle_name ? country.user.middle_name : ''} ${country.user.last_name}` === farmerName) && farmerName
                            : "Select farmer..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList>
                            <CommandEmpty>No farmer found.</CommandEmpty>
                            <CommandGroup className='w-full'>
                              {allFarmers.map((country) => {
                                const name = `${country.user.first_name} ${country.user.middle_name ? country.user.middle_name : ''} ${country.user.last_name}`
                                return (
                                  <CommandItem
                                    key={country.id}
                                    value={country.id}
                                    onSelect={(currentValue) => {
                                      setFarmerName(name)
                                      setFarmerId(country.id)
                                      setPopoverOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        countryName === name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {name}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
          }

          <Button
            name="Date continue button"
            onClick={() => { handleFetchAvailableItems() }}>
            Continue
          </Button>

        </DialogContent>

      </Dialog>

      <Dialog
        open={stepTwo} onOpenChange={setStepTwo}>

        <DialogContent
          className="bg-white max-h-[90vh] w-[400px] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >

          <Card>

            <CardContent className="space-y-2 py-2">
              {
                fetchingContry ?
                  <CircularProgress />
                  :
                  allCountry.length === 0 ?
                    <p>No countries are available</p>
                    :
                    <div className="space-y-1">
                      <Label htmlFor="phonrnumber">Country name</Label>
                      <div className="w-full space-y-2">
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              // aria-expanded={popoverOpen}
                              className="w-full justify-between"
                            >
                              {countryName
                                ? allCountry.find((country) => country.name === countryName) && countryName
                                : "Select country..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search country..." />
                              <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup className='w-full'>
                                  {allCountry.map((country) => (
                                    <CommandItem
                                      key={country.name}
                                      value={country.name}
                                      onSelect={(currentValue) => {
                                        setCountryName(country.name)
                                        setPopoverOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          countryName === country.name ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {country.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
              }
              {
                countryName &&
                <div className="space-y-1">
                  <Label htmlFor="location_city">City</Label>
                  {
                    fetchingCity ?
                      <p>Fetching cities</p>
                      :
                      allcity.length === 0 ?
                        <p>No cities are available for this country</p>
                        :
                        <div className="w-full space-y-2">
                          <Popover open={popoverOpenCity} onOpenChange={setPopoverOpenCity}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                // aria-expanded={popoverOpen}
                                className="w-full justify-between"
                              >
                                {city
                                  ? allcity.find((cityDetails) => cityDetails.name === city) && city
                                  : "Select city..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search country..." />
                                <CommandList>
                                  <CommandEmpty>No city found.</CommandEmpty>
                                  <CommandGroup className='w-full'>
                                    {allcity.map((cityDetails) => (
                                      <CommandItem
                                        key={cityDetails.name}
                                        value={cityDetails.name}
                                        onSelect={(currentValue) => {
                                          setCity(cityDetails.name)
                                          setPopoverOpenCity(false)
                                        }}
                                        className={`${countryName !== cityDetails.country.name && "hidden"}`}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            city === cityDetails.name ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {cityDetails.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                  }
                </div>
              }
              {
                city &&
                <div className="space-y-1">
                  <Label htmlFor="location_zip_code">Zip code</Label>
                  <Input
                    id="location_zip_code"
                    placeholder='e.g - 757020'
                    value={zipCode}
                    onChange={e => { setZipCode(e.target.value) }} />
                </div>
              }
              {
                city &&
                <div className="space-y-1">
                  <Label htmlFor="location_name">Address line 1</Label>
                  <Input
                    id="location_name"
                    placeholder='e.g - st mary hiighway'
                    value={roadName}
                    onChange={e => { setRoadName(e.target.value) }} />
                </div>
              }
              {
                city &&
                <div className="space-y-1">
                  <Label htmlFor="location_address">Address line 2</Label>
                  <Input
                    id="location_address"
                    placeholder='e.g - st mary hiighway'
                    value={address}
                    onChange={e => { setAddress(e.target.value) }} />
                </div>
              }
              {
                city &&
                <div className="space-y-1">
                  <Label htmlFor="location_state">State</Label>
                  <Input
                    id="location_state"
                    placeholder='e.g - Odisha'
                    value={state}
                    onChange={e => { setState(e.target.value) }} />
                </div>
              }
            </CardContent>

          </Card>

          <Button
            name="Date continue button"
            onClick={() => { handlevalidateAddress() }}>
            Continue
          </Button>

        </DialogContent>

      </Dialog>

      <Dialog
        open={stepThree} onOpenChange={setStepThree}>

        <DialogContent
          className="bg-white max-h-[90vh] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >

          <div
            className="bg-white rounded-xl text-black flex gap-[16px] flex-col relative w-[950px] h-fit max-h-[90vh] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >

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

          </div>

          <Button
            name="Date continue button"
            onClick={() => {
              setStepThree(false)
              setStepFour(true)
            }}>
            Continue
          </Button>

        </DialogContent>

      </Dialog>

      <Dialog
        open={stepFour} onOpenChange={setStepFour}>

        <DialogContent
          className="bg-white max-h-[90vh] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >

          <div
            className="bg-white rounded-xl text-black flex gap-[16px] flex-col relative w-[950px] h-fit max-h-[90vh] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >

            <p className="text-lg font-bold w-full text-left p-4">Attachments:</p>

            <div className="px-4 py-2 w-full">
              {loadingTractors ? (
                <p className="text-center text-lg text-gray-600 font-bold">
                  Loading attachments
                </p>
              ) : allAttachments.length === 0 ? (
                <p className="text-center text-lg text-gray-600 font-bold">
                  0 Attachments available in this store
                </p>
              ) : (
                <div className="w-full grid gap-5 grid-cols-4">
                  {allAttachments.map((tractor, index) => {
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

          </div>

          <Button
            name="Date continue button"
            onClick={() => {
              handleBooking()
            }}>
            Book now
          </Button>

        </DialogContent>

      </Dialog>

      <Dialog
        open={stepFive} onOpenChange={setStepFive}>

        <DialogContent
          className="bg-white max-h-[90vh] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >

          <div
            className="bg-white rounded-xl text-black flex gap-[16px] flex-col relative w-[950px] h-[500px] max-h-[90vh] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >

            <p className="text-2xl font-medium text-center mb-3">
              Confirm your booking
            </p>

            {
              booking && <div className="w-full">

                <p className="text-base font-medium text-center">
                  Booking Id: {booking.id}
                </p>

                <p>
                  From {formatDateToDDMMYYYY(booking.start_date)}
                </p>

                <p>
                  {
                    booking.booking_hours && booking.booking_hours === BookingHours ?
                      <p>
                        {booking.end_date && `To ${formatDateToDDMMYYYY(booking.end_date)}`}
                      </p>
                      :
                      `Total duration: ${booking.booking_hours}`
                  }
                </p>

                <p>
                  Attachment cost: {booking.total_attachment_cost}
                  Tractor cost: {booking.total_tractor_cost}
                  Service charge: {booking.total_service_charge}
                  Total tax: {booking.total_tax}
                  Total distance cost: {booking.total_distance_cost}
                  Total cost: {booking.total_cost}
                </p>

                <p>
                  Total distance: {booking.distance}
                </p>

                <div
                  className="w-full flex items-center justify-center gap-4 flex-wrap">
                  <Button
                    className="bg-green-400"
                    onClick={userBookingConfirm}>
                    Confirm
                  </Button>
                  <Button
                    className="bg-red-400"
                    onClick={() => { setStepFive(false) }}>
                    Cancel
                  </Button>
                </div>

              </div>
            }

          </div>

        </DialogContent>

      </Dialog>
    </div>
  );
};

export default StoreBooking;
