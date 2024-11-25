"use client"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Boxes, ChevronDown, ChevronLeft, ChevronRight, Home, MapPin, Plus, Settings, Store as StoreIcon, Trash2, Upload, UserSearch, Wallet } from "lucide-react"
import { useCookie } from "next-cookie"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef, ChangeEvent } from "react"
import { Backdrop, CircularProgress, Tooltip } from "@mui/material"
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import StyleIcon from '@mui/icons-material/Style';
import { Separator } from "@/components/ui/separator"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { Store } from "@/utils/Types/types"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { uploadFileToS3 } from "@/utils/AWS/FileUpload"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FeatureGroup, MapContainer, TileLayer } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

interface Location {
  latitude: number | null;
  longitude: number | null;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showStoreList, setShowStoreList] = useState(false)
  const [showPaymentList, setShowPaymentList] = useState(false)

  const [stores, setStores] = useState<Store[]>([])

  const [open, setOpen] = useState(false)
    const [locationOpen, setLocationOpen] = useState(false)
    // const [locationConOpen, setLocationConOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [files, setFiles] = useState<File[]>([])
    const [mainImage, setMainImage] = useState<File | null>(null)

    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [closingDays, setClosingDays] = useState<string[]>([]);

    const [creating, setCreating] = useState(false)
    const [creatingMessage, setCreatingMessage] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { cookie } = useCookie()
  const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)])
        }
    }

    const handleMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setMainImage(e.target.files[0])
        }
    }

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const removeMainImage = () => {
        setMainImage(null)
    }

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 3))
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

    const _created = (e: any) => {
        // console.log(e.layer._latlng)
        const locDet: Location = {
            latitude: e.layer._latlng.lat,
            longitude: e.layer._latlng.lng
        }
        setLocation(locDet)
        setLocationOpen(false)
        // setLocationConOpen(true)
    }

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
            errorMessage("Please enable your gps")
            return
        }

        setCreating(true)

        let storeImages = ""

        if (mainImage) {
            setCreatingMessage("Uploading banner image")
            const buffer = Buffer.from(await mainImage.arrayBuffer())
            storeImages = await uploadFileToS3(buffer, mainImage.name)
            setCreatingMessage("")
        }

        let additionalImages = []

        if(files){
            setCreatingMessage("Uploading additional images")
            for (const image of files) {
                const buffer = Buffer.from(await image.arrayBuffer())
                const imageLink = await uploadFileToS3(buffer, image.name)
                additionalImages.push(imageLink)
            }
            setCreatingMessage("")
        }

        const store = {
            name,
            description,
            opening_time: new Date(`1970-01-01T${openingTime}:00.000Z`),
            closing_time: new Date(`1970-01-01T${closingTime}:00.000Z`),
            closing_days: closingDays,
            image: storeImages,
            owner_user_id: user.userId,
            lat: `${location.latitude}`,
            lan: `${location.longitude}`,
            additionalImages: additionalImages
        };

        renderInstance.post("/store", store, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        }).then((res) => {
            if (res.status === 201) {
                successMessage("Store created")
                // Reset state variables
                setName("");
                setDescription("");
                setOpeningTime("");
                setClosingTime("");
                setClosingDays([]);
                setOpen(false)
            }
        }).catch((err) => {

            if(err.response && err.response.status === 409){
                if(err.response.data.message === "Log in user not found"){
                    errorMessage("Log in user not found")
                } else if(err.response.data.message === "Wrong owner id"){
                    errorMessage("Wrong owner id")
                } else if(err.response.data.message === "No active subscriptions"){
                    errorMessage("No active subscriptions")
                } else if(err.response.data.message === "Maximum store count reached"){
                    errorMessage("Maximum store count reached")
                }
            } else {
                errorMessage("Some error occurred")
            }

        }).finally(() => {
            setCreating(false)
        })

    }

  function fetchOwner() {
    renderInstance.get(`/owner/${user.userId}`)
      .then((res) => {
        setStores(res.data.stores)
      }).catch((err) => {
        errorMessage("Error fetching user detaild")
      })
  }

  function handleLogOut() {
    cookie.remove("access_token")
    cookie.remove("user")
    cookie.remove("isFarmer")
    cookie.remove("isOperator")
    cookie.remove("isOwner")
    cookie.remove("isODealer")
    window.location.reload()
  }

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

  useEffect(() => {
    if (user) {
      fetchOwner()
    }
  }, [])

  if (!user) return

  return (
    <aside
      className={`shadow-md transition-all duration-300 rounded-2xl ${isExpanded ? 'w-64' : 'w-16'} h-[90vh] bg-primaryColor text-white my-auto`} ref={fileInputRef}>
      <div className="flex items-center justify-center gap-2 w-full mx-auto mt-4 mb-2">
        <Image
          src={"https://holaimagesdata.s3.us-west-2.amazonaws.com/web/logo/ISOLOGO_HT_BLANCO.png"}
          alt="Logo"
          width={24}
          height={24}
          className="h-6 object-cover w-auto" />
        {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold">Holatractpor</h1>}
      </div>
      <div className="px-4 flex justify-between items-center">
        {isExpanded && <h1 className="text-xl md:text-2xl font-medium md:font-bold">Dashboard</h1>}
        <Button size="icon" onClick={() => setIsExpanded(!isExpanded)} className="bg-transparent hover:bg-white/20">
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="mt-6 px-1">
        <Collapsible open={showStoreList} onOpenChange={setShowStoreList}>
          <CollapsibleTrigger asChild>
            <Button
              className={`flex gap-2 items-center bg-transparent hover:bg-white/20 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
            >
              <Tooltip title={"Store"} placement="right">
                <StoreIcon className="h-6 w-6" />
              </Tooltip>
              {isExpanded && (
                <>
                  {`Store ${stores.length}`}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 mt-2 space-y-2">
            {isExpanded && <Link href={"#"}>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className={`w-full flex gap-2 justify-start bg-transparent hover:bg-white/20`}
                >
                    <Plus className="h-6 w-6" />
                    New store
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto" style={{ scrollbarWidth: "none" }}>

                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={creating}>

                    {creatingMessage ? <p>{creatingMessage}</p> : <CircularProgress />}

                </Backdrop >

                <DialogHeader>
                    <DialogTitle>
                        {step === 1
                            ? 'Store Details'
                            : step === 2
                                ? 'Operating Hours'
                                : 'Additional Information'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Store Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value) }}
                                    placeholder="Enter store name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={e => { setDescription(e.target.value) }}
                                    placeholder="Describe your store"
                                    className="min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mainImage">Main Image</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById('mainImage')?.click()}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Image
                                    </Button>
                                    <Input
                                        id="mainImage"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleMainImageChange}
                                    />
                                </div>
                                {mainImage && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <img
                                            src={URL.createObjectURL(mainImage)}
                                            alt="Main store image"
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                        <span className="text-sm">{mainImage.name}</span>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="openingTime">Opening Time</Label>
                                    <Input
                                        id="openingTime"
                                        type="time"
                                        value={openingTime}
                                        onChange={e => { setOpeningTime(e.target.value) }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="closingTime">Closing Time</Label>
                                    <Input
                                        id="closingTime"
                                        type="time"
                                        value={closingTime}
                                        onChange={e => { setClosingTime(e.target.value) }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Closing Days</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <label
                                            key={day}
                                            className="flex items-center space-x-2 border rounded-md p-2"
                                        >
                                            <Checkbox
                                                checked={closingDays.includes(day)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setClosingDays((current) => [...current, day])
                                                    } else {
                                                        setClosingDays((current) => current.filter((d) => d !== day))
                                                    }
                                                }}
                                            />
                                            <span>{day}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Additional Images</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            fileInputRef.current?.click()
                                        }}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Add Images
                                    </Button>
                                    <input
                                        type="file"
                                        id="additional-image"
                                        className="hidden"
                                        ref={fileInputRef}
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                </div>
                                {files.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {files.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between border rounded-md p-2"
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
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Store Location</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Select store location"
                                        value={`lat: ${location.latitude?.toFixed(2)}, lan: ${location.longitude?.toFixed(2)}`}
                                        readOnly
                                    />
                                    <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                            >
                                                <MapPin className="w-4 h-4 mr-2" />
                                                Pick Location
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            {error ? (
                                                <p>Error: {error}</p>
                                            ) : (location.latitude && location.longitude) ? (
                                                <MapContainer
                                                    center={[location.latitude, location.longitude]}
                                                    zoom={13}
                                                    scrollWheelZoom={false}
                                                    style={{ width: "100%", height: "80vh", zIndex: 1 }}>
                                                    <TileLayer
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <FeatureGroup>
                                                        <EditControl
                                                            position="topright"
                                                            onCreated={_created}
                                                            draw={
                                                                {
                                                                    rectangle: false,
                                                                    circle: false,
                                                                    circlemarker: false,
                                                                    //   marker: false,
                                                                    polyline: false,
                                                                    polygon: false
                                                                }
                                                            }
                                                        />
                                                    </FeatureGroup>
                                                </MapContainer>
                                            ) : (
                                                <p>Latitude and longitude not available</p>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        {step > 1 ? (
                            <Button type="button" variant="outline" onClick={prevStep}>
                                Back
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                        )}
                        {step < 2 ? (
                            <Button type="button" onClick={nextStep}>
                                Next
                            </Button>
                        ) : (
                            <Button onClick={() => { handleAddStore() }}>Create Store</Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
            </Link>}
          </CollapsibleContent>
        </Collapsible>
        <Link href={"/owner/bookings"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Bookings"} placement="right">
              <StyleIcon className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Bookings"}
          </Button>
        </Link>
        <Link href={"/owner/operator"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Operator"} placement="right">
              <UserSearch className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Operator"}
          </Button>
        </Link>
        <Link href={"/owner/marketplace"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Marketplace"} placement="right">
              <Boxes className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Marketplace"}
          </Button>
        </Link>
        <Link href={"/owner/payment"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Payment"} placement="right">
              <Wallet className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Payment"}
          </Button>
        </Link>
        <Link href={"/owner/customer"}>
          <Button
            className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          >
            <Tooltip title={"Customers"} placement="right">
              <SupportAgentIcon className="h-6 w-6" />
            </Tooltip>
            {isExpanded && "Customers"}
          </Button>
        </Link>
        <Separator className={`mt-4 ${isExpanded ? "w-[90%]" : "w-[75%]"} mx-auto`} />
        <Button
          className={`flex gap-2 items-center bg-transparent hover:bg-white/20 mt-4 ${isExpanded ? "w-full mx-0 justify-start" : "w-fit mx-auto p-0 aspect-square justify-center rounded-full"}`}
          onClick={() => { handleLogOut() }}
        >
          <Tooltip title={"Log out"} placement="right">
            <Settings className="h-6 w-6" />
          </Tooltip>
          {isExpanded && "Log out"}
        </Button>
      </nav>
    </aside>
  )
}

export default Sidebar