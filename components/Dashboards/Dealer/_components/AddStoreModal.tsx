"use client"

import React, { useState, useEffect } from 'react'
import { X, Upload, Store, Clock, Info, ImageIcon, FileText } from 'lucide-react'
import Image from 'next/image'

interface AddStoreModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddStoreModal({ isOpen, onClose }: AddStoreModalProps) {
  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('')
  const [openingTime, setOpeningTime] = useState('')
  const [closingTime, setClosingTime] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<string[]>([])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBanner(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl transform transition-all duration-300 ease-out"
        style={{ opacity: isOpen ? 1 : 0, transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
      >
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Store size={24} className="text-blue-600" />
            Add New Store
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  placeholder="Enter store name"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  placeholder="Enter country name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                placeholder="Enter store description"
                rows={4}
              />
            </div>

            {/* Store Hours Section */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 text-gray-800">
                <Clock size={20} />
                <h3 className="text-lg font-semibold">Store Hours</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="openingTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    id="openingTime"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="closingTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    id="closingTime"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="closingDay" className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Day
                  </label>
                  <select
                    id="closingDay"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
                  >
                    <option value="">Select a day</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Store Media Section */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 text-gray-800">
                <ImageIcon size={20} />
                <h3 className="text-lg font-semibold">Store Media</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Store Logo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors duration-200">
                    {logo ? (
                      <div className="relative w-32 h-32 mx-auto">
                        <Image
                          src={logo}
                          alt="Logo preview"
                          layout="fill"
                          objectFit="cover"
                          className="rounded-lg"
                        />
                        <button
                          onClick={() => setLogo(null)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Upload size={24} className="text-gray-400" />
                          <span className="text-sm text-gray-600">Click to upload logo</span>
                          <span className="text-xs text-gray-400">SVG, PNG, JPG (max. 800x800px)</span>
                        </div>
                        <input
                          type="file"
                          id="logo"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Store Banner
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors duration-200">
                    {banner ? (
                      <div className="relative w-full h-32">
                        <Image
                          src={banner}
                          alt="Banner preview"
                          layout="fill"
                          objectFit="cover"
                          className="rounded-lg"
                        />
                        <button
                          onClick={() => setBanner(null)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Upload size={24} className="text-gray-400" />
                          <span className="text-sm text-gray-600">Click to upload banner</span>
                          <span className="text-xs text-gray-400">SVG, PNG, JPG (max. 1920x1080px)</span>
                        </div>
                        <input
                          type="file"
                          id="banner"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Store Instructions Section */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 text-gray-800">
                <FileText size={20} />
                <h3 className="text-lg font-semibold">Store Instructions</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Info size={20} className="text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Important Information</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Please ensure all store information is accurate and up-to-date. This information will be displayed to customers.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">Image Requirements</h5>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Logo: Maximum size 800x800px</li>
                      <li>• Banner: Maximum size 1920x1080px</li>
                      <li>• Accepted formats: SVG, PNG, JPG</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">Store Hours Format</h5>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Use 24-hour format</li>
                      <li>• Select one closing day per week</li>
                      <li>• Hours will be displayed in local time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end items-center gap-4 p-6 bg-gray-50 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            Create Store
          </button>
        </div>
      </div>
    </div>
  )
}