"use client";

import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
import { Inventory, TractorInStore } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Backdrop } from "@mui/material";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CircleDollarSignIcon,
  CalendarClock,
  CalendarIcon,
  UserRoundPlusIcon,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { format, setYear } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { singleStoreOwnerTranslations } from "../SingleStoreTranslation";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { useAddStoreItemContext } from "@/components/wrappers/AddStoreItemProvider";
import { FaPhotoVideo } from "react-icons/fa";

const AddTractor = ({
  alreadyTractors,
}: {
  alreadyTractors: TractorInStore[];
}) => {
  // Step management
  type Step = "tractor" | "details";
  const [step, setStep] = useState<Step>("tractor");
  
  const [open, setOpen] = useState(false);
  const [selectedTractorId, setSelectedTractorId] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [selectedTractor, setSelectedTractor] = useState<Inventory | null>(null);
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [fetchingTractors, setFetchingTractors] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hourlyPrice, setHourlyPrice] = useState<number>();
  const [attachment, setattachment] = useState<File | null>(null);
  const [document_number, set_document_number] = useState("");
  const [expiry_date, set_expiry_date] = useState<Date>();
  const [expiry_date_false, set_expiry_date_false] = useState(false);
  const [expiry_date_year, set_expiry_date_year] = useState<number>(
    new Date().getFullYear()
  );

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");
  const { slug } = useParams();
  const { fetchStoreDetails } = useAddStoreItemContext();

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
      const updatedDate = setYear(newDate, expiry_date_year);
      set_expiry_date(updatedDate);
      set_expiry_date_false(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAllTractors();
      // Reset state when modal opens
      setStep("tractor");
      setSelectedTractorId("");
      setSelectedInventoryId("");
      setSelectedTractor(null);
      setHourlyPrice(undefined);
      setattachment(null);
      set_document_number("");
      set_expiry_date(undefined);
    }
  }, [open]);

  const handleTractorSelect = (tractor: Inventory) => {
    setSelectedTractorId(tractor.tractor.id);
    setSelectedInventoryId(tractor.id);
    setSelectedTractor(tractor);
    const defaultPrice = parseFloat(tractor.fixed_price) || parseFloat(tractor.min_price) || 0;
    if (defaultPrice > 0) {
      setHourlyPrice(defaultPrice);
    }
    setStep("details");
  };

  async function saveTractor() {
    if (!hourlyPrice) {
      errorMessage("Hourly price is needed");
      return;
    }

    if (!attachment || !document_number) {
      errorMessage("License details is needed");
      return;
    }

    let attachmentLink = "";
    setCreating(true);

    const buffer = Buffer.from(await attachment.arrayBuffer());
    attachmentLink = await uploadFileToS3(buffer, attachment.name);

    if (!attachmentLink) {
      errorMessage("Something went wrong in uploading the attachment");
      setCreating(false);
      return;
    }

    const addTractorDto = {
      tractor_ids: [selectedTractorId],
      hourly_price: `${hourlyPrice}`,
      store_id: slug,
      inventory_id: selectedInventoryId,
      document_number: document_number,
      attachment: attachmentLink,
      expire_date: expiry_date,
    };

    renderInstance
      .post("/store/addTractors", addTractorDto, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        fetchStoreDetails();
        successMessage("Tractor added successfully");
      })
      .catch((err) => {
        if (err.response && err.response.status && err.response.data.message) {
          errorMessage(err.response.data.message);
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
      case "tractor":
        return "Select Tractor";
      case "details":
        return "Additional Tractor Details";
      default:
        return "Add Tractor";
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
              + Add Tractor
            </button>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className={`max-w-4xl max-h-[80vh] overflow-hidden flex flex-col ${
        step === "tractor" 
          ? "bg-white border-gray-200 text-red-600" 
          : "bg-gradient-to-r from-[#8c0000] to-[#4d0000] border-[#4d0000] text-white"
      }`}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === "details" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("tractor")}
                className="text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <DialogTitle className={`text-3xl font-bold ${
              step === "tractor" ? "text-red-600" : "text-white"
            }`}>
              {getStepTitle()}
            </DialogTitle>
          </div>
          {step === "tractor" && (
            <h3 className="text-red-500">
              Select from all the tractors from inventory
            </h3>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Tractor Selection Step */}
          {step === "tractor" && (
            <div className="space-y-4">
              {fetchingTractors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2 text-red-600">
                    <TranslatedText
                      greetings={singleStoreOwnerTranslations.loadingTractors}
                    />
                    ...
                  </span>
                </div>
              ) : allTractors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-red-400">No tractors available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {allTractors.map((tractor) => (
                    <div
                      key={tractor.id}
                      className="border rounded-xl overflow-hidden bg-red-50 border-red-200 cursor-pointer transition-all hover:bg-red-100"
                      onClick={() => handleTractorSelect(tractor)}
                    >
                      {/* Image Section */}
                      <div className="w-full h-32 flex items-center justify-center overflow-hidden">
                        {tractor.tractor.images?.[0] ? (
                          <Image
                            src={tractor.tractor.images[0]}
                            alt={tractor.tractor.name}
                            width={200}
                            height={130}
                            className="object-cover w-full h-full"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="p-4 bg-gradient-to-r from-[#8c0000] to-[#4d0000] h-full">
                        <h3 className="font-semibold text-white text-sm leading-tight">
                          {tractor.tractor.name}
                        </h3>
                        <p className="text-xs text-white mt-1 line-clamp-3">
                          {tractor.tractor.description}
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
          {step === "details" && selectedTractor && (
            <div className="space-y-6">

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Hourly Price */}
                <div>
                  <Label htmlFor="hourly-price" className="flex items-center text-white">
                    <CircleDollarSignIcon className="w-4 h-4" />
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
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  {selectedTractor && (selectedTractor.min_price || selectedTractor.max_price) && (
                    <p className="text-xs text-amber-300 mt-1 font-medium">
                      Allowed price range: ${selectedTractor.min_price} – ${selectedTractor.max_price} USD
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <h2 className="flex items-center text-white mb-2">
                    <FaPhotoVideo className="w-4 h-4" />
                    <span className="ml-2">Upload Additional Image</span>
                  </h2>
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10"
                  >
                    {attachment ? (
                      <Image
                        src={URL.createObjectURL(attachment)}
                        alt={attachment.name}
                        unoptimized={true}
                        className="w-24 h-24 rounded-md object-cover"
                        width={96}
                        height={96}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4 text-white/50"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="text-sm text-white/70">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                      </div>
                    )}
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

                {/* Expiry Date */}
                <div>
                  <h2 className="flex items-center text-white mb-2">
                    <CalendarClock className="w-4 h-4" />
                    <span className="ml-2">Expiry Date</span>
                  </h2>
                  <Popover open={expiry_date_false} onOpenChange={set_expiry_date_false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                          !expiry_date && "text-white/50"
                        )}
                        onClick={() => set_expiry_date_false(true)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiry_date ? (
                          format(expiry_date, "PPP")
                        ) : (
                          <span>
                            <TranslatedText
                              greetings={singleStoreOwnerTranslations.expiryDate}
                            />
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="flex w-fit flex-col space-y-2 p-2">
                      <Select onValueChange={(value) => set_expiry_date_year(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {[...Array(30)].map((_, index) => {
                            const yearValue = new Date().getFullYear() + index;
                            return (
                              <SelectItem key={yearValue} value={yearValue.toString()}>
                                {yearValue}
                              </SelectItem>
                            );
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
                </div>

                {/* License Number */}
                <div>
                  <Label htmlFor="liscenceNumber" className="flex items-center text-white">
                    <UserRoundPlusIcon className="w-4 h-4" />
                    <span className="ml-2">
                      <TranslatedText
                        greetings={singleStoreOwnerTranslations.licenseID}
                      />
                    </span>
                  </Label>
                  <Input
                    id="liscenceNumber"
                    placeholder="e.g - es0012390"
                    value={document_number}
                    autoComplete="new-liscence"
                    autoCorrect="off"
                    spellCheck="false"
                    onChange={(e) => set_document_number(e.target.value)}
                    className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-white/20">
          {/* <Button
            variant="outline"
            className="bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button> */}

          {step === "details" && (
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={saveTractor}
              disabled={creating}
            >
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <TranslatedText greetings={singleStoreOwnerTranslations.saveTractor} />
            </Button>
          )}
        </div>

        <Backdrop open={creating}>
          <p className="text-white">
            <TranslatedText
              greetings={singleStoreOwnerTranslations.addingTractorToStore}
            />
            ...
          </p>
        </Backdrop>
      </DialogContent>
    </Dialog>
  );
};

export default AddTractor;