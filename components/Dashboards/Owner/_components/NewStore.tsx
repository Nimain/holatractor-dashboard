"use client";

import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { useCookie } from "next-cookie";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FeatureGroup, MapContainer, TileLayer } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Building2,
  Clock,
  Clock1,
  Dock,
  FileText,
  Image,
  MapPin,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Backdrop, CardHeader, CircularProgress, Select } from "@mui/material";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { changeNewStoreShow } from "@/redux/NewStoreShow/NewStoreShow";
import { useOwnerStoreContext } from "@/components/wrappers/StoreProvider";
import { getAuthUser, getAuthUserId } from "@/utils/auth/clientAuth";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";

interface Location {
  latitude: number | null;
  longitude: number | null;
}

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const NewStore = () => {
  const [locationOpen, setLocationOpen] = useState(false);
  // const [locationConOpen, setLocationConOpen] = useState(false)
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location>({
    latitude: null,
    longitude: null,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [closingDays, setClosingDays] = useState<string[]>([]);

  const [creating, setCreating] = useState(false);
  const [creatingMessage, setCreatingMessage] = useState("");

  const dispatch = useDispatch();
  const { show } = useSelector((state: RootState) => state.NewStoreShow);

  const { cookie } = useCookie();
  const rawUser = cookie.get("user");
  const parsedUser = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser); } catch { return null; } })() : rawUser;
  const authUser = getAuthUser();
  const user: user = parsedUser || authUser || {};
  const currentUserId = user?.userId || authUser.userId || getAuthUserId();
  const access_token = cookie.get("access_token");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  const { setStores } = useOwnerStoreContext();

  const setOpen = () => {
    dispatch(changeNewStoreShow());
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const handleMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setMainImage(e.target.files[0]);
    }
  };

  const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setBannerImage(e.target.files[0]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeMainImage = () => {
    setMainImage(null);
  };

  const removeBannerImage = () => {
    setBannerImage(null);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const _created = (e: any) => {
    // console.log(e.layer._latlng)
    const locDet: Location = {
      latitude: e.layer._latlng.lat,
      longitude: e.layer._latlng.lng,
    };
    setLocation(locDet);
    setLocationOpen(false);
    // setLocationConOpen(true)
  };

  async function handleAddStore() {
    if (!name) {
      errorMessage("Store name can't be empty");
      return;
    }
    if (!description) {
      errorMessage("Store description can't be empty");
      return;
    }

    if (!location) {
      errorMessage("Please enable your gps");
      return;
    }

    setCreating(true);

    let storeImages = "";
    let bannerLink = "";

    if (mainImage) {
      try {
        setCreatingMessage("Uploading banner image");
        const buffer = Buffer.from(await mainImage.arrayBuffer());
        storeImages = await uploadFileToS3(buffer, mainImage.name);
        setCreatingMessage("");
      } catch (err) {
        setCreating(false);
        errorMessage("Failed to upload logo");
        return;
      }
    }

    if (bannerImage) {
      try {
        setCreatingMessage("Uploading banner image");
        const bufferB = Buffer.from(await bannerImage.arrayBuffer());
        bannerLink = await uploadFileToS3(bufferB, bannerImage.name);
        setCreatingMessage("");
      } catch (err) {
        setCreating(false);
        errorMessage("Failed to upload banner");
        return;
      }
    }

    let additionalImages: string[] = [];

    if (files) {
      try {
        setCreatingMessage("Uploading additional images");
        for (const image of files) {
          const buffer = Buffer.from(await image.arrayBuffer());
          const imageLink = await uploadFileToS3(buffer, image.name);
          additionalImages.push(imageLink);
        }
        setCreatingMessage("");
      } catch (err) {
        setCreating(false);
        errorMessage("Failed to upload additional images");
        return;
      }
    }

    const store = {
      name,
      description,
      opening_time: new Date(`1970-01-01T${openingTime}:00.000Z`),
      closing_time: new Date(`1970-01-01T${closingTime}:00.000Z`),
      closing_days: closingDays,
      image: storeImages,
      banner: bannerLink,
      owner_user_id: currentUserId,
      lat: `${location.latitude}`,
      lan: `${location.longitude}`,
      additionalImages: additionalImages,
    };

    renderInstance
      .post("/store", store, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 201) {
          successMessage("Store created");
          // Reset state variables
          resetForm();
          setOpen();
          setStores((prevStores) => [...prevStores, res.data]);
        }
      })
      .catch((err) => {
        if (err.response && err.response.status === 409) {
          if (err.response.data.message === "Log in user not found") {
            errorMessage("Log in user not found");
          } else if (err.response.data.message === "Wrong owner id") {
            errorMessage("Wrong owner id");
          } else if (err.response.data.message === "No active subscriptions") {
            errorMessage("No active subscriptions");
          } else if (
            err.response.data.message === "Maximum store count reached"
          ) {
            errorMessage("Maximum store count reached");
          }
        } else {
          const apiMsg = err?.response?.data?.message || err?.message || "Some error occurred";
          const displayMsg = Array.isArray(apiMsg) ? apiMsg.join(", ") : apiMsg;
          errorMessage(displayMsg);
        }
      })
      .finally(() => {
        setCreating(false);
      });
  }

  const resetForm = () => {
    setName("");
    setDescription("");
    setOpeningTime("");
    setClosingTime("");
    setClosingDays([]);
    setFiles([]);
    setMainImage(null);
    setBannerImage(null);
    // Note: not resetting location here — keep current location if you prefer.
    setCreatingMessage("");
    setStep(1);
    setError(null);
  };

  // Reset form when modal is closed (so inputs don't linger)
  useEffect(() => {
    if (!show) {
      // modal closed -> reset form
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error: GeolocationPositionError) => {
          setError(error.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <Dialog open={show} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-auto bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white"
        style={{ scrollbarWidth: "none" }}
      >
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={creating}
        >
          {creatingMessage ? <p>{creatingMessage}</p> : <CircularProgress />}
        </Backdrop>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Add New Store
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Store Basic Information */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white font-medium">
                  Store Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  placeholder="Enter Store Name"
                  className="bg-white/90 text-black placeholder:text-gray-500 border-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                  placeholder="Enter Store Description"
                  className="min-h-[80px] resize-none bg-white/90 text-black placeholder:text-gray-500 border-white/30"
                />
              </div>
            </CardContent>
          </Card>

          {/* Store Hours */}
          <Card className="bg-white backdrop-blur-sm border-white/20">
            {/* <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-300">
                <Clock className="w-4 h-4" />
                Store Hours
              </CardTitle>
            </CardHeader> */}
            <CardContent className="pt-2 space-y-4">
              <div className="flex items-center text-2xl text-red-500">
                <Clock1 />
                <h1 className="mx-2">Store Hours</h1>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingTime" className="text-red-500 text-sm">
                    Opening Time
                  </Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={openingTime}
                    onChange={(e) => {
                      setOpeningTime(e.target.value);
                    }}
                    className=" text-red-500 border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingTime" className="text-red-500 text-sm">
                    Closing Time
                  </Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={closingTime}
                    onChange={(e) => {
                      setClosingTime(e.target.value);
                    }}
                    className=" text-red-500 border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-500 text-sm">Closing Day</Label>
                  <select
                    value={closingDays[0] || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setClosingDays([e.target.value]);
                      } else {
                        setClosingDays([]);
                      }
                    }}
                    className="w-full p-2  text-red-500 border border-black rounded-md"
                  >
                    <option value="">Select day</option>
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Media */}
          <Card className="bg-white backdrop-blur-sm border-white/20">
            {/* <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-300">
                <Image className="w-4 h-4" />
                storeinstruction
              </CardTitle>
            </CardHeader> */}
            <CardContent className="pt-2 space-y-4">
              <div className="flex text-red-500 text-2xl items-center">
                <Image />
                <h1 className="mx-2">Store Media</h1>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Store Logo */}
                <div className="space-y-2">
                  {/* <Label className="text-white text-sm">Store Logo</Label> */}
                  <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center bg-white/5">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-red-300" />
                    <p className="text-sm text-red-500 mb-1">
                      Click to upload Logo
                    </p>
                    <p className="text-xs text-red-500">
                      SVG, JPG,PNG (max. 800x400px)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleMainImageChange}
                      ref={fileInputRef}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 text-red-500 hover:text-red-200"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload
                    </Button>
                  </div>
                  {mainImage && (
                    <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                      <img
                        src={URL.createObjectURL(mainImage)}
                        alt="Store logo"
                        className="w-10 h-10 object-cover rounded"
                      />
                      <span className="text-sm flex-1">{mainImage.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeMainImage}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Store Banner */}
                <div className="space-y-2">
                  {/* <Label className="text-white text-sm">Store Banner</Label> */}
                  <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center bg-white/5">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-red-500" />
                    <p className="text-sm text-red-500 mb-1">
                      Click to upload Banner
                    </p>
                    <p className="text-xs text-red-500">
                      SVG, JPG,PNG (max. 800x400px)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleBannerChange}
                      ref={bannerFileRef}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 text-red-500 hover:text-red-200"
                      onClick={() => {
                        bannerFileRef.current?.click();
                      }}
                    >
                      Upload
                    </Button>
                  </div>
                  {bannerImage && (
                    <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                      <img
                        src={URL.createObjectURL(bannerImage)}
                        alt="Store banner"
                        className="w-20 h-10 object-cover rounded"
                      />
                      <span className="text-sm flex-1">{bannerImage.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeBannerImage}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Images */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white text-sm">Additional Images</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white/10 rounded"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Store Instructions */}
          <Card className="bg-white backdrop-blur-sm border-white">
            {/* <CardHeader className="pb-3 text-black">
              <CardTitle className="flex items-center gap-2 text-black">
                <FileText className="w-4 h-4" />
                <h1> Store Instructions</h1>
              </CardTitle>
            </CardHeader> */}
            <CardContent className=" pt-2 space-y-4">
              <div className="flex text-red-500 text-2xl items-center">
                <Dock />
                <h1 className="mx-2">Store Instructions</h1>
              </div>
              {/* Important Information */}
              <div className="bg-red-600  rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-200 mb-1">
                      Important Information
                    </p>
                    <p className="text-xs text-red-100/80">
                      Please ensure all store information is accurate and
                      up-to-date. This information will be displayed to
                      customers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Image Requirements */}
                <div className="space-y-2">
                  <Label className="text-red-500 text-sm font-medium">
                    Image Requirements
                  </Label>
                  <div className="text-xs text-red-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                      <span>Logo: Maximum size 800×800px</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                      <span>Banner: Maximum size 1920×1080px</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                      <span>Accepted Formats: SVG, PNG, JPG</span>
                    </div>
                  </div>
                </div>

                {/* Store Hours Format */}
                <div className="space-y-2">
                  <Label className="text-red-500 text-sm font-medium">
                    Store Hours Format
                  </Label>
                  <div className="text-xs text-red-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                      <span>Use 24-hour format</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                      <span>Select one closing day per week</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                      <span>Hours will be displayed in local time</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Location
              <div className="space-y-2">
                <Label className="text-white text-sm">Store Location</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Select store location"
                    value={
                      location.latitude && location.longitude
                        ? `lat: ${location.latitude.toFixed(
                            2
                          )}, lng: ${location.longitude.toFixed(2)}`
                        : "No location selected"
                    }
                    readOnly
                    className="bg-white/90 text-black border-white/30"
                  />
                  <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Pick Location
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      {error ? (
                        <p>Error: {error}</p>
                      ) : location.latitude && location.longitude ? (
                        <MapContainer
                          center={[location.latitude, location.longitude]}
                          zoom={13}
                          scrollWheelZoom={false}
                          style={{ width: "100%", height: "80vh", zIndex: 1 }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <FeatureGroup>
                            <EditControl
                              position="topright"
                              onCreated={_created}
                              draw={{
                                rectangle: false,
                                circle: false,
                                circlemarker: false,
                                polyline: false,
                                polygon: false,
                              }}
                            />
                          </FeatureGroup>
                        </MapContainer>
                      ) : (
                        <p>Latitude and longitude not available</p>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div> */}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleAddStore();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Create Store
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewStore;
