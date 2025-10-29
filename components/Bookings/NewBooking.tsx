"use client"

import { useEffect, useState } from 'react'
import { Store } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import Image from 'next/image';
import Link from 'next/link';

interface NewBookingProps {
  onBookingCreated?: () => void;
}

const NewBooking = ({ onBookingCreated }: NewBookingProps) => {
  const [open, setOpen] = useState(false)
  const [allStores, setAllStores] = useState<Store[]>([])
  const [fetchingStores, setFetchingStores] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  function fetchAllStores() {
    if (!access_token) {
      errorMessage("Admin not logged in")
      return
    }

    setFetchingStores(true)
    renderInstance.get("/store", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    })
      .then((res) => {
        if (res.status === 200) {
          console.log("Stores fetched successfully:", res.data.length)
          setAllStores(res.data)
        }
      })
      .catch((err) => {
        console.error("Error fetching stores:", err)
        if (err.response?.status === 401) {
          errorMessage("Session expired. Please login again.")
        } else {
          errorMessage("Error in fetching store lists")
        }
      })
      .finally(() => { 
        setFetchingStores(false) 
      })
  }

  useEffect(() => {
    if (open && access_token) {
      fetchAllStores()
    }
  }, [open, access_token])

  useEffect(() => {
    const handleBookingSuccess = (event: CustomEvent) => {
      console.log("Booking created successfully, refreshing list...")
      if (onBookingCreated) {
        onBookingCreated()
      }
      successMessage("Booking created successfully!")
    }

    window.addEventListener('bookingCreated' as any, handleBookingSuccess as any)

    const checkForNewBooking = () => {
      const bookingCreated = sessionStorage.getItem('bookingCreated')
      if (bookingCreated === 'true') {
        console.log("Detected new booking from sessionStorage")
        sessionStorage.removeItem('bookingCreated')
        if (onBookingCreated) {
          setTimeout(() => {
            onBookingCreated()
            successMessage("Booking created successfully!")
          }, 500)
        }
      }
    }

    checkForNewBooking()
    window.addEventListener('focus', checkForNewBooking)

    return () => {
      window.removeEventListener('bookingCreated' as any, handleBookingSuccess as any)
      window.removeEventListener('focus', checkForNewBooking)
    }
  }, [onBookingCreated])

  const handleStoreSelect = (storeId: string) => {
    console.log("Store selected:", storeId)
    setOpen(false)
  }

  const filteredStores = allStores.filter(store => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    const ownerUser = store.agentOwner?.user || store.owner?.user
    const ownerName = ownerUser 
      ? `${ownerUser.first_name} ${ownerUser.middle_name || ""} ${ownerUser.last_name}`.toLowerCase()
      : ""
    return (
      store.name.toLowerCase().includes(search) ||
      ownerName.includes(search) ||
      (store.description || "").toLowerCase().includes(search)
    )
  })

  return (
    <>
      <button
        name="new_tractor_add"
        className="group relative px-4 py-3 text-lg rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden shadow-2xl hover:shadow-slate-900/50 transition-all duration-500 transform hover:scale-105 font-bold"
        onClick={() => setOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <div className="relative flex items-center justify-center gap-3">
          <span className="text-2xl">➕</span>
          <span className="tracking-wide">Create New Booking</span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center overflow-y-auto p-4"
          onClick={() => setOpen(false)}
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>

          <div
            className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-8 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "slideUp 0.4s ease-out",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              maxHeight: "calc(100vh - 4rem)",
            }}
          >
            <div className="flex flex-col h-full">
              {/* Header - Sticky */}
              <div className="relative bg-white border-b-2 border-gray-200 p-4 md:p-8 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                    <span className="text-2xl md:text-4xl">🏪</span>
                    <span className="hidden sm:inline">Select Your Store</span>
                    <span className="sm:hidden">Select Store</span>
                  </h1>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all duration-300 hover:rotate-90 text-xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-600 text-xs md:text-sm">
                  Choose from our available stores to start your booking
                </p>
              </div>

              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6" style={{ maxHeight: "calc(100vh - 16rem)" }}>
                {fetchingStores ? (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="relative">
                      <div className="w-24 h-24 border-8 border-slate-200 rounded-full"></div>
                      <div className="w-24 h-24 border-8 border-slate-900 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <p className="mt-8 text-slate-900 text-2xl font-bold">Loading amazing stores...</p>
                    <p className="text-slate-600 mt-2">Please wait a moment</p>
                  </div>
                ) : allStores.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="bg-slate-200 rounded-full p-12 mb-6">
                      <span className="text-8xl">🏪</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">No Stores Available</p>
                    <p className="text-lg text-slate-600 mt-3">Please add stores to get started</p>
                  </div>
                ) : (
                  <>
                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto mb-6">
                      <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-2xl group-focus-within:text-slate-900 transition-colors">
                          🔍
                        </span>
                        <input
                          type="text"
                          placeholder="Search by store name, owner, or description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-16 pr-6 py-4 text-base bg-white border-2 border-slate-200 rounded-2xl shadow-lg focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 outline-none transition-all duration-300 font-medium"
                        />
                      </div>
                    </div>

                    {/* Store Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
                      {filteredStores.map((details) => {
                        const ownerUser = details.agentOwner?.user || details.owner?.user
                        const ownerName = ownerUser 
                          ? `${ownerUser.first_name} ${ownerUser.middle_name || ""} ${ownerUser.last_name}`.trim()
                          : "N/A"

                        return (
                          <div
                            key={details.id}
                            onMouseEnter={() => setHoveredCard(details.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                            className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-2 border-slate-200 hover:border-slate-900"
                          >
                            {/* Image Section */}
                            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                              <Image
                                src={details.image || "https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=500"}
                                alt={`${details.name} image`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                width={400}
                                height={300}
                                unoptimized={true}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              
                              {/* Floating Badge */}
                              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg">
                                <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                                  <span>🏪</span>
                                  STORE
                                </span>
                              </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-5 space-y-3">
                              {/* Store Name */}
                              <h3 className="font-black text-xl text-slate-900 truncate group-hover:text-slate-700 transition-colors" title={details.name}>
                                {details.name}
                              </h3>
                              
                              {/* Description */}
                              <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-900 to-slate-600 rounded-full"></div>
                                <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px] pl-3 leading-relaxed" title={details.description}>
                                  {details.description || "No description available"}
                                </p>
                              </div>
                              
                              {/* Owner Info */}
                              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2">
                                  <div className="bg-slate-900 text-white p-2 rounded-lg">
                                    <span className="text-lg">👤</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Owner</p>
                                    <p className="font-bold text-sm text-slate-900 truncate" title={ownerName}>
                                      {ownerName}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Select Button */}
                              <Link
                                href={`/Store/${details.id}/booking`}
                                className="block w-full"
                                onClick={() => handleStoreSelect(details.id)}
                              >
                                <button className="w-full group/btn relative bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white py-3 px-5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2 overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                  <span className="relative">Select This Store</span>
                                  <span className="relative transform group-hover/btn:translate-x-2 transition-transform duration-300">→</span>
                                </button>
                              </Link>
                            </div>

                            {/* Hover Effect Border */}
                            <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 pointer-events-none ${hoveredCard === details.id ? 'opacity-100' : 'opacity-0'}`}>
                              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-600 to-slate-900 opacity-20"></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* No Results */}
                    {searchQuery && filteredStores.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20">
                        <span className="text-8xl text-slate-300 mb-6">🔍</span>
                        <p className="text-3xl font-black text-slate-900">No Stores Found</p>
                        <p className="text-lg text-slate-600 mt-2">Try searching with different keywords</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer - Sticky */}
              {!fetchingStores && allStores.length > 0 && (
                <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 md:p-6 flex-shrink-0">
                  <div className="flex items-center justify-center gap-4 text-gray-600">
                    <span className="text-2xl">🏪</span>
                    <p className="text-sm md:text-base">
                      <span className="font-normal">Showing</span>
                      <span className="font-black text-2xl mx-2 text-slate-900">{filteredStores.length}</span>
                      <span className="font-normal">
                        {filteredStores.length === 1 ? 'Store' : 'Stores'} Available
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NewBooking