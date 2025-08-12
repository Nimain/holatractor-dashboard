"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaImage, FaStore, FaRegChartBar, FaHotel, FaRegCalendarAlt } from "react-icons/fa";
import { CreditCard } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import OwnerShrimmer from "./_components/OwnerShrimmer";
import { TractorCard } from "./_components/TractorCard";
import AddTractor from "./_components/AddTractor";
import AddAttachment from "./_components/AddAttachment";
import { AttachmentCard } from "./_components/AttachmentCard";
import { singleStoreOwnerTranslations } from "./SingleStoreTranslation";
import TranslatedText from "@/components/Menubar/TranslatedText";
import { useAddStoreItemContext } from "@/components/wrappers/AddStoreItemProvider";

export default function StorePage() {
  const [selectedTab, setSelectedTab] = useState("Overview");
  const { slug } = useParams();
  const { fetchStoreDetails, fetchingStoreDetails, store } = useAddStoreItemContext();

  useEffect(() => {
    if (slug) {
      fetchStoreDetails();
    }
  }, []);

  if (fetchingStoreDetails) return <OwnerShrimmer />;
  if (!store) return <p className="dark:text-white">Store details not available</p>; // ✅ Dark text

  return (
    <div className="min-h-screen w-full overflow-auto overscroll-none" style={{ scrollbarWidth: "none" }}>
      <h1 className="text-3xl text-red-600 dark:text-red-400 font-bold m-3">Stores</h1> {/* ✅ Dark variant */}

      {/* Store image */}
      <div className="w-full relative h-[40vh] rounded-xl overflow-hidden">
        <Image
          alt={store.name}
          src={store.image}
          width={400}
          height={400}
          unoptimized
          className="w-full object-cover z-0 absolute top-0 left-0"
        />
        <div className="z-0 w-full h-full absolute top-0 left-0 bg-black/20" />
        <div className="flex flex-col items-center justify-center text-center w-full h-full rounded-lg p-6 mx-6">
          <h1 className="text-4xl font-bold text-white mb-2 z-10">{store.name}</h1>
          <p className="text-lg text-white max-w-md z-10">{store.description}</p>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] m-14 rounded-lg">
        <div className="flex items-center justify-center mt-10 rounded-xl p-4">
          {[
            { name: "Overview", icon: <FaRegChartBar /> },
            { name: "Tractor", icon: <FaHotel /> },
            { name: "Attachment", icon: <FaRegCalendarAlt /> },
          ].map((tab) => (
            <button
              key={tab.name}
              onClick={() => setSelectedTab(tab.name)}
              className={`flex items-center gap-4 px-16 py-2.5 transition-all duration-300 font-medium text-sm
                ${
                  selectedTab === tab.name
                    ? "bg-orange-600 text-white shadow-sm transform scale-105"
                    : "bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {/* Header Section */}
        <div className="bg-white dark:bg-gray-900 mx-10 p-3 rounded-t-md">
          {selectedTab === "Overview" && (
            <>
              <h2 className="text-3xl mx-10 font-bold text-red-600 dark:text-red-400">
                All Equipments
              </h2>
              <p className="text-sm text-red-500 dark:text-red-300 mx-10">
                Overview of all the tractors and attachments in your inventory
              </p>
            </>
          )}

          {selectedTab === "Tractor" && (
            <div className="flex justify-between">
              <div>
                <h2 className="text-3xl mx-10 font-bold text-red-600 dark:text-red-400">All Tractors</h2>
                <p className="text-sm text-red-500 dark:text-red-300 mx-10">
                  Overview of all the tractors in your inventory
                </p>
              </div>
              <AddTractor alreadyTractors={store.TractorInStore} />
            </div>
          )}

          {selectedTab === "Attachment" && (
            <div className="flex justify-between">
              <div>
                <h2 className="text-3xl mx-10 font-bold text-red-600 dark:text-red-400">All Attachments</h2>
                <p className="text-sm text-red-500 dark:text-red-300 mx-10">
                  Overview of all the attachments in your inventory
                </p>
              </div>
              <AddAttachment alreadyAttachments={store.AttachmentInStore} />
            </div>
          )}
        </div>

        {/* Card Section */}
        <div className="mt-0 m-10 rounded-t-none rounded-xl bg-white dark:bg-gray-900 flex gap-6 border-b-[44px] " style={{
  borderImage: "linear-gradient(to right, #8c0000, #4d0000) 1"
}}>
          <div className="w-full p-4 grid gap-6 grid-cols-3">
            {selectedTab === "Overview" &&
              store.TractorInStore.length === 0 &&
              store.AttachmentInStore.length === 0 && (
                <div>
                  <div className="dark:text-white">
                    <h1 className="text-2xl font-bold">All Equipments</h1>
                    <p className="text-muted-foreground dark:text-gray-400">
                      Overview of all the tractors and attachments in your store
                    </p>
                  </div>

                  <Card className="w-full max-w-sm mx-auto text-center p-6 dark:bg-gray-800">
                    <CardContent className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                        <CreditCard className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold dark:text-white">
                          <TranslatedText greetings={singleStoreOwnerTranslations.noEquipmentsAvailable} />
                        </h3>
                        <p className="text-muted-foreground dark:text-gray-400">
                          <TranslatedText greetings={singleStoreOwnerTranslations.noEquipmentsAvailableStore} />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            {selectedTab === "Overview" &&
              store.TractorInStore.map((tractor) => (
                <TractorCard key={tractor.id} tractor={tractor.baseTractor} />
              ))}

            {selectedTab === "Overview" &&
              store.AttachmentInStore.map((tractor) => (
                <AttachmentCard key={tractor.id} attachment={tractor.baseAttachment} />
              ))}

            {selectedTab === "Tractor" && store.TractorInStore.length === 0 && (
              <Card className="w-full max-w-sm mx-auto text-center p-6 dark:bg-gray-800">
                <CardContent className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold dark:text-white">
                      <TranslatedText greetings={singleStoreOwnerTranslations.noTractorsAvailable} />
                    </h3>
                    <p className="text-muted-foreground dark:text-gray-400">
                      <TranslatedText greetings={singleStoreOwnerTranslations.noTractorsAvailableStore} />
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTab === "Tractor" &&
              store.TractorInStore.map((tractor) => (
                <TractorCard key={tractor.id} tractor={tractor.baseTractor} />
              ))}

            {selectedTab === "Attachment" && store.AttachmentInStore.length === 0 && (
              <Card className="w-full max-w-sm mx-auto text-center p-6 dark:bg-gray-800">
                <CardContent className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold dark:text-white">
                      <TranslatedText greetings={singleStoreOwnerTranslations.noAttachmentsAvailable} />
                    </h3>
                    <p className="text-muted-foreground dark:text-gray-400">
                      <TranslatedText greetings={singleStoreOwnerTranslations.noAttachmentsAvailableStore} />
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTab === "Attachment" &&
              store.AttachmentInStore.map((tractor) => (
                <AttachmentCard key={tractor.id} attachment={tractor.baseAttachment} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
