"use client"

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { AttachmentInStore, City, Country, TractorInStore } from '@/utils/Types/types';
import { Backdrop, CircularProgress } from '@mui/material'
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { useCookie } from 'next-cookie';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react'
import { Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { uploadFileToS3 } from '@/utils/AWS/FileUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StoreBookingLease = () => {
  const [loading, setLoading] = useState(false);
  const [bookingConfirm, setBookingConfirm] = useState(false)
  const [startDate, setstartDate] = useState<Date>();
  const [working_hgour_per_day, set_working_hgour_per_day] = useState("")
  const [endDate, setEndDate] = useState<Date>();
  const [loadingTractors, setLoadingTractors] = useState(false);

  const [allTractors, setAllTractors] = useState<TractorInStore[]>([]);
  const [allAttachments, setAllAttachments] = useState<AttachmentInStore[]>([]);
  const [fetchingContry, setFetchingCountry] = useState(false);
  const [allCountry, setAllCountry] = useState<Country[]>([]);
  const [fetchingCity, setFetchingCity] = useState(false);
  const [city, setCity] = useState<City[]>([]);

  const [location_name, set_location_name] = useState("")
  const [location_address, set_location_address] = useState("")
  const [location_city, set_location_city] = useState("")
  const [location_state, set_location_state] = useState("")
  const [location_zip_code, set_location_zip_code] = useState("")
  const [location_zip_country, set_location_zip_country] = useState("")

  const [popoverOpenCountry, setPopoverOpenCountry] = useState(false)
  const [popoverOpenCity, setPopoverOpenCity] = useState(false)

  const [selectedTractorIds, setSelectedTractorIds] = useState<string[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])

  // Step state variables
  const [stepOne, setStepOne] = useState(true)
  const [stepTwo, setStepTwo] = useState(false)
  const [stepThree, setStepThree] = useState(false)
  const [stepFour, setStepFour] = useState(false)
  const [stepFive, setStepFive] = useState(false)
  const [stepSix, setStepSix] = useState(false)

  
  const [signature, setSignature] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);

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

  // Helper function to convert base64 to binary buffer
  const base64ToBuffer = (base64: string) => {
    const binaryString = atob(base64.split(',')[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return Buffer.from(bytes.buffer);
  };

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleSave = async () => {

    if (!location_name || !location_address || !location_city || !location_state || !location_zip_code || !location_zip_country) {
      errorMessage("Add proper location details")
      return
    }

    if(!startDate || !endDate) {
      errorMessage("Please selecet both startd date and end date")
      return
    }

    if(!working_hgour_per_day){
      errorMessage("Please select working hour of the day")
      return
    }

    if(selectedTractorIds.length === 0 && selectedAttachmentIds.length === 0) {
      errorMessage("Please select atleast one product")
      return
    }

    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataURL = sigCanvas.current.toDataURL('image/png'); // Get base64 data URL
      const buffer = base64ToBuffer(dataURL); // Convert base64 to buffer
      const fileName = 'signature.png';

      try {
        setLoading(true);
        const imageUrl = await uploadFileToS3(buffer, fileName); // Upload to S3
        if(!imageUrl) {
          errorMessage("Error uploading the form please try again in some times")
          return
        }

        const lease = {
          location_name,
          location_address,
          location_city,
          location_state,
          location_zip_code,
          location_country: location_zip_country,
          attachment: imageUrl,
          store_id: slug,
          start_date: startDate,
          end_date: endDate,
          working_hgour_per_day,
          user_id: user.id,
          tractor_ids: selectedTractorIds,
          attachment_ids: selectedAttachmentIds
        }

        renderInstance.post(`/lease`, lease, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }).then((res)=>{
          successMessage("Confirm your booking")
        }).catch((err)=>{
          console.log(err)
          errorMessage("Some error occurred")
        })

      } catch (error) {
        console.error('Error uploading to S3:', error);
      } finally { setLoading(false) }
    } else {
      errorMessage("Please sign the contract to continue")
      return
    }
  };

  function handleFetchAvailableItems() {
    if(!startDate || !endDate) {
      errorMessage("Please selecet both startd date and end date")
      return
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetting the time to midnight

    const selectedStartDate = startDate ? new Date(startDate) : new Date()
    selectedStartDate.setHours(0, 0, 0, 0); // Resetting the time to midnight

    let selectedEndDate = endDate ? new Date(endDate) : new Date()
    selectedEndDate.setHours(0, 0, 0, 0); // Resetting the time to midnight

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
      if (dayDifference < 7 && dayDifference > 365) {
        errorMessage("Lease duration must be between one week and a year");
        return;
      }
    }

    if (!startDate) {
      errorMessage("Select the start date")
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

  function fetchAllCity() {
    setFetchingCity(true);
    renderInstance
      .get("/city")
      .then((res) => {
        setCity(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching cities");
      })
      .finally(() => {
        setFetchingCity(false);
      });
  }

  function handlevalidateAddress() {
    if (!location_name || !location_address || !location_city || !location_state || !location_zip_code || !location_zip_country) {
      errorMessage("Add proper location details")
      return
    }
    setStepTwo(false)
    setStepThree(true)

    handleFetchAvailableItems()
  }

  useEffect(() => {
    if (slug) {
      fetchAllCountry()
    }
  }, [slug]);

  useEffect(() => {
    if (location_zip_country) fetchAllCity()
  }, [location_zip_country])

  return (
    <div className="w-full h-full flex flex-col gap-5 py-10">

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || bookingConfirm}
      >
        <CircularProgress />
      </Backdrop>

      {/* Start date and end date */}
      <Dialog
        open={stepOne} onOpenChange={setStepOne}>

        <DialogContent
          className="bg-white max-h-[90vh] w-[400px] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >

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

          <Label className="mb-3">
            Booking hours per day
          </Label>

          <Select
            onValueChange={(value) => { set_working_hgour_per_day(value) }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select booking hours per day" />
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
              <SelectItem value="Nine_Hours">9 hour</SelectItem>
              <SelectItem value="Ten_Hours">10 hour</SelectItem>
              <SelectItem value="Eleven_Hours">11 hour</SelectItem>
              <SelectItem value="Twelve_Hours">12 hour</SelectItem>
              <SelectItem value="Thirteen_Hours">13 hour</SelectItem>
              <SelectItem value="Fourteen_Hours">14 hour</SelectItem>
              <SelectItem value="Fifteen_Hours">15 hour</SelectItem>
              <SelectItem value="Sixteen_Hours">16 hour</SelectItem>
            </SelectContent>
          </Select>

          <Button
            name="Date continue button"
            onClick={() => { handleFetchAvailableItems() }}>
            Continue
          </Button>

        </DialogContent>

      </Dialog>

{/* Address */}
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
                    <div className="space-y-1 w-[90%]">
                      <Label htmlFor="phonrnumber">Country name</Label>
                      <div className="w-full space-y-2">
                        <Popover open={popoverOpenCountry} onOpenChange={setPopoverOpenCountry}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              // aria-expanded={popoverOpen}
                              className="w-full justify-between"
                            >
                              {location_zip_country
                                ? allCountry.find((country) => country.name === location_zip_country) && location_zip_country
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
                                        set_location_zip_country(country.name)
                                        setPopoverOpenCountry(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          location_zip_country === country.name ? "opacity-100" : "opacity-0"
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
                location_zip_country &&
                <div className='space-y-2 w-[90%]'>
                  <Label>City</Label>
                  {
                    fetchingCity ?
                      <p>Fetching cities</p>
                      :
                      city.length === 0 ?
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
                                {location_city
                                  ? city.find((cityDetails) => cityDetails.name === location_city) && location_city
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
                                    {city.map((cityDetails) => (
                                      <CommandItem
                                        key={cityDetails.name}
                                        value={cityDetails.name}
                                        onSelect={(currentValue) => {
                                          set_location_city(cityDetails.name)
                                          setPopoverOpenCity(false)
                                        }}
                                        className={`${location_zip_country !== cityDetails.country.name && "hidden"}`}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            location_city === cityDetails.name ? "opacity-100" : "opacity-0"
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
                location_city &&
                <div className='space-y-2 w-[90%]'>
                  <Label>Location name</Label>
                  <Input type="text" placeholder='Store location name' className='outline-none bg-transparent border-none w-full' value={location_name} onChange={e => { set_location_name(e.target.value) }} />

                </div>
              }
              {
                location_city &&
                <div className='space-y-2 w-[90%]'>
                  <Label>Store address</Label>
                  <Input type="text" placeholder='Store address' className='outline-none bg-transparent border-none w-full' value={location_address} onChange={e => { set_location_address(e.target.value) }} />
                </div>
              }
              {
                location_city &&
                <div className='space-y-2 w-[90%]'>
                  <Label>State</Label>
                  <Input type="text" placeholder='State' className='outline-none bg-transparent border-none w-full' value={location_state} onChange={e => { set_location_state(e.target.value) }} />
                </div>
              }
              {
                location_city &&
                <div className='space-y-2 w-[90%]'>
                  <Label>Location zip code</Label>
                  <Input type="text" placeholder='Zipcode' className='outline-none bg-transparent border-none w-full' value={location_zip_code} onChange={e => { set_location_zip_code(e.target.value) }} />
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
              // handleBooking()
              setStepFour(false)
              setStepFive(true)
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
            className="bg-white rounded-xl text-black flex gap-[16px] flex-col relative w-[950px] h-fit max-h-[90vh] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >

<div className="flex flex-col items-center space-y-4">
      <h2 className="text-xl font-bold">Please sign below</h2>
      <div className="border border-gray-300 rounded">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: 500,
            height: 200,
            className: 'signature-canvas'
          }}
        />
      </div>
      <div className="flex space-x-4">
        <Button onClick={handleClear}>Clear</Button>
        <Button onClick={handleSave}>Save Signature</Button>
      </div>
      {signature && (
        <div>
          <p>Signature Preview:</p>
          <img src={signature} alt="Signature" className="border border-gray-300 mt-2" />
        </div>
      )}
    </div>

          </div>

          <Button
            name="Date continue button"
            onClick={() => {
              // handleBooking()
            }}>
            Book now
          </Button>

        </DialogContent>

      </Dialog>

    </div>
  )
}

export default StoreBookingLease