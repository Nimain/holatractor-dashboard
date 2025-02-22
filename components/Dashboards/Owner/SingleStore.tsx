"use client"

import { useEffect, useState, FC } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, MapPin, Hotel, List, Heart, Share, Zap, Maximize2, CreditCard, MessageCircleQuestion, Sun, Mic, Map } from 'lucide-react'
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance'
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
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { io, Socket } from 'socket.io-client'
import { useCookie } from 'next-cookie'
import { Button } from '@/components/ui/button'
import { singleStoreOwnerTranslations } from './SingleStoreTranslation'
import TranslatedText from '@/components/Menubar/TranslatedText'
import { useAddStoreItemContext } from '@/components/wrappers/AddStoreItemProvider'

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

export default function StorePage() {
  const [selectedTab, setSelectedTab] = useState('Overview'); // Track selected tab
  
    const { slug } = useParams()

    const { fetchStoreDetails, fetchingStoreDetails, store } = useAddStoreItemContext()

  useEffect(() => {
    if (slug) {
      fetchStoreDetails()
    }
  }, [])

  if (fetchingStoreDetails) return <OwnerShrimmer />

  if (!store) return <p>Store details not available</p>

  return (
    <div className="min-h-screen w-full bg-white overflow-auto" style={{ scrollbarWidth: "none" }}>

      <div className='w-full relative h-[60vh] rounded-xl overflow-hidden'>

        <Image
          alt={store.name}
          src={store.image}
          width={400}
          height={400}
          unoptimized={true}
          className='w-full h-full object-cover z-0 absolute top-0 left-0' />

        <div className='z-0 w-full h-full absolute top-0 left-0 bg-black/20' />

        <div className="flex flex-col items-center justify-center text-center w-full h-full rounded-lg p-6 mx-6">
          <h1 className="text-4xl font-bold text-white mb-2 z-10">
            {store.name}
          </h1>
          <p className="text-lg text-white max-w-md z-10">
            {store.description}
          </p>
        </div>

        <div className='w-full absolute bottom-0 p-4 flex items-center justify-between'>

          <div className="flex items-center gap-2 -mt-36">
            <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
              <Share className="h-4 w-4 text-black" />
            </div>
          </div>

          <div className="flex items-center justify-center absolute left-1/2 -translate-x-1/2 rounded-xl bg-white/40 text-black">
            {[
              { name: "Overview", icon: <FaRegChartBar /> },
              { name: "Tractor", icon: <FaHotel /> },
              { name: "Attachment", icon: <FaRegCalendarAlt /> },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setSelectedTab(tab.name)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm ${selectedTab === tab.name ? "bg-white shadow-sm transform scale-105" : "text-white hover:text-gray-600 hover:bg-gray-100"}`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

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

      <div className='mt-4 flex gap-6'>

        <Card className='w-[600px] -mt-24 z-10 ml-4 h-fit'>
          <CardContent className='pt-3'>
            {
              selectedTab === "Overview" && <AlternatingAddForm tractors={store.TractorInStore} attachments={store.AttachmentInStore} />
            }
            {
              selectedTab === "Tractor" && <AddTractor alreadyTractors={store.TractorInStore} />
            }
            {
              selectedTab === "Attachment" && <AddAttachment alreadyAttachments={store.AttachmentInStore} />
            }
          </CardContent>
        </Card>


        <div className='w-full grid gap-6 grid-cols-3'>

          {selectedTab === "Overview" && (store.TractorInStore.length === 0 && store.AttachmentInStore.length === 0) && (
            <Card className="w-full max-w-sm mx-auto text-center p-6">
              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold"><TranslatedText greetings={singleStoreOwnerTranslations.noEquipmentsAvailable} /></h3>
                  <p className="text-muted-foreground">
                  <TranslatedText greetings={singleStoreOwnerTranslations.noEquipmentsAvailableStore} />
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTab === "Overview" && store.TractorInStore.map((tractor) => (
            <TractorCard key={tractor.id} tractor={tractor.baseTractor} />
          ))}

          {selectedTab === "Overview" && store.AttachmentInStore.map((tractor) => (
            <AttachmentCard key={tractor.id} attachment={tractor.baseAttachment} />
          ))}

          {selectedTab === "Tractor" && 
          store.TractorInStore.length === 0 && (
            <Card className="w-full max-w-sm mx-auto text-center p-6">
              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold"><TranslatedText greetings={singleStoreOwnerTranslations.noTractorsAvailable} /></h3>
                  <p className="text-muted-foreground">
                  <TranslatedText greetings={singleStoreOwnerTranslations.noTractorsAvailableStore} />
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTab === "Tractor" &&  store.TractorInStore.map((tractor) => (
              <TractorCard key={tractor.id} tractor={tractor.baseTractor} />
            ))}

          {selectedTab === "Attachment" && store.AttachmentInStore.length === 0 && (
            <Card className="w-full max-w-sm mx-auto text-center p-6">
              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold"><TranslatedText greetings={singleStoreOwnerTranslations.noAttachmentsAvailable} /></h3>
                  <p className="text-muted-foreground">
                  <TranslatedText greetings={singleStoreOwnerTranslations.noAttachmentsAvailableStore} />
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTab === "Attachment" && store.AttachmentInStore.map((tractor) => (
            <AttachmentCard key={tractor.id} attachment={tractor.baseAttachment} />
          ))}

        </div>

      </div>

      {/* {selectedTab === 'Tractor' && (
        <div className="container mx-auto p-2 sm:p-4 md:p-6">
          <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 md:gap-6">
            <div className="w-full xl:w-[47%] min-w-[250px] sm:min-w-[300px] md:min-w-[350px] lg:min-w-[400px]">
              <AddTractor alreadyTractors={store.TractorInStore} />
            </div>
            <div className="w-full xl:w-[53%]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {store.TractorInStore.map((tractor) => (
                  <TractorCard 
                    key={tractor.id} 
                    tractor={tractor.baseTractor} 
                    
                  />
                ))}
                {store.AttachmentInStore.map((tractor) => (
                  <AttachmentCard 
                    key={tractor.id} 
                    attachment={tractor.baseAttachment} 
                    
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'Attachment' && (
        <div className="container mx-auto p-2 sm:p-4 md:p-6">
          <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 md:gap-6">
            <div className="w-full xl:w-[47%] min-w-[250px] sm:min-w-[300px] md:min-w-[350px] lg:min-w-[400px]">
              <AddAttachment alreadyAttachments={store.AttachmentInStore} />
            </div>
            <div className="w-full xl:w-[53%]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {store.AttachmentInStore.map((tractor) => (
                  <AttachmentCard 
                    key={tractor.id} 
                    attachment={tractor.baseAttachment} 
                    
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  
  )
}