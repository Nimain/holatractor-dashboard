'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Camera, MapPin, Clock, Calendar, Plus, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { Attachment, DealerStore, Tractor } from '@/utils/Types/types'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { useCookie } from 'next-cookie'
import { CircularProgress } from '@mui/material'
import { useParams } from 'next/navigation'

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

export default function StorePage() {
  const [activeTab, setActiveTab] = useState('tractors')

  const [showAllTractors, setShowAllTractors] = useState(false)
  const [showAllAttachments, setShowAllAttachments] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [store, setStore] = useState<DealerStore | null>(null)
  const [fetchingStore, setFetchingStore] = useState(false)

  const [allTractors, setAllTractors] = useState<Tractor[]>([])
  const [fetchingTractors, setFetchingTractors] = useState(false)

  const [allAttachments, setAllAttachments] = useState<Attachment[]>([])
  const [fetchingAttachments, setFetchingAttachments] = useState(false)

  const [activeTractor, setActiveTractor] = useState("")
  const [activeAttachment, setActiveAttachment] = useState("")
  const [tractorPrice, setTractorPrice] = useState(0)
  const [attachmentPrice, setAttachmentPrice] = useState(0)

  const [adding, setAdding] = useState(false)

  const { slug } = useParams()

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  const filteredTractors = allTractors.filter(tractor =>
    tractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tractor.model?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAttachments = allAttachments.filter(attachment =>
    attachment.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function fetchStore() {
    setFetchingStore(true)
    renderInstance.get(`/dealer/store/${slug}`)
      .then((res) => { setStore(res.data) })
      .catch((err) => {
        if (err.response && err.response.status === 404 && err.response.data.message === "Store not found") {
          errorMessage("Store not found")
        } else {
          errorMessage("Error fetching store details")
        }
      }).finally(() => {
        setFetchingStore(false)
      })
  }

  function fetchTractors() {
    setFetchingTractors(true)
    renderInstance.get("/tractor")
      .then((res) => { setAllTractors(res.data) })
      .catch((err) => { errorMessage("Error fetching tractor details") })
      .finally(() => { setFetchingTractors(false) })
  }

  function fetchAttachments() {
    setFetchingAttachments(true)
    renderInstance.get("/attachment", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((res) => { setAllAttachments(res.data) })
      .catch((err) => { errorMessage("Error fetching attachment details") })
      .finally(() => { setFetchingAttachments(false) })
  }

  function formatTimeOnly(dateTimeStr: string | number | Date) {
    const date = new Date(dateTimeStr);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  function handleAddTractor() {
    if (tractorPrice <= 0) {
      errorMessage("Please give the tractor price")
      return
    }
    if (!activeTractor) {
      errorMessage("Please select the tractor")
      return
    }
    if (!slug) {
      errorMessage("Store not available")
      return
    }

    const addTractorBody = {
      tractor_id: activeTractor,
      price: `${tractorPrice}`,
      store_id: slug
    }

    setAdding(true)
    renderInstance.patch("/dealer/store/addTractorToDealerStore", addTractorBody, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(()=>{ 
      successMessage("Added")
      fetchStore()
      setTractorPrice(0)
      setShowAllTractors(false)
    }).catch((err)=>{
      console.log(err)
      if (err.response && err.response.status === 404) {
        if(err.response.data.message === "Store not found"){
          errorMessage("Store not found")
        }
        if(err.response.data.message === "Tractor is not valid"){
          errorMessage("Tractor is not valid")
        }
        if(err.response.data.message === "Login user not found"){
          errorMessage("Login user not found")
        }
      } else if (err.response && err.response.status === 400) {
        if(err.response.data.message === "You are not allowed for this task"){
          errorMessage("You are not allowed for this task")
        }
      } else {
        errorMessage("Error updating store details")
      }
    }).finally(()=>{
      setActiveTractor("")
      setAdding(false)
    })
  }

  function handleAddAttachment() {
    if (attachmentPrice <= 0) {
      errorMessage("Please give the attachment price")
      return
    }
    if (!activeAttachment) {
      errorMessage("Please select the attachment")
      return
    }
    if (!slug) {
      errorMessage("Store not available")
      return
    }

    const addTractorBody = {
      attachment_id: activeAttachment,
      price: `${tractorPrice}`,
      store_id: slug
    }

    setAdding(true)
    renderInstance.patch("/dealer/store/addAttachmentToDealerStore", addTractorBody, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(()=>{ 
      successMessage("Added")
      fetchStore()
      setAttachmentPrice(0)
      setShowAllAttachments(false)
    }).catch((err)=>{
      if (err.response && err.response.status === 404) {
        if(err.response.data.message === "Store not found"){
          errorMessage("Store not found")
        }
        if(err.response.data.message === "Attachment is not valid"){
          errorMessage("Attachment is not valid")
        }
        if(err.response.data.message === "Login user not found"){
          errorMessage("Login user not found")
        }
      } else if (err.response && err.response.status === 400) {
        if(err.response.data.message === "You are not allowed for this task"){
          errorMessage("You are not allowed for this task")
        }
      } else {
        errorMessage("Error updating store details")
      }
    }).finally(()=>{
      setActiveAttachment("")
      setAdding(false)
    })
  }

  useEffect(() => {
    if (slug) {
      fetchStore()
    }
  }, [slug])

  useEffect(() => {
    fetchAttachments()
    fetchTractors()
  }, [])

  if (fetchingStore) return <p>Getting store details</p>

  if (!store) return <p>Store not found</p>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative">
        <Image
          src={store.banner ? store.banner : 'https://wallpapercave.com/wp/wp12501858.jpg'}
          alt={`${store.name} banner`}
          width={1200}
          height={300}
          className="w-full h-[300px] object-cover rounded-t-lg"
        />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent h-1/2"></div>
      </div>

      <div className="flex items-end -mt-16 mb-4 relative z-10 px-4">
        <Image
          src={store.logo ? store.logo : 'https://wallpapercave.com/wp/wp13520400.jpg'}
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
                <span>{`${store.location.address ?? ""} ${store.location.city ?? ""} ${store.location.state ?? ""} ${store.location.zip_code ?? ""} ${store.location.country ?? ""}`}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <span>{`Open: ${formatTimeOnly(store.opening_time)} - ${formatTimeOnly(store.closing_time)}`}</span>
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
              <Button onClick={() => setShowAllTractors(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Tractor
              </Button>
            </CardHeader>
            <CardContent>
              {
                store.TractorInDealerStore.length === 0 ?
                  <p>No tractors available in this store</p>
                  :
                  <div className="space-y-4">
                    {store.TractorInDealerStore.map((tractor) => (
                      <Card key={tractor.id}>
                        <CardHeader>
                          <CardTitle>{tractor.baseTractor.name}</CardTitle>
                          <CardDescription>Model: {tractor.baseTractor.model}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p>Price: ${tractor.price.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attachments">
          <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attachments</CardTitle>
              <Button onClick={() => setShowAllAttachments(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Attachment
              </Button>
            </CardHeader>
            <CardContent>
              {
                store.AttachmentInDealerStore.length === 0 ?
                  <p>No attachments available.</p>
                  :
                  <div className="space-y-4">
                    {store.AttachmentInDealerStore.map((attachment) => (
                      <Card key={attachment.id}>
                        <CardHeader>
                          <CardTitle>{attachment.baseAttachment.name}</CardTitle>
                          {/* <CardDescription>Type: {attachment.baseAttachment.type}</CardDescription> */}
                        </CardHeader>
                        <CardContent>
                          <p>Price: ${attachment.price.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showAllTractors && (
        <Dialog open={showAllTractors} onOpenChange={setShowAllTractors}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Tractor to Store</DialogTitle>
              <DialogDescription>
                Select a tractor to add to your store inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tractors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {filteredTractors.map((tractor) => (
                  <Card key={tractor.id}>
                    <CardHeader>
                      <CardTitle>{tractor.name}</CardTitle>
                      <CardDescription>Model: {tractor.model}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{tractor.description}</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={()=>{ setActiveTractor(tractor.id) }}>Add to Store</Button>
                        </DialogTrigger>
                        {
                          activeTractor &&
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add {tractor.name} to Store</DialogTitle>
                            <DialogDescription>
                              Set the price for this tractor in your store.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="tractor-price">Price</Label>
                              <Input id="tractor-price" type="number" placeholder="Enter price" value={tractorPrice} onChange={e=>{setTractorPrice(parseFloat(e.target.value))}} />
                            </div>
                            {
                              adding ?
                              <CircularProgress />
                              :
                            <Button onClick={() => { handleAddTractor() }}>Add to Store</Button>
                            }
                          </div>
                        </DialogContent>
                        }
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showAllAttachments && (
        <Dialog open={showAllAttachments} onOpenChange={setShowAllAttachments}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Attachment to Store</DialogTitle>
              <DialogDescription>
                Select a attachment to add to your store inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tractors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {filteredAttachments.map((tractor) => (
                  <Card key={tractor.id}>
                    <CardHeader>
                      <CardTitle>{tractor.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{tractor.description}</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={()=>{ setActiveAttachment(tractor.id) }}>Add to Store</Button>
                        </DialogTrigger>
                        {
                          activeAttachment &&
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add {tractor.name} to Store</DialogTitle>
                            <DialogDescription>
                              Set the price for this tractor in your store.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="tractor-price">Price</Label>
                              <Input id="tractor-price" type="number" placeholder="Enter price" value={attachmentPrice} onChange={e=>{setAttachmentPrice(parseFloat(e.target.value))}} />
                            </div>
                            {
                              adding ?
                              <CircularProgress />
                              :
                            <Button onClick={() => { handleAddAttachment() }}>Add to Store</Button>
                            }
                          </div>
                        </DialogContent>
                        }
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}