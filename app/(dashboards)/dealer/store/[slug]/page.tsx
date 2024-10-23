'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, MapPin, Clock, Calendar, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data (replace with actual data fetching in a real application)
const store = {
  id: '1',
  owner_id: 'owner123',
  name: 'Green Fields Equipment',
  description: 'Your one-stop shop for all farming equipment needs.',
  banner: 'https://wallpapercave.com/wp/wp12501858.jpg',
  logo: 'https://wallpapercave.com/wp/wp13520400.jpg',
  opening_time: '08:00',
  closing_time: '18:00',
  closing_days: ['Sunday'],
  location: {
    address: '123 Farm Road',
    city: 'Agricity',
    state: 'AG',
    zip_code: '12345',
    country: 'USA'
  },
  tractors: [
    { id: 't1', name: 'Heavy Duty Tractor', model: 'HD-2000', price: 50000 },
    { id: 't2', name: 'Compact Tractor', model: 'CT-500', price: 25000 },
  ],
  attachments: [
    { id: 'a1', name: 'Plow', type: 'Tillage', price: 5000 },
    { id: 'a2', name: 'Seeder', type: 'Planting', price: 7500 },
  ]
}

export default function StorePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('tractors')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative">
        <Image
          src={store.banner}
          alt={`${store.name} banner`}
          width={1200}
          height={300}
          className="w-full h-[300px] object-cover rounded-t-lg"
        />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent h-1/2"></div>
      </div>
      
      <div className="flex items-end -mt-16 mb-4 relative z-10 px-4">
        <Image
          src={store.logo}
          alt={`${store.name} logo`}
          width={150}
          height={150}
          className="rounded-full border-4 w-[160px] h-[160px] border-white"
        />
        <div className="ml-4">
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <p className="text-sm">{store.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{`${store.location.address}, ${store.location.city}, ${store.location.state} ${store.location.zip_code}, ${store.location.country}`}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <span>{`Open: ${store.opening_time} - ${store.closing_time}`}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{`Closed on: ${store.closing_days.join(', ')}`}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Camera className="mr-2 h-4 w-4" /> Update Photos
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Store Photos</DialogTitle>
                  <DialogDescription>
                    Upload a new banner or logo for your store.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="banner">Banner Image</Label>
                    <Input id="banner" type="file" accept="image/*" />
                  </div>
                  <div>
                    <Label htmlFor="logo">Logo Image</Label>
                    <Input id="logo" type="file" accept="image/*" />
                  </div>
                  <Button type="submit">Upload Photos</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="w-full">Edit Store Details</Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tractors">Tractors</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>
        <TabsContent value="tractors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tractors</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Tractor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Tractor</DialogTitle>
                    <DialogDescription>
                      Enter the details of the new tractor.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="tractor-name">Tractor Name</Label>
                      <Input id="tractor-name" placeholder="Enter tractor name" />
                    </div>
                    <div>
                      <Label htmlFor="tractor-model">Model</Label>
                      <Input id="tractor-model" placeholder="Enter model number" />
                    </div>
                    <div>
                      <Label htmlFor="tractor-price">Price</Label>
                      <Input id="tractor-price" type="number" placeholder="Enter price" />
                    </div>
                    <Button type="submit">Add Tractor</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {store.tractors.map((tractor) => (
                  <Card key={tractor.id}>
                    <CardHeader>
                      <CardTitle>{tractor.name}</CardTitle>
                      <CardDescription>Model: {tractor.model}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Price: ${tractor.price.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attachments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attachments</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Attachment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Attachment</DialogTitle>
                    <DialogDescription>
                      Enter the details of the new attachment.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="attachment-name">Attachment Name</Label>
                      <Input id="attachment-name" placeholder="Enter attachment name" />
                    </div>
                    <div>
                      <Label htmlFor="attachment-type">Type</Label>
                      <Input id="attachment-type" placeholder="Enter attachment type" />
                    </div>
                    <div>
                      <Label htmlFor="attachment-price">Price</Label>
                      <Input id="attachment-price" type="number" placeholder="Enter price" />
                    </div>
                    <Button type="submit">Add Attachment</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {store.attachments.map((attachment) => (
                  <Card key={attachment.id}>
                    <CardHeader>
                      <CardTitle>{attachment.name}</CardTitle>
                      <CardDescription>Type: {attachment.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Price: ${attachment.price.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}