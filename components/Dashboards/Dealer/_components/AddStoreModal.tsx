"use client"

import { uploadFileToS3 } from "@/utils/AWS/FileUpload"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { useCookie } from "next-cookie"
import { useState, useEffect, type ChangeEvent, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeatureGroup, MapContainer, TileLayer } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import { Button } from "@/components/ui/button"
import { MapPin, Upload, Clock, ImageIcon, FileText, Info, Trash2 } from "lucide-react"
import { Backdrop, CircularProgress } from "@mui/material"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Location {
  latitude: number | null
  longitude: number | null
}

interface User {
  userId: string
  image: string
  name: string
  email: string
}

interface DealerStoreModalProps {
  isOpen: boolean
  onClose: () => void
  onStoreCreated?: (store: any) => void
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const DealerStoreModal = ({ isOpen, onClose, onStoreCreated }: DealerStoreModalProps) => {
  const [locationOpen, setLocationOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null })
  const [name, setName] = useState("")
  const [country, setCountry] = useState("")
  const [description, setDescription] = useState("")
  const [openingTime, setOpeningTime] = useState("")
  const [closingTime, setClosingTime] = useState("")
  const [closingDays, setClosingDays] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [creatingMessage, setCreatingMessage] = useState("")

  const { cookie } = useCookie()
  const user: User = cookie.get("user")
  const access_token = cookie.get("access_token")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

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

  const _created = (e: any) => {
    const locDet: Location = {
      latitude: e.layer._latlng.lat,
      longitude: e.layer._latlng.lng,
    }
    setLocation(locDet)
    setLocationOpen(false)
  }

