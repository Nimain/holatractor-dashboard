"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { Booking, Farm, Store, BookingHours as BookingHoursTypes } from '@/utils/Types/types'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import FarmerShimmer from '../_components/FarmerShrimmer'
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
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Backdrop, CircularProgress } from '@mui/material'
import { storePageTranslations } from './StoreTranslations'
import TranslatedText from '@/components/Menubar/TranslatedText'
import { newBookingTranslations } from '../FarmerTranslation'

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

    const [farms, setFarms] = useState<Farm[]>([])
    const [fetchingFarms, setFetchingFarms] = useState(false)

    const [selectedFarm, setSelectedFarm] = useState("")
    const [startDate, setstartDate] = useState<Date>();
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 1),
    })
    const [BookingHours, setBookingHours] = useState("");
    const [selectedTractorIds, setSelectedTractorIds] = useState<string[]>([]);
    const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([])

    const [newBooking, setNewBooking] = useState<Booking | null>(null)
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false)

    const { slug } = useParams()

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")

    const CostItem = ({ label, value }: { label: any; value: any }) => (
        <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium">{formatCurrency(value)}</span>
        </div>
    );

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    function handleBookClick(tractorId: string) {
        setSelectedTractorIds((prevIds) => {
            if (prevIds.includes(tractorId)) {
                // If already selected, remove it
                return prevIds.filter((id) => id !== tractorId);
            } else {
                // Otherwise, add it
                return [...prevIds, tractorId];
            }
        });
    }

    function handleBookAttachmentClick(attachmentId: string) {
        setSelectedAttachmentIds((prevIds) => {
            if (prevIds.includes(attachmentId)) {
                return prevIds.filter((id) => id !== attachmentId);
            } else {
                return [...prevIds, attachmentId];
            }
        });
    }

    function fetchFarms() {
        setFetchingFarms(true)
        renderInstance.get(`/farm/get-with-user-id/${user.userId}`)
            .then((res) => {
                setFarms(res.data)
            }).catch(() => {
                errorMessage("Error fetching farms")
            }).finally(() => {
                setFetchingFarms(false)
            })
    }

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

    function handleBooking() {
        if (!slug || !user.userId) {
            errorMessage("Try after some time")
            return

        }
        if (!selectedFarm) {
            errorMessage("Please select a farm")
            return
        }

        if (!BookingHours) {
            errorMessage("Select booking hours")
            return
        }

        if ((BookingHours === "more" && !date?.from) && !startDate) {
            errorMessage("Select the start date")
            return
        }

        if (BookingHours === "more" && !date?.to) {
            errorMessage("Select the end date")
            return
        }

        if (selectedAttachmentIds.length === 0 && selectedTractorIds.length === 0) {
            errorMessage("You need to select at least one item from store")
            return
        }

        setLoading(true);

        let booking;
        const start_date = BookingHours === "more" ? date?.from : startDate

        if (BookingHours === "more") {
            booking = {
                farm_id: selectedFarm,
                user_id: user.userId,
                store_id: slug,
                start_date: start_date,
                end_date: date?.to,
                tractor_ids: selectedTractorIds,
                attachment_ids: selectedAttachmentIds,
            };
        } else {
            booking = {
                farm_id: selectedFarm,
                user_id: user.userId,
                store_id: slug,
                start_date: start_date,
                booking_hours: BookingHours,
                tractor_ids: selectedTractorIds,
                attachment_ids: selectedAttachmentIds,
            };
        }

        renderInstance
            .post("/booking", booking, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            })
            .then((res) => {
                if (res.status === 201) {
                    setNewBooking(res.data)
                    setOpen(true)
                }
            })
            .catch((err) => {
                if (err.response && err.response.status === 400 && err.response.data.message === "Farmer not found") {
                    errorMessage("Farmer not found")
                } else if (err.response && err.response.status === 404 && err.response.data.message === "Log in user not found") {
                    errorMessage("Log in user not found")
                } else if (err.response && err.response.status === 404 && err.response.data.message === "Store not found") {
                    errorMessage("Store not found")
                } else if (err.response && err.response.status === 404 && err.response.data.message === "Farm with this user not found") {
                    errorMessage("Farm with this user not found")
                } else if (err.response && err.response.status === 404 && err.response.data.message === "Attachment not present") {
                    errorMessage("Attachment not available")
                } else if (err.response && err.response.status === 404 && err.response.data.message === "Tractor not present") {
                    errorMessage("Tractor not available")
                } else {
                    errorMessage("Some error occurred");
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function userBookingConfirm() {
        if (newBooking && newBooking.id) {
            setLoading(true)
            renderInstance.patch(`/booking/${newBooking.id}/user_confirm`, {}, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }).then((res) => {
                successMessage("Successfully booked")
                setNewBooking(null)
                setOpen(false)
            }).catch((err) => {
                if (err.response && err.response.status === 404 && err.response.data.message === "Booking is not valid") {
                    errorMessage("Booking is not valid")
                } else if (err.response && err.response.status === 400 && err.response.data.message === "Booking already confirm") {
                    successMessage("Successfully booked")
                } else if (err.response && err.response.status === 400 && err.response.data.message === "You are not allowed to perform this task") {
                    successMessage("You are not allowed to perform this task")
                } else {
                    errorMessage("Some error occurred. Please try again...")
                }
            }).finally(() => {
                setOpen(false)
                setLoading(false)
            })
        } else {
            errorMessage("Booking is not available")
        }
    }

    useEffect(() => {
        if (slug) {
            fetchStoreDetails()
        }
    }, [])

    useEffect(() => {
        if (user) {
            fetchFarms()
        }
    }, [])

    if (fetchingStoreDetails) return <FarmerShimmer />

    if (!store) return <p><TranslatedText greetings={storePageTranslations.storeDetailsUnavailable} /></p>

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
                        <TranslatedText greetings={storePageTranslations.wantToBook} />
                        </CardTitle>
                        <CardDescription className='text-center'>
                        <TranslatedText greetings={storePageTranslations.fillFormToBook} />
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label><TranslatedText greetings={storePageTranslations.selectFarms} /></Label>
                                {
                                    fetchingFarms ? <p><TranslatedText greetings={storePageTranslations.loadingFarmLists} /></p>
                                        :
                                        <Select onValueChange={(value) => { setSelectedFarm(value) }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a farm" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {farms.map(farm => (
                                                    <SelectItem key={farm.id} value={farm.id}>
                                                        {farm.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                }
                            </div>
                            <div className="space-y-4 mb-2">
                                <Label>
                                <TranslatedText greetings={newBookingTranslations.bookingHours} />
                                </Label>

                                <Select
                                    onValueChange={(value) => { setBookingHours(value) }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={<TranslatedText greetings={newBookingTranslations.bookingHours} />} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="One_Hour">
                                        <TranslatedText greetings={newBookingTranslations.hours['1h']} />
                                        </SelectItem>
                                        <SelectItem value="Two_Hours">
                                        <TranslatedText greetings={newBookingTranslations.hours['2h']} />
                                        </SelectItem>
                                        <SelectItem value="Three_Hours">
                                        <TranslatedText greetings={newBookingTranslations.hours['3h']} />
                                        </SelectItem>
                                        <SelectItem value="Four_Hours">
                                        <TranslatedText greetings={newBookingTranslations.hours['4h']} />
                                        </SelectItem>
                                        <SelectItem value="Five_Hours">
                                        <TranslatedText greetings={newBookingTranslations.hours['5h']} />
                                        </SelectItem>
                                        <SelectItem value="Six_Hours">
                                        <TranslatedText greetings={newBookingTranslations.hours['6h']} />
                                        </SelectItem>
                                        <SelectItem value="Seven_Hours">
                                        <TranslatedText greetings={newBookingTranslations.hours['7h']} />
                                        </SelectItem>
                                        <SelectItem value="Eight_Hours">
                                        <TranslatedText greetings={newBookingTranslations.hours['8h']} />
                                        </SelectItem>
                                        <SelectItem value="more">
                                        <TranslatedText greetings={newBookingTranslations.moreThan8Hours} />
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {
                                BookingHours === "more" ?
                                    <div className={cn("grid gap-2")}>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="date"
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !date && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon />
                                                    {date?.from ? (
                                                        date.to ? (
                                                            <>
                                                                {format(date.from, "LLL dd, y")} -{" "}
                                                                {format(date.to, "LLL dd, y")}
                                                            </>
                                                        ) : (
                                                            format(date.from, "LLL dd, y")
                                                        )
                                                    ) : (
                                                        <TranslatedText greetings={newBookingTranslations.pickADate} />
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={date?.from}
                                                    selected={date}
                                                    onSelect={setDate}
                                                    numberOfMonths={2}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    :
                                    <>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !startDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {startDate ? format(startDate, "PPP") : <TranslatedText greetings={newBookingTranslations.pickAStartDate} />}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    onSelect={setstartDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </>
                            }
                            <p>
                            <TranslatedText greetings={newBookingTranslations.selectedTractors} />: {selectedTractorIds.length}
                            </p>
                            <p>
                            <TranslatedText greetings={newBookingTranslations.selectedAttachments} />: {selectedAttachmentIds.length}
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className='w-full'
                            onClick={() => { handleBooking() }}>
                            <TranslatedText greetings={newBookingTranslations.bookEquipment} />
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
                                    <h3 className="text-xl font-semibold">
                                    <TranslatedText greetings={storePageTranslations.noTractorsAvailable} />
                                    </h3>
                                    <p className="text-muted-foreground">
                                    <TranslatedText greetings={storePageTranslations.sorryNoTractors} />
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
                                {tractor.baseTractor.model && <p><TranslatedText greetings={storePageTranslations.model} />: {tractor.baseTractor.model}</p>}
                                <p><TranslatedText greetings={storePageTranslations.hourlyPrice} />: ${tractor.hourly_price}</p>
                                {/* {tractor.year && <p className="text-sm">Year: {tractor.year.getFullYear()}</p>} */}
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        handleBookClick(tractor.id);
                                    }}>
                                    {selectedTractorIds.includes(tractor.id)
                                        ? <TranslatedText greetings={storePageTranslations.selected} />
                                        : <TranslatedText greetings={storePageTranslations.select} />}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {selectedTab === "Attachment" && store.TractorInStore.length === 0 ? (
                        <Card className="w-full max-w-sm mx-auto text-center p-6">
                            <CardContent className="space-y-6">
                                <div className="bg-gray-50 rounded-lg p-4 mx-auto w-20 h-20 flex items-center justify-center">
                                    <CreditCard className="w-10 h-10 text-gray-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold"><TranslatedText greetings={storePageTranslations.noTractorsAvailable} /></h3>
                                    <p className="text-muted-foreground">
                                    <TranslatedText greetings={storePageTranslations.sorryNoAttachments} />
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
                                <p><TranslatedText greetings={storePageTranslations.hourlyPrice} />: ${tractor.hourly_price}</p>
                                <p className="text-muted-foreground my-2">{tractor.baseAttachment.description}</p>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        handleBookAttachmentClick(tractor.id);
                                    }}>
                                    {selectedAttachmentIds.includes(tractor.id)
                                        ? <TranslatedText greetings={storePageTranslations.selected} />
                                        : <TranslatedText greetings={storePageTranslations.select} />}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                </div>

            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    {
                        newBooking && <Card className="w-full mx-auto shadow-lg">
                            <CardHeader className="text-center border-b">
                                <CardTitle className="text-2xl font-bold text-primary">
                                <TranslatedText greetings={newBookingTranslations.bookingConfirmation} />
                                </CardTitle>
                                <p className="text-gray-500"><TranslatedText greetings={newBookingTranslations.bookingId} />: {newBooking.id}</p>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                {/* Date and Duration Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold"><TranslatedText greetings={newBookingTranslations.bookingPeriod} /></h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pl-7">
                                        <div>
                                            <p className="text-gray-600"><TranslatedText greetings={newBookingTranslations.from} /></p>
                                            <p className="font-medium">{new Date(newBooking.start_date).toLocaleDateString()}</p>
                                        </div>
                                        {newBooking.end_date && (
                                            <div>
                                                <p className="text-gray-600"><TranslatedText greetings={newBookingTranslations.to} /></p>
                                                <p className="font-medium">{new Date(newBooking.end_date).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>

                                    {!newBooking.end_date && (
                                        <div className="flex items-center gap-2 pl-7">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <p><TranslatedText greetings={newBookingTranslations.duration} />: {newBooking.booking_hours === BookingHoursTypes.EIGHT_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['8h']} /> : newBooking.booking_hours === BookingHoursTypes.SEVEN_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['7h']} /> : newBooking.booking_hours === BookingHoursTypes.SIX_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['6h']} /> : newBooking.booking_hours === BookingHoursTypes.FIVE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['5h']} /> : newBooking.booking_hours === BookingHoursTypes.FOUR_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['4h']} /> : newBooking.booking_hours === BookingHoursTypes.THREE_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['3h']} /> : newBooking.booking_hours === BookingHoursTypes.TWO_HOURS ? <TranslatedText greetings={newBookingTranslations.hours['2h']} /> : <TranslatedText greetings={newBookingTranslations.hours['1h']} />}</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Distance Section */}
                                {
                                    newBooking.distance &&
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-primary" />
                                            <h3 className="font-semibold"><TranslatedText greetings={newBookingTranslations.distanceDetails} /></h3>
                                        </div>
                                        <p className="pl-7"><TranslatedText greetings={newBookingTranslations.totalDistance} />: {parseFloat(newBooking.distance).toFixed(2)} km</p>
                                    </div>
                                }

                                <Separator />

                                {/* Cost Breakdown Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold"><TranslatedText greetings={newBookingTranslations.costBreakdown} /></h3>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <CostItem label={<TranslatedText greetings={newBookingTranslations.attachmentCost} />} value={newBooking.total_attachment_cost?.toFixed(2)} />
                                        <CostItem label={<TranslatedText greetings={newBookingTranslations.tractorCost} />} value={newBooking.total_tractor_cost?.toFixed(2)} />
                                        <CostItem label={<TranslatedText greetings={newBookingTranslations.serviceCharge} />} value={newBooking.total_service_charge?.toFixed(2)} />
                                        <CostItem label={<TranslatedText greetings={newBookingTranslations.distanceCost} />} value={newBooking.total_distance_cost?.toFixed(2)} />
                                        <CostItem label={<TranslatedText greetings={newBookingTranslations.tax} />} value={newBooking.total_tax?.toFixed(2)} />
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center pt-2 font-bold">
                                            <span><TranslatedText greetings={newBookingTranslations.totalAmount} /></span>
                                            <span className="text-primary text-lg">
                                                {formatCurrency(newBooking.total_cost.toFixed(2))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <DialogClose asChild>
                                    <Button><TranslatedText greetings={newBookingTranslations.cancel} /></Button>
                                </DialogClose>
                                <Button onClick={() => { userBookingConfirm() }}><TranslatedText greetings={newBookingTranslations.confirmBooking} /></Button>
                            </CardFooter>
                        </Card>
                    }
                </DialogContent>
            </Dialog>

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