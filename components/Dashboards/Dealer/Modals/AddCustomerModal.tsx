"use client"
import { useState, useRef } from "react"
import type React from "react"

import { X, Upload, Camera, User, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCookie } from "next-cookie"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { getAuthToken, getAuthUser } from "@/utils/auth/clientAuth"
import { uploadFileToS3 } from "@/utils/AWS/FileUpload"

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

    const authUser = getAuthUser()
    const activeToken = access_token || getAuthToken()

    let parsedDealerUser: any = null
    try {
      parsedDealerUser = typeof dealerUser === "string" ? JSON.parse(decodeURIComponent(dealerUser)) : dealerUser
    } catch {}

    const hasUser = authUser?.userId || authUser?.id || parsedDealerUser?.userId || parsedDealerUser?.id
    if (!hasUser) {
      errorMessage("User session not found. Please refresh or login again.")
      return
    }

    setIsLoading(true)

    try {
      let dealer_id = ""
      let base_id = ""

      try {
        const dealerRes = await renderInstance.get("/dealer", {
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        })

        if (Array.isArray(dealerRes.data) && dealerRes.data.length > 0) {
          const matched = dealerRes.data.find(
            (d: any) => d.user_id === authUser?.userId || d.id === authUser?.userId || d.user_id === parsedDealerUser?.userId
          )
          dealer_id = matched?.id || matched?.dealer_id || dealerRes.data[0]?.id || ""
          base_id = matched?.base_id || dealerRes.data[0]?.base_id || ""
        } else if (dealerRes.data?.id) {
          dealer_id = dealerRes.data.id
          base_id = dealerRes.data.base_id || ""
        }
      } catch (err) {
        console.warn("Could not fetch /dealer directly, using auth user fallback:", err)
      }

      if (!dealer_id) {
        const directCookieDealer = cookie?.get("dealer_id")
        dealer_id =
          (directCookieDealer && directCookieDealer !== "all" ? directCookieDealer : "") ||
          (authUser as any)?.dealer_id ||
          parsedDealerUser?.dealer_id ||
          authUser?.userId ||
          parsedDealerUser?.userId ||
          parsedDealerUser?.id ||
          ""
      }

      // Upload image if selected
      let imageUrl = ""
      if (formData.image) {
        try {
          imageUrl = await uploadFileToS3(formData.image, formData.image.name)
        } catch (err) {
          console.warn("Image upload failed, continuing without image:", err)
        }
      }

      // Create customer payload
      const customerData: Record<string, any> = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        gender: formData.gender,
        image: imageUrl || "",
        city: formData.city.trim(),
        dealer_id: dealer_id,
        status: "Active"
      }

      if (base_id && base_id !== "default") {
        customerData.base_id = base_id
      }

      const response = await renderInstance.post('/dealer/customers', customerData, {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
      })

      // Toaster removed as per user request - closes modal directly
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
      const detailMsg = error.response?.data?.detail || error.response?.data?.message

      if (error.response?.status === 401) {
        errorMessage("Unauthorized. Please login again.")
      } else if (detailMsg) {
        errorMessage(detailMsg)
      } else {
        errorMessage("Failed to add customer. Please check your input and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto relative overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-[#A10A0C] to-[#3B0404] text-white">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Add New Customer</h2>
            <p className="text-xs text-white/80">Enter customer details and personal contact information</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors cursor-pointer"
            type="button"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form - 2-Column Grid (Fits screen without internal scrolling) */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              {/* First Name Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Carlos"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className="w-full h-10 text-sm border-gray-200 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              {/* Last Name Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Gutierrez"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className="w-full h-10 text-sm border-gray-200 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="carlos@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full h-10 text-sm border-gray-200 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              {/* Mobile Number Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="+591 71234567"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  className="w-full h-10 text-sm border-gray-200 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              {/* Gender Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className="w-full h-10 text-sm border-gray-200 focus:border-red-500 focus:ring-red-500">
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Santa Cruz"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full h-10 text-sm border-gray-200 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              {/* Profile Picture Field - Compact Row */}
              <div className="sm:col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
                    <Camera size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700">Profile Photo</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {formData.image ? formData.image.name : "Optional (JPG, PNG up to 5MB)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                      className="text-xs text-red-600 hover:underline px-1 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs h-8 px-3 border-gray-300 hover:bg-white cursor-pointer"
                  >
                    <Upload size={13} className="mr-1.5" />
                    {formData.image ? "Change" : "Browse"}
                  </Button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold h-11 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? 'Adding Customer...' : 'Add Customer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}