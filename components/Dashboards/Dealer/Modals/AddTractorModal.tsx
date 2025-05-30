"use client"
import { useState } from "react"
import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Check, Info, Upload } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { useCookie } from "next-cookie"
import { useParams } from "next/navigation"
import { CircularProgress } from "@mui/material"

interface Tractor {
  id: string
  name: string
  description: string
  images: string[]
  model: string
  type: string
  year: string
  inventory: { fixedPrice: number }[]
}

interface Step {
  title: string
}

const steps: Step[] = [
  {
    title: "Upload Image",
  },
  {
    title: "Basic Details",
  },
  {
    title: "Technical Details",
  },
]

interface AddTractorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTractor: Tractor | null
}

export function AddTractorModal({ open, onOpenChange, selectedTractor }: AddTractorModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [image, setImage] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    brand: selectedTractor?.name || "",
    model: selectedTractor?.model || "",
    manufactureYear: selectedTractor?.year ? new Date(selectedTractor.year).getFullYear().toString() : "",
    monthlyPrice: "",
    sellingPrice: selectedTractor?.inventory[0]?.fixedPrice?.toString() || "",
    warranty: "",
    features: "",
    horsePower: "",
    torque: "",
    zeroToSixty: "",
    engineType: selectedTractor?.type || "",
    fuelCapacity: "",
    transmission: "",
    weight: "",
    dimensions: "",
    maxSpeed: "",
    tireType: "",
    ptoPower: "",
    liftCapacity: "",
    listingType: "sell",
  })
  const [adding, setAdding] = useState(false)

  const { slug } = useParams()
  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddTractor = async () => {
    if (!selectedTractor) {
      errorMessage("No tractor selected")
      return
    }
    if (!slug) {
      errorMessage("Store not available")
      return
    }
    if (!formData.sellingPrice || Number.parseFloat(formData.sellingPrice) <= 0) {
      errorMessage("Please provide a valid selling price (required field)")
      return
    }

    // Log the authorization key
    console.log("Authorization Key (access_token):", access_token)

    const addTractorBody = {
      inventory_tractor_id: selectedTractor.id,
      price: Number.parseFloat(formData.sellingPrice), // REQUIRED FIELD
      monthly_price: formData.monthlyPrice ? Number.parseFloat(formData.monthlyPrice) : undefined, // Optional
      horsePower: formData.horsePower ? Number.parseInt(formData.horsePower, 10) : undefined,
      torque: formData.torque ? Number.parseInt(formData.torque, 10) : undefined,
      zeroToSixty: formData.zeroToSixty ? Number.parseFloat(formData.zeroToSixty) : undefined,
      features: formData.features ? formData.features.split(",").map((f) => f.trim()).filter((f) => f) : [],
      engineType: formData.engineType || selectedTractor.type,
      fuelCapacity: formData.fuelCapacity ? Number.parseFloat(formData.fuelCapacity) : undefined,
      transmission: formData.transmission || undefined,
      weight: formData.weight ? Number.parseFloat(formData.weight) : undefined,
      dimensions: formData.dimensions || undefined,
      maxSpeed: formData.maxSpeed ? Number.parseFloat(formData.maxSpeed) : undefined,
      tireType: formData.tireType || undefined,
      seatingCapacity: 2, // Default value
      ptoPower: formData.ptoPower ? Number.parseInt(formData.ptoPower, 10) : undefined,
      liftCapacity: formData.liftCapacity ? Number.parseInt(formData.liftCapacity, 10) : undefined,
      warranty: formData.warranty || undefined,
      manufactureYear: formData.manufactureYear ? Number.parseInt(formData.manufactureYear, 10) : undefined,
      brand: formData.brand || selectedTractor.name,
      model: formData.model || selectedTractor.model,
      listingType: formData.listingType.toUpperCase(), // Ensure uppercase to match API expectations
      store_id: slug,
    }

    console.log("Submitting tractor data:", addTractorBody)

    setAdding(true)
    try {
      await renderInstance.patch("/dealer/stores/addTractorToDealerStore", addTractorBody, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      successMessage("Tractor added successfully")
      setFormData({
        brand: "",
        model: "",
        manufactureYear: "",
        monthlyPrice: "",
        sellingPrice: "",
        warranty: "",
        features: "",
        horsePower: "",
        torque: "",
        zeroToSixty: "",
        engineType: "",
        fuelCapacity: "",
        transmission: "",
        weight: "",
        dimensions: "",
        maxSpeed: "",
        tireType: "",
        ptoPower: "",
        liftCapacity: "",
        listingType: "sell",
      })
      setImage(null)
      setCurrentStep(0)
      onOpenChange(false)
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        if (err.response.data.message === "Store not found") {
          errorMessage("Store not found")
        } else if (err.response.data.message === "Tractor is not valid") {
          errorMessage("Tractor is not valid")
        } else if (err.response.data.message === "Login user not found") {
          errorMessage("Login user not found")
        }
      } else if (err.response && err.response.status === 400) {
        if (err.response.data.message === "You are not allowed for this task") {
          errorMessage("You are not allowed for this task")
        }
      } else {
        errorMessage("Error adding tractor to store")
      }
      console.error("Error adding tractor:", err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1">
              <DialogTitle className="text-2xl text-center">
                Add Tractor {selectedTractor?.name ? `- ${selectedTractor.name}` : ""}
              </DialogTitle>
              <DialogDescription className="text-center">
                Provide the details for the selected tractor
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full absolute right-4 top-4"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center items-center mt-6 mb-12">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-center mt-6">
                <div
                  className={`
                    flex items-center rounded-full
                    ${
                      index < currentStep
                        ? "bg-white shadow-sm border border-indigo-100"
                        : index === currentStep
                          ? "border-2 border-indigo-600"
                          : "border border-gray-200"
                    }
                    ${index === currentStep ? "px-3 py-1.5" : "px-4 py-1.5"}
                  `}
                >
                  {index < currentStep ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-600">{step.title}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className={`
                        w-5 h-5 rounded-full flex items-center justify-center text-xs
                        ${index === currentStep ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"}
                      `}
                      >
                        {index + 1}
                      </div>
                      <span className={`text-sm ${index === currentStep ? "text-gray-900" : "text-gray-400"}`}>
                        {step.title}
                      </span>
                    </div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-[1px] mx-2 ${index < currentStep ? "bg-indigo-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>
        <div className="mt-4 mb-6">
          <h3 className="text-lg font-semibold">Step {currentStep + 1}</h3>
          <h2 className="text-2xl font-bold mt-2">
            {currentStep === 0 ? "Upload Image" : currentStep === 1 ? "Basic Information" : "Technical Specifications"}
          </h2>
        </div>
        <form className="grid grid-cols-2 gap-6 py-4">
          {currentStep === 0 ? (
            <div className="col-span-2 space-y-4">
              <label className="block text-sm font-medium text-gray-700">Tractor Image</label>
              <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg transition-colors duration-200 ease-in-out hover:border-indigo-400"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith("image/")) {
                    setImage(file)
                  }
                }}
              >
                <div className="space-y-1 text-center">
                  {image ? (
                    <div className="relative w-full h-64 mb-4">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Uploaded tractor"
                        className="mx-auto object-cover rounded-lg shadow-md w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => setImage(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : selectedTractor?.images[0] ? (
                    <div className="relative w-full h-64 mb-4">
                      <img
                        src={selectedTractor.images[0]}
                        alt={selectedTractor.name}
                        className="mx-auto object-cover rounded-lg shadow-md w-full h-full"
                      />
                    </div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setImage(file)
                          }
                        }}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
              {image && (
                <p className="text-sm text-gray-500 text-center">
                  {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          ) : currentStep === 1 ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Input name="brand" placeholder="Enter brand" value={formData.brand} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Input name="model" placeholder="Enter model" value={formData.model} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacture Year</label>
                <Input
                  name="manufactureYear"
                  placeholder="Enter manufacture year"
                  type="number"
                  value={formData.manufactureYear}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Price</label>
                <div className="relative">
                  <Input
                    name="monthlyPrice"
                    placeholder="Enter monthly price"
                    type="number"
                    value={formData.monthlyPrice}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0">
                        <Info className="h-4 w-4 text-gray-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium">Monthly Price Information</p>
                        <Button
                          variant="ghost"
                          className="h-6 w-6 p-0 -mr-2 -mt-2"
                          onClick={() => document.body.click()}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Set the monthly rental price for this tractor. This price will be displayed to potential renters
                        and should reflect market rates for similar equipment.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Selling Price</label>
                <div className="relative">
                  <Input
                    name="sellingPrice"
                    placeholder="Enter selling price"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0">
                        <Info className="h-4 w-4 text-gray-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium">Selling Price Information</p>
                        <Button
                          variant="ghost"
                          className="h-6 w-6 p-0 -mr-2 -mt-2"
                          onClick={() => document.body.click()}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Set the selling price if this tractor is available for purchase. Make sure to consider market
                        value, condition, and included features when setting the price.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Warranty</label>
                <Input
                  name="warranty"
                  placeholder="Enter warranty details"
                  value={formData.warranty}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Listing Type</label>
                <select
                  name="listingType"
                  value={formData.listingType}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="sell">Sell</option>
                  <option value="lease">Lease</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">
                  Features (Select from: GPS Tracking, Air Conditioning, Heated Seats, etc.)
                </label>
                <Textarea
                  name="features"
                  placeholder="Enter features (comma-separated, e.g., GPS Tracking, Air Conditioning, Heated Seats)"
                  value={formData.features}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horsepower</label>
                <Input
                  name="horsePower"
                  placeholder="Enter horsepower"
                  type="number"
                  value={formData.horsePower}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Torque (Nm)</label>
                <Input
                  name="torque"
                  placeholder="Enter torque (Nm)"
                  type="number"
                  value={formData.torque}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">0-60 Time (seconds)</label>
                <Input
                  name="zeroToSixty"
                  placeholder="Enter 0-60 time (seconds)"
                  type="number"
                  step="0.1"
                  value={formData.zeroToSixty}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Engine Type</label>
                <Input
                  name="engineType"
                  placeholder="Enter engine type"
                  value={formData.engineType}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fuel Capacity (liters)</label>
                <Input
                  name="fuelCapacity"
                  placeholder="Enter fuel capacity (liters)"
                  type="number"
                  step="0.1"
                  value={formData.fuelCapacity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Transmission</label>
                <Input
                  name="transmission"
                  placeholder="Enter transmission type"
                  value={formData.transmission}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight (kg)</label>
                <Input
                  name="weight"
                  placeholder="Enter weight (kg)"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dimensions (LxWxH in meters)</label>
                <Input
                  name="dimensions"
                  placeholder="Enter dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Speed (km/h)</label>
                <Input
                  name="maxSpeed"
                  placeholder="Enter max speed (km/h)"
                  type="number"
                  step="0.1"
                  value={formData.maxSpeed}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tire Type</label>
                <Input
                  name="tireType"
                  placeholder="Enter tire type"
                  value={formData.tireType}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PTO Power (HP)</label>
                <Input
                  name="ptoPower"
                  placeholder="Enter PTO power (HP)"
                  type="number"
                  value={formData.ptoPower}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lift Capacity (kg)</label>
                <Input
                  name="liftCapacity"
                  placeholder="Enter lift capacity (kg)"
                  type="number"
                  value={formData.liftCapacity}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
          <div className="col-span-2 flex justify-between">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                if (currentStep < 2) {
                  setCurrentStep(currentStep + 1)
                } else {
                  handleAddTractor()
                }
              }}
              disabled={adding}
            >
              {adding ? <CircularProgress size={24} /> : currentStep < 2 ? "Next" : "Add Tractor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}