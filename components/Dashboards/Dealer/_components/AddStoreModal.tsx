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
import { Checkbox } from "@/components/ui/checkbox"
import { FeatureGroup, MapContainer, TileLayer } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import { Button } from "@/components/ui/button"
import { MapPin, Trash2, Upload } from "lucide-react"
import { Backdrop, CircularProgress } from "@mui/material"
import { Card, CardContent } from "@/components/ui/card"

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
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [mainImage, setMainImage] = useState<File | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null })

  const [name, setName] = useState("")
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
  const additionalImagesInputRef = useRef<HTMLInputElement>(null)

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
          setDescription("")
          setOpeningTime("")
          setClosingTime("")
          setClosingDays([])
          setFiles([])
          setMainImage(null)
          setStep(1)
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
      setStep(1)
      setName("")
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
        <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={creating}>
          <div className="flex flex-col items-center gap-4">
            <CircularProgress />
            {creatingMessage && <p className="text-white">{creatingMessage}</p>}
          </div>
        </Backdrop>

        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Store Details" : step === 2 ? "Operating Hours" : "Additional Information"}
          </DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent>
            <div className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Store Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                      }}
                      placeholder="Enter store name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value)
                      }}
                      placeholder="Describe your store"
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mainImage">Store Logo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="mainImage"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        ref={fileInputRef}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          fileInputRef.current?.click()
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                    {mainImage && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={URL.createObjectURL(mainImage) || "/placeholder.svg"}
                          alt="Store logo"
                          className="w-20 h-20 object-cover rounded"
                        />
                        <span className="text-sm">{mainImage.name}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={removeMainImage}>
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
                        onChange={(e) => {
                          setOpeningTime(e.target.value)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="closingTime">Closing Time</Label>
                      <Input
                        id="closingTime"
                        type="time"
                        value={closingTime}
                        onChange={(e) => {
                          setClosingTime(e.target.value)
                        }}
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
                        <label key={day} className="flex items-center space-x-2 border rounded-md p-2">
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
                    <Label>Banner Images</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          additionalImagesInputRef.current?.click()
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Add Banner Images
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        ref={additionalImagesInputRef}
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                    {files.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between border rounded-md p-2">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)}>
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
                        value={
                          location.latitude && location.longitude
                            ? `lat: ${location.latitude.toFixed(6)}, lng: ${location.longitude.toFixed(6)}`
                            : "Location not selected"
                        }
                        readOnly
                      />
                      <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
                        <Button type="button" variant="outline" onClick={() => setLocationOpen(true)}>
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
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                {step < 2 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleAddStore} disabled={creating}>
                    {creating ? "Creating..." : "Create Store"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default DealerStoreModal
