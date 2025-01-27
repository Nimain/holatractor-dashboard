"use client"
import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Check, Info, Upload } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
export function AddTractorModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [image, setImage] = useState<File | null>(null)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1">
              <DialogTitle className="text-2xl text-center">Add Tractor</DialogTitle>
              <DialogDescription className="text-center">
                Give all the details please
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full absolute right-4 top-4" 
              onClick={() => onOpenChange(false)}
            >
            </Button>
          </div>
          <div className="flex justify-center items-center mt-6 mb-12">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-center mt-6">
                <div
                  className={`
                    flex items-center rounded-full
                    ${index < currentStep 
                      ? 'bg-white shadow-sm border border-indigo-100' 
                      : index === currentStep 
                      ? 'border-2 border-indigo-600' 
                      : 'border border-gray-200'
                    }
                    ${index === currentStep ? 'px-3 py-1.5' : 'px-4 py-1.5'}
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
                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center text-xs
                        ${index === currentStep 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}>
                        {index + 1}
                      </div>
                      <span className={`text-sm ${
                        index === currentStep ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-[1px] mx-2 ${
                    index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
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
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    setImage(file);
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
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload a file</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImage(file);
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
                <Input placeholder="Enter brand" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Input placeholder="Enter model" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacture Year</label>
                <Input placeholder="Enter manufacture year" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Price</label>
                <div className="relative">
                  <Input placeholder="Enter monthly price" type="number" className="pr-10" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <Info className="h-4 w-4 text-gray-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium">Monthly Price Information</p>
                        <Button 
                          variant="ghost" 
                          className="h-6 w-6 p-0 -mr-2 -mt-2"
                          onClick={() => document.body.click()} // Close popover
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Set the monthly rental price for this tractor. This price will be displayed to potential renters and should reflect market rates for similar equipment.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Selling Price</label>
                <div className="relative">
                  <Input placeholder="Enter selling price" type="number" className="pr-10" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <Info className="h-4 w-4 text-gray-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium">Selling Price Information</p>
                        <Button 
                          variant="ghost" 
                          className="h-6 w-6 p-0 -mr-2 -mt-2"
                          onClick={() => document.body.click()} // Close popover
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Set the selling price if this tractor is available for purchase. Make sure to consider market value, condition, and included features when setting the price.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Warranty</label>
                <Input placeholder="Enter warranty details" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Features</label>
                <Textarea placeholder="Enter features" className="min-h-[100px]" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horsepower</label>
                <Input placeholder="Enter horsepower" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Torque (Nm)</label>
                <Input placeholder="Enter torque" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">0-60 Time (seconds)</label>
                <Input placeholder="Enter 0-60 time" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Engine Type</label>
                <Input placeholder="Enter engine type" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fuel Capacity (liters)</label>
                <Input placeholder="Enter fuel capacity" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Transmission</label>
                <Input placeholder="Enter transmission type" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight (kg)</label>
                <Input placeholder="Enter weight" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dimensions (LxWxH in meters)</label>
                <Input placeholder="Enter dimensions" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Speed (km/h)</label>
                <Input placeholder="Enter max speed" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tire Type</label>
                <Input placeholder="Enter tire type" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">No of Cylinders</label>
                <Input placeholder="Enter number of cylinders" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PTO Power (HP)</label>
                <Input placeholder="Enter PTO power" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lift Capacity (kg)</label>
                <Input placeholder="Enter lift capacity" />
              </div>
            </>
          )}
          <div className="col-span-2 flex justify-between">
            {currentStep > 0 && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
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
                  // Handle form submission
                  onOpenChange(false)
                }
              }}
            >
              {currentStep < 2 ? 'Next' : 'Add Tractor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}