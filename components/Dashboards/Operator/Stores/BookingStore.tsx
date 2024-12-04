"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { Booking, Farm, Store } from '@/utils/Types/types'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CalendarIcon, Clock, CreditCard, Heart, MapPin, Receipt, Share } from 'lucide-react'
import { FaHotel, FaImage, FaRegCalendarAlt, FaStore } from 'react-icons/fa'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCookie } from 'next-cookie'
import { DateRange } from 'react-day-picker'
import { addDays, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Backdrop, CircularProgress } from '@mui/material'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
    email_varified: boolean;
}

const BookingStore = () => {
    const [store, setStore] = useState<Store | null>(null)
    const [fetchingStoreDetails, setFetchingStoreDetails] = useState(false)
    const [selectedTab, setSelectedTab] = useState('Tractor'); // Track selected tab
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        field1: '',
        field2: '',
        field3: '',
        textArea: ''
    })

    const { slug } = useParams()

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = () => {
        if (!formData.field1 || !formData.field2 || !formData.field2 || !formData.textArea) {
            errorMessage("Give all the details please")
            return
        }

        if (!slug) {
            errorMessage("Try after some time")
            return
        }

        setLoading(true)
        renderInstance.patch(`/store/OperatorRequestToAddStore/${slug}/${user.userId}`, {
            cost_per_job: formData.field1,
            cost_per_hour: formData.field2,
            cost_per_month: formData.field3,
            note: formData.textArea,
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        }).then(() => {
            successMessage("Congratulations")
            setFormData({
                field1: '',
                field2: '',
                field3: '',
                textArea: ''
            })
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "User is not found") {
                errorMessage("User not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Request not found") {
                errorMessage("Request not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                errorMessage("Operator not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Store not found") {
                errorMessage("Store not found")
            } else if (err.response && err.response.status === 400 && err.response.data.message === "The operator and store hasn't make any request") {
                errorMessage("The operator and store hasn't make any request")
            } else {
                errorMessage("Some error occurred")
            }
        }).finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        if (slug) {
            fetchStoreDetails()
        }
    }, [])

    if (fetchingStoreDetails) return <p>Loading...</p>

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
                            <Heart className="h-4 w-4 text-black" />
                        </div>
                        <div className="flex items-center gap-2 rounded-[40px] bg-white/60 px-4 py-4 backdrop-blur-sm">
                            <Share className="h-4 w-4 text-black" />
                        </div>
                    </div>

                    <div className="flex items-center justify-center absolute left-1/2 -translate-x-1/2 rounded-xl bg-white/40 text-black">
                        {[
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

                <Card className='w-[600px] -mt-24 z-10 ml-4'>
                    <CardHeader>
                        <CardTitle className='text-center'>
                            Wan to join this store?
                        </CardTitle>
                        <CardDescription className='text-center'>
                            Please fill the form to request this owner
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="field1">Cost per job</Label>
                                <Input
                                    id="field1"
                                    name="field1"
                                    type="number"
                                    placeholder="Enter a number"
                                    value={formData.field1}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="field2">Cost per hour</Label>
                                <Input
                                    id="field2"
                                    name="field2"
                                    type="number"
                                    placeholder="Enter a number"
                                    value={formData.field2}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="field3">Cost per month</Label>
                                <Input
                                    id="field3"
                                    name="field3"
                                    type="number"
                                    placeholder="Enter a number"
                                    value={formData.field3}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="textArea">Message</Label>
                                <Textarea
                                    id="textArea"
                                    name="textArea"
                                    placeholder="Enter your text here"
                                    value={formData.textArea}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className='w-full' onClick={() => { handleSubmit() }}>
                            Request
                        </Button>
                    </CardFooter>
                </Card>

                <div className='w-full grid gap-6 grid-cols-3'>

                    {selectedTab === "Tractor" && store.TractorInStore.length === 0 ? (
            <Card className="w-full max-w-sm mx-auto text-center p-6">
              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No Tractors available</h3>
                  <p className="text-muted-foreground">
                    Sorry this store has no tractors available
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : store.TractorInStore.map((tractor) => (
                        <Card className="w-full max-w-sm hover:drop-shadow-lg hover:scale-105 transition-all duration-300" key={tractor.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                                    <span>{tractor.baseTractor.name}</span>
                                    <Badge>{tractor.baseTractor.type}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Image
                                    src={tractor.baseTractor.images[0] || "/placeholder.svg?height=300&width=300"}
                                    alt={tractor.baseTractor.name}
                                    width={400}
                                    height={400}
                                    unoptimized={true}
                                    className="object-cover w-full h-48 rounded-md"
                                />
                                <p className="text-muted-foreground my-2">{tractor.baseTractor.description}</p>
                                {tractor.baseTractor.model && <p>Model: {tractor.baseTractor.model}</p>}
                                <p>Hourly price: ${tractor.hourly_price}</p>
                                {/* {tractor.year && <p className="text-sm">Year: {tractor.year.getFullYear()}</p>} */}
                            </CardContent>
                        </Card>
                    ))}

                    {selectedTab === "Attachment" && store.TractorInStore.length === 0 ? (
            <Card className="w-full max-w-sm mx-auto text-center p-6">
              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No attachments available</h3>
                  <p className="text-muted-foreground">
                    Sorry this store has no attachments available
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : store.AttachmentInStore.map((tractor) => (
                        <Card className="w-full max-w-sm hover:drop-shadow-lg hover:scale-105 transition-all duration-300" key={tractor.id}>
                            <CardHeader>
                                <CardTitle>{tractor.baseAttachment.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Image
                                    src={tractor.baseAttachment.images[0] || "/placeholder.svg?height=300&width=300"}
                                    alt={tractor.baseAttachment.name}
                                    width={400}
                                    height={400}
                                    unoptimized={true}
                                    className="object-cover w-full h-48 rounded-md"
                                />
                                <p>Hourly price: ${tractor.hourly_price}</p>
                                <p className="text-muted-foreground my-2">{tractor.baseAttachment.description}</p>
                                <p>Compatible with: {tractor.baseAttachment.tractorId.length} tractor(s)</p>
                            </CardContent>
                        </Card>
                    ))}

                </div>

            </div>

            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress />
            </Backdrop>

        </div>
    )
}

export default BookingStore