"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Calendar, MapPin, Phone, Mail } from 'lucide-react'
import OwnerModule from './_components/OwnerModule'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Store } from '@/utils/Types/types'
import RequestOperators from './_components/RequestOperators'

export default function StorePage() {
  const [store, setStore] = useState<Store | null>(null)
  const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false)

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

  if (fetchingStoreDetails) return <p>Getting store details</p>

  if (!store) return <p>Store details not available</p>

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{store.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-video relative">
              <Image
                src={store.image || 'https://wallpapercave.com/wp/wp1931608.jpg'}
                alt={store.name}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
            <div>
              <p className="text-gray-600 mb-4">{store.description}</p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{new Date(store.opening_time).toLocaleTimeString()} - {new Date(store.closing_time).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>Closed on: {store.closing_days.join(', ')}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{store.location.country} {store.location.city}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  <span>{store.owner ? store.owner.user.mobile : store.agentOwner.user.mobile}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  <span>{store.owner ? store.owner.user.email : store.agentOwner.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <OwnerModule />
                  <RequestOperators store={store}/>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tractors" className="mb-8">
        <TabsList>
          <TabsTrigger value="tractors">Tractors</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>
        <TabsContent value="tractors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.TractorInStore.map((tractor) => (
              <Card key={tractor.id}>
                <CardHeader>
                  <CardTitle>{tractor.baseTractor.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video relative mb-4">
                    <Image
                      src={tractor.baseTractor.images[0] || "https://wallpapercave.com/wp/wp13077902.jpg"}
                      alt={tractor.baseTractor.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>
                  <p className="text-sm text-gray-600">{tractor.baseTractor.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="attachments">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.AttachmentInStore.map((tractor) => (
              <Card key={tractor.id}>
                <CardHeader>
                  <CardTitle>{tractor.baseAttachment.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video relative mb-4">
                    <Image
                      src={tractor.baseAttachment.images[0] || "https://wallpapercave.com/wp/wp13077902.jpg"}
                      alt={tractor.baseAttachment.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>
                  <p className="text-sm text-gray-600">{tractor.baseAttachment.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}