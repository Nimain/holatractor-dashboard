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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from "lucide-react";
import { format, setYear } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";

const AddTractor = ({ alreadyTractors }: { alreadyTractors: TractorInStore[] }) => {
  const [open, setOpen] = useState(false);
  const [selectedTractorId, setSelectedTractorId] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [fetchingTractors, setFetchingTractors] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hourlyPrice, setHourlyPrice] = useState<number>();
  const [attachment, setattachment] = useState<File | null>(null);
  const [document_number, set_document_number] = useState("")
  const [expiry_date, set_expiry_date] = useState<Date>()
  const [expiry_date_false, set_expiry_date_false] = useState(false)
  const [expiry_date_year, set_expiry_date_year] = useState<number>(new Date().getFullYear())

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

  const handleExpiryDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      const updatedDate = setYear(newDate, expiry_date_year)
      set_expiry_date(updatedDate)
      set_expiry_date_false(false)
    }
  }

  useEffect(() => {
    fetchAllTractors();
  }, []);

  async function saveTractor() {
    if (!hourlyPrice) {
      errorMessage("Hourly price is needed");
      return;
    }

    if (!attachment || !document_number) {
      errorMessage("Liscence details is needed")
      return
    }

    let attachmentLink = ""
    
    setCreating(true);

    const buffer = Buffer.from(await attachment.arrayBuffer());
    attachmentLink = await uploadFileToS3(buffer, attachment.name);

    if (!attachmentLink) {
      errorMessage("Something went wrong in uploading the attachment");
      setCreating(false)
      return;
    }

    const addTractorDto = {
      tractor_ids: [selectedTractorId],
      hourly_price: `${hourlyPrice}`,
      store_id: slug,
      inventory_id: selectedInventoryId,
      document_number: document_number,
      attachment: attachmentLink,
      expire_date: expiry_date
    };

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
        <div>
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
              <Image
                src="https://holaimagesdata.s3.us-west-2.amazonaws.com/web/serviso/land_preparation.webp"
                alt="Tractor Icon"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-full"
                unoptimized={true}
              />
            </div>
            <h3 className="text-2xl font-bold text-center">Add New Tractor</h3>
            <p className="text-gray-600 text-center">
              Click to add a new tractor to your inventory
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                setOpen(true);
              }}
            >
              <AddIcon className="mr-2" />
              Add Tractor
            </Button>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <div className="grid gap-4 py-4">
          {selectedTractorId ? (
            <div className="grid gap-4">
              <Label htmlFor="hourly-price">Hourly Price</Label>
              <Input
                id="hourly-price"
                type="number"
                value={hourlyPrice}
                onChange={(e) => setHourlyPrice(Number(e.target.value))}
              />
              <div className="flex items-center justify-center w-full">

                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50"
                >
                  {
                    attachment ?
                      <Image
                        src={URL.createObjectURL(attachment)}
                        alt={attachment.name}
                        unoptimized={true}
                        className="w-52 aspect-square rounded-md object-cover"
                        width={200}
                        height={200}
                      />
                      :
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span> or
                          drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SVG, PNG, JPG or GIF (MAX. 800x400px)
                        </p>
                      </div>
                  }

                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files ? e.target.files[0] : null;
                      if (file) {
                        setattachment(file);
                      }
                    }}
                  />
                </label>

              </div>
              <Popover open={expiry_date_false} onOpenChange={set_expiry_date_false}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !expiry_date && "text-muted-foreground"
                    )}
                    onClick={() => { set_expiry_date_false(true) }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiry_date ? format(expiry_date, "PPP") : <span>Expiry date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="flex w-fit flex-col space-y-2 p-2">
                  <Select
                    onValueChange={(value) => set_expiry_date_year(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {[...Array(30)].map((_, index) => {
                        const yearValue = new Date().getFullYear() + index
                        return (
                          <SelectItem key={yearValue} value={yearValue.toString()}>
                            {yearValue}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <div className="rounded-md border">
                    <Calendar
                      mode="single"
                      selected={expiry_date}
                      onSelect={handleExpiryDateChange}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <div className="space-y-1">
                <Label htmlFor="liscenceNumber">Liscence ID</Label>
                <Input
                  id="liscenceNumber"
                  placeholder='e.g - es0012390'
                  value={document_number}
                  autoComplete='new-liscence'
                  autoCorrect='off'
                  spellCheck='false'
                  onChange={e => { set_document_number(e.target.value) }} />
              </div>
              <Button onClick={saveTractor}>Save Tractor</Button>
            </div>
          ) : fetchingTractors ? (
            <p>Loading tractors...</p>
          ) : (
            allTractors.map((tractor) => (
              <div key={tractor.id} className="border p-4 rounded-md">
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={0}
                  slidesPerView={1}
                  loop={true}
                  pagination={true}
                  autoplay={true}
                  className="w-full h-40 mb-4"
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
                <h3 className="font-bold">{tractor.tractor.name}</h3>
                <p className="text-sm text-gray-500">{tractor.tractor.description}</p>
                <Button
                  className="mt-2 w-full"
                  onClick={() => {
                    setSelectedTractorId(tractor.tractor.id)
                    setSelectedInventoryId(tractor.id)
                  }}
                >
                  Select
                </Button>
              </div>
            ))
          )}
        </div>
        <Backdrop open={creating}>
          <p>Adding tractor to store...</p>
        </Backdrop>
      </DialogContent>
    </Dialog>
  );
};

export default AddTractor;
