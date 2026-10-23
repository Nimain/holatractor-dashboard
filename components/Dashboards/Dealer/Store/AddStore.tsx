"use client"

import { useState } from 'react'
import { Share, CreditCard } from 'lucide-react'
import { FaRegChartBar, FaHotel, FaRegCalendarAlt } from "react-icons/fa"
import { TractorCard } from '@/components/Dashboards/Dealer/_components/TractorCard'
import { AttachmentCard } from '@/components/Dashboards/Dealer/_components/AttachmentCard'
import AddTractor from '@/components/Dashboards/Dealer/_components/AddTractor'
import AddAttachment from '@/components/Dashboards/Dealer/_components/AddAttachment'
import AlternatingAddForm from '@/components/Dashboards/Dealer/_components/AlternatingAddForm'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import TranslatedText from '@/components/Menubar/TranslatedText'

const singleStoreOwnerTranslations = {
  noEquipmentsAvailable: "No Equipments Available",
  noEquipmentsAvailableStore: "This store doesn't have any equipments yet.",
  noTractorsAvailable: "No Tractors Available",
  noTractorsAvailableStore: "This store doesn't have any tractors yet.",
  noAttachmentsAvailable: "No Attachments Available",
  noAttachmentsAvailableStore: "This store doesn't have any attachments yet.",
}

const store = {
  name: "Sample Store",
  description: "This is a sample store description.",
  image: "https://media.istockphoto.com/id/1133413405/photo/row-of-brand-new-john-deere-tractors-outside-the-store-of-local-consortium-exhibition-of.jpg?s=612x612&w=0&k=20&c=g_-qyxe8g_JK6vEq6FetYsegPXoYsQ-1BliQQ_GlRdY=",
  TractorInStore: [
    { id: 1, baseTractor: { name: "Tractor 1", description: "Description 1", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5l-rb7GY5lMDO9H6SCqcx7oKfhXXxEa6F0w&s" } },
    { id: 2, baseTractor: { name: "Tractor 2", description: "Description 2", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5l-rb7GY5lMDO9H6SCqcx7oKfhXXxEa6F0w&s" } },
  ],
  AttachmentInStore: [
    { id: 1, baseAttachment: { name: "Attachment 1", description: "Description 1", image: "https://t3.ftcdn.net/jpg/07/50/59/92/360_F_750599219_hOfGL1L8YaoNwg65iatGacBtC63FR4CE.jpg" } },
    { id: 2, baseAttachment: { name: "Attachment 2", description: "Description 2", image: "https://t3.ftcdn.net/jpg/07/50/59/92/360_F_750599219_hOfGL1L8YaoNwg65iatGacBtC63FR4CE.jpg" } },
  ],
}

const EmptyStateCard = ({ title, description }: {title: any; description: any;}) => (
  <Card className="w-full max-w-sm mx-auto text-center p-6">
    <CardContent className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
        <CreditCard className="w-10 h-10 text-gray-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold"><TranslatedText greetings={title} /></h3>
        <p className="text-muted-foreground">
          <TranslatedText greetings={description} />
        </p>
      </div>
    </CardContent>
  </Card>
)

export default function StorePage() {
  const [selectedTab, setSelectedTab] = useState('Overview')

  const renderContent = () => {
    const isEmptyOverview = selectedTab === "Overview" && 
      store.TractorInStore.length === 0 && 
      store.AttachmentInStore.length === 0

    const isEmptyTractor = selectedTab === "Tractor" && store.TractorInStore.length === 0
    const isEmptyAttachment = selectedTab === "Attachment" && store.AttachmentInStore.length === 0

    if (isEmptyOverview) {
      return (
        <EmptyStateCard 
          title={singleStoreOwnerTranslations.noEquipmentsAvailable}
          description={singleStoreOwnerTranslations.noEquipmentsAvailableStore}
        />
      )
    }

    if (isEmptyTractor) {
      return (
        <EmptyStateCard 
          title={singleStoreOwnerTranslations.noTractorsAvailable}
          description={singleStoreOwnerTranslations.noTractorsAvailableStore}
        />
      )
    }

    if (isEmptyAttachment) {
      return (
        <EmptyStateCard 
          title={singleStoreOwnerTranslations.noAttachmentsAvailable}
          description={singleStoreOwnerTranslations.noAttachmentsAvailableStore}
        />
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {selectedTab === "Overview" && [
          ...store.TractorInStore.map((tractor) => (
            <TractorCard key={`tractor-${tractor.id}`} tractor={tractor.baseTractor} />
          )),
          ...store.AttachmentInStore.map((attachment) => (
            <AttachmentCard key={`attachment-${attachment.id}`} attachment={attachment.baseAttachment} />
          ))
        ]}
        {selectedTab === "Tractor" &&
          store.TractorInStore.map((tractor) => (
            <TractorCard key={tractor.id} tractor={tractor.baseTractor} />
          ))
        }
        {selectedTab === "Attachment" &&
          store.AttachmentInStore.map((attachment) => (
            <AttachmentCard key={attachment.id} attachment={attachment.baseAttachment} />
          ))
        }
      </div>
    )
  }

  return (
    <div className="m-2">
      <div className="min-h-screen w-full bg-none overflow-auto" style={{ scrollbarWidth: "none" }}>
        <div className="w-full relative h-[60vh] rounded-xl overflow-hidden">
          <Image
            alt={store.name}
            src={store.image}
            width={800}
            height={400}
            className="w-full h-full object-cover z-0 absolute top-0 left-0"
          />
          
          <div className="z-0 w-full h-full absolute top-0 left-0 bg-black/20" />
          
          <div className="flex flex-col items-center justify-center text-center w-full h-full rounded-lg p-6 mx-6">
            <h1 className="text-4xl font-bold text-white mb-2 z-10">
              {store.name}
            </h1>
            <p className="text-lg text-white max-w-md z-10">
              {store.description}
            </p>
          </div>

          <div className="w-full absolute bottom-10 p-4 flex items-center justify-between">
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
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm ${
                    selectedTab === tab.name 
                      ? "bg-white shadow-sm transform scale-105" 
                      : "text-white hover:text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-6">
          <Card className="w-full md:w-[400px] lg:w-[500px] -mt-24 z-10 ml-4 h-fit">
            <CardContent className="pt-3">
              {selectedTab === "Overview" && (
                <AlternatingAddForm 
                  tractors={store.TractorInStore} 
                  attachments={store.AttachmentInStore} 
                />
              )}
              {selectedTab === "Tractor" && (
                <AddTractor alreadyTractors={store.TractorInStore} />
              )}
              {selectedTab === "Attachment" && (
                <AddAttachment alreadyAttachments={store.AttachmentInStore} />
              )}
            </CardContent>
          </Card>

          <div className="w-full">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}