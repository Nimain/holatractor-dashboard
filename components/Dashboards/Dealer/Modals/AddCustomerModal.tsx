"use client"
import { useState, useRef } from "react"
import type React from "react"

import { X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export default function AddCustomerModal({ isOpen, onClose, onSubmit }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    location: "",
    profilePicture: null as File | null,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    // Reset form
    setFormData({
      name: "",
      email: "",
      contactNumber: "",
      location: "",
      profilePicture: null,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-md mx-auto relative">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors">
          <X className="h-6 w-6" />
        </button>

        {/* Modal Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Name</label>
              <Input
                type="text"
                placeholder="Enter Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full border-red-300 focus:border-red-500 focus:ring-red-500 placeholder-red-300"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="Enter Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full border-red-300 focus:border-red-500 focus:ring-red-500 placeholder-red-300"
                required
              />
            </div>

            {/* Contact Number Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Contact Number</label>
              <Input
                type="tel"
                placeholder="Enter Contact Number"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                className="w-full border-red-300 focus:border-red-500 focus:ring-red-500 placeholder-red-300"
                required
              />
            </div>

            {/* Location Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Location</label>
              <Select onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger className="w-full border-red-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue placeholder="Select Location" className="text-red-300" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-york">New York</SelectItem>
                  <SelectItem value="los-angeles">Los Angeles</SelectItem>
                  <SelectItem value="chicago">Chicago</SelectItem>
                  <SelectItem value="houston">Houston</SelectItem>
                  <SelectItem value="phoenix">Phoenix</SelectItem>
                  <SelectItem value="philadelphia">Philadelphia</SelectItem>
                  <SelectItem value="san-antonio">San Antonio</SelectItem>
                  <SelectItem value="san-diego">San Diego</SelectItem>
                  <SelectItem value="dallas">Dallas</SelectItem>
                  <SelectItem value="san-jose">San Jose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Profile Picture Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Profile Picture</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-red-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
              >
                <Upload className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 font-medium">
                  {formData.profilePicture ? formData.profilePicture.name : "Upload an Image"}
                </p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors mt-6"
            >
              Submit
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
