"use client"
import { useState, useRef } from "react"
import type React from "react"

import { X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCookie } from "next-cookie"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export default function AddCustomerModal({ isOpen, onClose, onSubmit }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    gender: "Male",
    city: "",
    image: null as File | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { cookie } = useCookie()
  const dealerUser = cookie?.get("user")
  const access_token = cookie?.get("access_token")

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
        image: file,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.mobile || !formData.city) {
      errorMessage('Please fill in all required fields')
      return
    }

    if (!dealerUser?.userId) {
      errorMessage("User not found. Please login again.")
      return
    }

    setIsLoading(true)

    try {
      console.log('Step 1: Fetching dealer info...')

      // First, get dealer info to get dealer_id and base_id
      const dealerRes = await renderInstance.get("/dealer", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })

      console.log('Dealer data:', dealerRes.data)
      
      // ✅ CORRECTED LOGIC: Check if the response is a non-empty array
      if (!Array.isArray(dealerRes.data) || dealerRes.data.length === 0) {
        errorMessage("Could not retrieve dealer information to create customer.");
        setIsLoading(false);
        return; // Stop execution
      }

      // ✅ CORRECTED LOGIC: Access properties from the FIRST object in the array
      const dealer_id = dealerRes.data[0].id;
      const base_id = dealerRes.data[0].base_id;

      console.log('dealer_id:', dealer_id)
      console.log('base_id:', base_id)

      // Upload image if exists
      let imageUrl = ""
      if (formData.image) {
        console.log('Step 2: Uploading image...')
        const imageFormData = new FormData()
        imageFormData.append('image', formData.image)

        try {
          const imageRes = await renderInstance.post('/upload/image', imageFormData, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          })

          if (imageRes.data?.url) {
            imageUrl = imageRes.data.url
            console.log('Image uploaded:', imageUrl)
          }
        } catch (err) {
          console.log('Image upload failed, continuing without image:', err)
        }
      }

      // Create customer with the API structure
      const customerData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile: formData.mobile,
        gender: formData.gender,
        image: imageUrl,
        city: formData.city,
        dealer_id: dealer_id,
        base_id: base_id,
        status: "Active"
      }

      console.log('Step 3: Creating customer with data:', customerData)

      const response = await renderInstance.post('/dealer/customers', customerData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })

      console.log('Customer created successfully:', response.data)

      successMessage('Customer added successfully!')

      // Call the parent onSubmit
      onSubmit(response.data)

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        gender: "Male",
        city: "",
        image: null,
      })

    } catch (error: any) {
      console.error('ERROR in handleSubmit:', error)
      console.error('Error response:', error.response?.data)

      if (error.response?.status === 401) {
        errorMessage("Unauthorized. Please login again.")
      } else if (error.response?.status === 400) {
        errorMessage(error.response?.data?.message || "Invalid data. Please check your input.")
      } else if (error.response?.status === 500) {
        errorMessage("Server error. Please try again later.")
      } else {
        errorMessage(error.response?.data?.message || "Error adding customer. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors z-10"
          type="button"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Modal Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Add New Customer</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">First Name</label>
              <Input
                type="text"
                placeholder="Enter First Name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                className="w-full border-red-300 focus:border-red-500 focus:ring-red-500 placeholder-red-300"
                required
              />
            </div>

            {/* Last Name Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Last Name</label>
              <Input
                type="text"
                placeholder="Enter Last Name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
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

            {/* Mobile Number Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Mobile Number</label>
              <Input
                type="tel"
                placeholder="Enter Mobile Number"
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                className="w-full border-red-300 focus:border-red-500 focus:ring-red-500 placeholder-red-300"
                required
              />
            </div>

            {/* Gender Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Gender</label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger className="w-full border-red-300 focus:border-red-500 focus:ring-red-500">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">City</label>
              <Input
                type="text"
                placeholder="Enter City"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="w-full border-red-300 focus:border-red-500 focus:ring-red-500 placeholder-red-300"
                required
              />
            </div>

            {/* Profile Picture Field */}
            <div>
              <label className="block text-red-500 font-medium mb-2">Profile Picture (Optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-red-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
              >
                <Upload className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 font-medium">
                  {formData.image ? formData.image.name : "Upload an Image"}
                </p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding Customer...' : 'Submit'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}