  async function handleAddStore() {
    if (!name) {
      errorMessage("Store name can't be empty")
      return
    }
    if (!description) {
      errorMessage("Store description can't be empty")
      return
    }
    if (!location.latitude || !location.longitude) {
      errorMessage("Please select store location")
      return
    }

    setCreating(true)
    let logoUrl = ""
    const bannerImages: string[] = []

    if (mainImage) {
      setCreatingMessage("Uploading logo image")
      const buffer = Buffer.from(await mainImage.arrayBuffer())
      logoUrl = await uploadFileToS3(buffer, mainImage.name)
      setCreatingMessage("")
    }

    if (files.length > 0) {
      setCreatingMessage("Uploading banner images")
      for (const image of files) {
        const buffer = Buffer.from(await image.arrayBuffer())
        const imageLink = await uploadFileToS3(buffer, image.name)
        bannerImages.push(imageLink)
      }
      setCreatingMessage("")
    }

    const storeData = {
      store_lat: `${location.latitude}`,
      store_lan: `${location.longitude}`,
      owner_id: user.userId,
      name,
      description,
      banner: bannerImages.length > 0 ? bannerImages : [""],
      logo: logoUrl,
      opening_time: new Date(`1970-01-01T${openingTime}:00.000Z`),
      closing_time: new Date(`1970-01-01T${closingTime}:00.000Z`),
      closing_days: closingDays,
    }

    console.log("Submitting store data:", storeData)

    renderInstance
      .post("/dealer/store", storeData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 201) {
          successMessage("Store created successfully")
          // Reset state variables
          setName("")
          setCountry("")
          setDescription("")
          setOpeningTime("")
          setClosingTime("")
          setClosingDays([])
          setFiles([])
          setMainImage(null)
          onClose()
          if (onStoreCreated) {
            onStoreCreated(res.data)
          }
        }
      })
      .catch((err) => {
        if (err.response && err.response.status === 409) {
          if (err.response.data.message === "Log in user not found") {
            errorMessage("Log in user not found")
          } else if (err.response.data.message === "Wrong owner id") {
            errorMessage("Wrong owner id")
          } else if (err.response.data.message === "No active subscriptions") {
            errorMessage("No active subscriptions")
          } else if (err.response.data.message === "Maximum store count reached") {
            errorMessage("Maximum store count reached")
          } else {
            errorMessage(err.response.data.message || "Failed to create store")
          }
        } else {
          errorMessage("Some error occurred")
        }
      })
      .finally(() => {
        setCreating(false)
        setCreatingMessage("")
      })
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error: GeolocationPositionError) => {
          setError(error.message)
        },
      )
    } else {
      setError("Geolocation is not supported by this browser.")
    }
  }, [])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("")
      setCountry("")
      setDescription("")
      setOpeningTime("")
      setClosingTime("")
      setClosingDays([])
      setFiles([])
      setMainImage(null)
      setCreatingMessage("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[800px] max-h-[90vh] overflow-auto bg-gradient-to-br from-[#A10A0C] to-[#7A0808] text-white border-red-700"
        style={{ scrollbarWidth: "none" }}
      >
        <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={creating}>
          <div className="flex flex-col items-center gap-4">
            <CircularProgress />
            {creatingMessage && <p className="text-white">{creatingMessage}</p>}
          </div>
        </Backdrop>

        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zm14 3H2v5a2 2 0 002 2h12a2 2 0 002-2V7zM2 17a2 2 0 002 2h12a2 2 0 002-2v-2H2v2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            Add New Store
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white font-medium">
                Store Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Store Name"
                className="bg-transparent border-white/30 text-white placeholder:text-white/60 focus:border-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-white font-medium">
                Country
              </Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter Country Name"
                className="bg-transparent border-white/30 text-white placeholder:text-white/60 focus:border-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Store Description"
              className="bg-transparent border-white/30 text-white placeholder:text-white/60 focus:border-white min-h-[120px] resize-none"
            />
          </div>

          {/* Store Hours */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-500" />
                Store Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingTime" className="text-gray-700">
                    Opening Time
                  </Label>
                  <div className="relative">
                    <Input
                      id="openingTime"
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="bg-white border-red-300 text-gray-900 focus:border-red-500"
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingTime" className="text-gray-700">
                    Closing Time
                  </Label>
                  <div className="relative">
                    <Input
                      id="closingTime"
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="bg-white border-red-300 text-gray-900 focus:border-red-500"
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Closing Day</Label>
                  <Select value={closingDays[0] || ""} onValueChange={(value) => setClosingDays([value])}>
                    <SelectTrigger className="bg-white border-red-300 text-gray-900 focus:border-red-500">
                      <SelectValue placeholder="Select closing day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Media */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-red-600 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-red-500" />
                Store Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Store Logo</Label>
                  <div
                    className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {mainImage ? (
                      <div className="space-y-2">
                        <img
                          src={URL.createObjectURL(mainImage) || "/placeholder.svg"}
                          alt="Store logo"
                          className="w-20 h-20 object-cover rounded mx-auto"
                        />
                        <p className="text-gray-600 text-sm">{mainImage.name}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMainImage()
                          }}
                          className="text-white/80 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-red-400 mx-auto" />
                        <p className="text-red-600 font-medium">Click to upload Logo</p>
                        <p className="text-gray-500 text-xs">SVG, JPG, PNG (max. 800×800px)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleMainImageChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Store Banner</Label>
                  <div
                    className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {files.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {files.slice(0, 4).map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file) || "/placeholder.svg"}
                                alt={`Banner ${index + 1}`}
                                className="w-full h-16 object-cover rounded"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFile(index)
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        {files.length > 4 && <p className="text-white/80 text-sm">+{files.length - 4} more images</p>}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-red-400 mx-auto" />
                        <p className="text-red-600 font-medium">Click to upload Banner</p>
                        <p className="text-gray-500 text-xs">SVG, JPG, PNG (max. 800×800px)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Location Picker */}
              <div className="space-y-2">
                <Label className="text-gray-700">Store Location</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Select store location"
                    value={
                      location.latitude && location.longitude
                        ? `lat: ${location.latitude.toFixed(6)}, lng: ${location.longitude.toFixed(6)}`
                        : "Location not selected"
                    }
                    readOnly
                    className="bg-white border-red-300 text-gray-900"
                  />
                  <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocationOpen(true)}
                      className="bg-white text-red-600 border-white hover:bg-red-50"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Pick Location
                    </Button>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Select Store Location</DialogTitle>
                      </DialogHeader>
                      {error ? (
                        <p>Error: {error}</p>
                      ) : location.latitude && location.longitude ? (
                        <div style={{ height: "60vh", width: "100%" }}>
                          <MapContainer
                            center={[location.latitude, location.longitude]}
                            zoom={13}
                            scrollWheelZoom={false}
                            style={{ width: "100%", height: "100%", zIndex: 1 }}
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
                        </div>
                      ) : (
                        <p>Latitude and longitude not available</p>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Instructions */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-red-600 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                Store Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-500 border border-red-400 rounded-lg p-4 text-white">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Important Information</p>
                    <p className="text-sm mt-1">
                      Please Ensure all store information is accurate and up-to-date. This information will be displayed
                      to customers
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-red-600 text-sm">Image Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-gray-600 text-xs">
                    <p>• Logo: Maximum size 800×800px</p>
                    <p>• Banner: Maximum size 1920×1920px</p>
                    <p>• Accepted Formats: SVG, PNG, JPG</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-red-600 text-sm">Store Hours Format</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-gray-600 text-xs">
                    <p>• Use 24-hour format</p>
                    <p>• Select one closing day per week</p>
                    <p>• Hours will be displayed in local time</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-transparent border-white text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStore}
              disabled={creating}
              className="bg-white text-red-600 hover:bg-red-50 font-medium"
            >
              {creating ? "Creating..." : "Create Store"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DealerStoreModal
