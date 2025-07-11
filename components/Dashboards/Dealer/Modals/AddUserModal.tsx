"use client"

import type React from "react"

import { useState } from "react"
import { X, Upload, ChevronDown } from "lucide-react"

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    location: "",
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Here you would typically send the data to your backend
    console.log("Form Data:", formData)
    console.log("Selected Image:", selectedImage)

    // Reset form
    setFormData({
      name: "",
      email: "",
      contactNumber: "",
      location: "",
    })
    setSelectedImage(null)
    setImagePreview(null)

    // Close modal
    onClose()

    // Show success message (you can implement toast notifications here)
    alert("User added successfully!")
  }

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      name: "",
      email: "",
      contactNumber: "",
      location: "",
    })
    setSelectedImage(null)
    setImagePreview(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-100 rounded-3xl p-8 w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Name Field */}
          <div>
            <label className="block text-red-500 font-medium mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter Name"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:border-red-400 focus:outline-none bg-white text-red-400 placeholder-red-300"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-red-500 font-medium mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter Email Address"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:border-red-400 focus:outline-none bg-white text-red-400 placeholder-red-300"
            />
          </div>

          {/* Contact Number Field */}
          <div>
            <label className="block text-red-500 font-medium mb-2">Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              placeholder="Enter Contact Number"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:border-red-400 focus:outline-none bg-white text-red-400 placeholder-red-300"
            />
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-red-500 font-medium mb-2">Location</label>
            <div className="relative">
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:border-red-400 focus:outline-none bg-white text-red-400 appearance-none"
              >
                <option value="">Select Location</option>
                <option value="new-york">New York</option>
                <option value="london">London</option>
                <option value="tokyo">Tokyo</option>
                <option value="paris">Paris</option>
                <option value="dubai">Dubai</option>
                <option value="singapore">Singapore</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-400 pointer-events-none" />
            </div>
          </div>

          {/* Profile Picture Field */}
          <div>
            <label className="block text-red-500 font-medium mb-2">Profile Picture</label>
            <div className="space-y-3">
              {/* Upload Area */}
              <label className="w-full px-4 py-8 rounded-xl border-2 border-red-200 border-dashed bg-white flex flex-col items-center justify-center cursor-pointer hover:border-red-400 transition-colors">
                <Upload className="h-8 w-8 text-red-400 mb-2" />
                <span className="text-red-400 font-medium">Upload an Image</span>
                <span className="text-red-300 text-sm mt-1">PNG, JPG, GIF up to 10MB</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative">
                  <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-red-200">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="mt-2 text-sm text-red-500">Selected: {selectedImage?.name}</div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
