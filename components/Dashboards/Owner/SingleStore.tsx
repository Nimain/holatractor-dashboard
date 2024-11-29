"use client"

import { useEffect, useState, FC } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, MapPin, Hotel, List, Heart, Share, Zap, Maximize2, CreditCard, MessageCircleQuestion, Sun, Mic, Map } from 'lucide-react'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Store } from '@/utils/Types/types'
import "leaflet/dist/leaflet.css";
import { FaImage, FaStore } from 'react-icons/fa'; // Importing Image and Store icons
import { FaRegChartBar, FaHotel, FaRegCalendarAlt } from "react-icons/fa";
import OwnerShrimmer from './_components/OwnerShrimmer'
import { TractorCard } from './_components/TractorCard'
import AddTractor from './_components/AddTractor'
import AddAttachment from './_components/AddAttachment'
import { AttachmentCard } from './_components/AttachmentCard'
import AlternatingAddForm from './_components/AlternatingAddform'

export default function StorePage() {
  const [store, setStore] = useState<Store | null>(null)
  const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false)

  const [selectedTab, setSelectedTab] = useState('Overview'); // Track selected tab

  const images = [
    "https://img.freepik.com/premium-photo/tractor-makes-harvesting-hay-animals-farm_627378-1301.jpg",
    "https://cdn.britannica.com/09/179609-138-D7550199/tractors-GPS-navigation-systems-farming.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT243T7YIOkC6yRwBVPQ6wPFXfo_Ssl1aYlcQ&s",
    "https://thumbs.dreamstime.com/b/tractor-modern-agriculture-equipment-14081589.jpg",
  ];
  const [mainImage, setMainImage] = useState(images[0]);

  const { slug } = useParams()

  function fetchStoreDetails() {
    setFetchingStoreDetails(true)
    renderInstance.get(`/store/${slug}`)
      .then((res) => {
        setStore(res.data)
      }).catch((err) => {
        errorMessage("Error fetching store details")
      }).finally(() => {
        setFetchingStoreDetails(false)
      })
  }

  useEffect(() => {
    if (slug) {
      fetchStoreDetails()
    }
  }, [])

  if (fetchingStoreDetails) return <OwnerShrimmer />

  if (!store) return <p>Store details not available</p>

  return (
    <div className="bg-gray-50 min-h-screen p-6 flex-1 overflow-y-auto overflow-x-hidden">

      {/* Hero Section */}
      <main className="mt-4">
        <div className="rounded-xl text-white p-3 mb-6 bg-cover bg-center" style={{ backgroundImage: `url(${mainImage})` }}>
          <div className="flex flex-col min-h-[65vh] justify-between">
            {/* Top Section */}
            <div className="flex justify-between items-start p-6">
              <div className="flex space-x-2 items-center">
                {/* Loop through the first 4 images */}
                {/* {images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setMainImage(image)}
                      className={`w-12 h-12 bg-white/20 rounded-lg ${mainImage === image ? "border-2 border-white" : ""
                        }`}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          layout="fill" // Makes the image fill the parent container
                          objectFit="cover" // Ensures the image doesn't stretch
                          className="rounded-lg"
                          unoptimized={true} // Optional: Skip Next.js optimizations if needed
                        />
                      </div>
                    </button>
                  ))} */}

                {/* If there are more than 4 images, show a box indicating how many are left */}
                {/* {images.length > 4 && (
                    <div className="w-12 h-12 bg-gray-700 text-white flex items-center justify-center rounded-lg">
                      +{images.length - 4}
                    </div>
                  )} */}

                {/* Additional Information Box */}

              </div>



            </div>

            {/* Center Section */}
            <div className="flex flex-col items-center justify-center text-center  rounded-lg p-6 mx-6">
              <h1 className="text-4xl font-bold text-white mb-2">
                {store.name}
              </h1>
              <p className="text-lg text-white max-w-md">
                {store.description}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                  <Heart className="h-4 w-4 text-black" />
                </div>
                <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                  <Share className="h-4 w-4 text-black" />
                </div>
              </div>
            </div>
            {/* Bottom Section */}
            <div className="flex items-center justify-between p-6">
              {/* Left content (optional, could be empty) */}
              <div></div>

              {/* Right-side content */}
              <div className="flex items-center gap-4 ml-auto bottom-0">
                <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                  <FaImage className="h-4 w-4 text-black" />
                </div>
                <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                  <FaStore className="h-4 w-4 text-black" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <div className="-mt-[6rem] " style={{ overflow: 'hidden' }}>
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 p-2 bg-white backdrop-blur-lg rounded-xl shadow-lg ">
            {[
              { name: "Overview", icon: <FaRegChartBar /> },
              { name: "Tractor", icon: <FaHotel /> },
              { name: "Attachment", icon: <FaRegCalendarAlt /> },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setSelectedTab(tab.name)}
                className={`
                flex items-center gap-2 px-6 py-2.5 
                rounded-lg transition-all duration-300 
                font-medium text-sm 
                ${selectedTab === tab.name
                    ? "bg-primary text-primary-foreground shadow-sm transform scale-105"
                    : "text-gray-600 hover:bg-gray-100"
                  }
              `}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-6 p-2">
          {selectedTab === 'Overview' && (
            <div className="container mx-auto p-6">
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="w-full xl:w-[47%] min-w-[350px]">
                <AlternatingAddForm tractors={store.TractorInStore} attachments={store.AttachmentInStore} />
              </div>
              <div className="w-full xl:w-[53%]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {store.TractorInStore.map((tractor) => (
                    <TractorCard key={tractor.id} tractor={tractor.baseTractor} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}

          {selectedTab === 'Tractor' && (
            <div className="container mx-auto p-6">
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="w-full xl:w-[47%] min-w-[350px]">
                  <AddTractor alreadyTractors={store.TractorInStore} />
                </div>
                <div className="w-full xl:w-[53%]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {store.TractorInStore.map((tractor) => (
                      <TractorCard key={tractor.id} tractor={tractor.baseTractor} />
                    ))}
                    {store.AttachmentInStore.map((tractor) => (
                    <AttachmentCard key={tractor.id} attachment={tractor.baseAttachment} />
                  ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'Attachment' && (
            <div className="container mx-auto p-6">
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="w-full xl:w-[47%] min-w-[350px]">
                <AddAttachment alreadyAttachments={store.AttachmentInStore} />
              </div>
              <div className="w-full xl:w-[53%]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {store.AttachmentInStore.map((tractor) => (
                    <AttachmentCard key={tractor.id} attachment={tractor.baseAttachment} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}


        </div>
      </div>
      {/* Dashboard Grid */}

    </div>
  )
}