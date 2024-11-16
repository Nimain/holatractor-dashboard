"use client"

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input, InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { Attachment, Booking, Farm, Tractor } from '@/utils/Types/types'
import { addDays, format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarIcon, Clock, MapPin, Minus, Plus, Receipt, Search, Tractor as TractorIcon, Truck, X } from 'lucide-react';
import { useCookie } from 'next-cookie'
import { useState, useEffect, ReactNode, FC } from 'react'
import { DateRange } from 'react-day-picker';
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Backdrop, CircularProgress } from '@mui/material';
import { Separator } from '@/components/ui/separator';

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
    email_varified: boolean;
}

interface EquipmentItem {
    id: string
    count: number
}

const WithoutStoreBooking = () => {
    const [open, setOpen] = useState(false)
    const [isBooking, setIsBooking] = useState(false)

    const [activeTab, setActiveTab] = useState('tractors')
    const [searchQuery, setSearchQuery] = useState('')

    const [farms, setFarms] = useState<Farm[]>([])
    const [fetchingFarms, setFetchingFarms] = useState(false)

    const [tractors, setTractors] = useState<Tractor[]>([])
    const [fetchingTractors, setFetchingTractors] = useState(false)

    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [fetchingAttachments, setFetchingAttachments] = useState(false)

    // Form fields
    const [selectedFarm, setSelectedFarm] = useState("")
    const [startDate, setstartDate] = useState<Date>();
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 1),
    })
    const [BookingHours, setBookingHours] = useState("");
    const [selectedTractors, setSelectedTractors] = useState<EquipmentItem[]>([])
    const [selectedAttachments, setSelectedAttachments] = useState<EquipmentItem[]>([])

    const [newBooking, setNewBooking] = useState<Booking | null>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const bookingId = searchParams.get('bookingId')

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")

    const fetchData = async () => {
        setFetchingFarms(true)
        setFetchingTractors(true)
        setFetchingAttachments(true)

        try {
            const [farmsRes, tractorsRes, attachmentsRes] = await Promise.all([
                renderInstance.get(`/farm/get-with-user-id/${user.userId}`),
                renderInstance.get('/tractor'),
                renderInstance.get('/attachment', {
                    headers: { Authorization: `Bearer ${access_token}` },
                })
            ])

            setFarms(farmsRes.data)
            setTractors(tractorsRes.data)
            setAttachments(attachmentsRes.data)
        } catch (error) {
            errorMessage("Error fetching data")
        } finally {
            setFetchingFarms(false)
            setFetchingTractors(false)
            setFetchingAttachments(false)
        }
    }

    const handleEquipmentSelect = (equipment: Tractor | Attachment, type: 'tractor' | 'attachment') => {
        const setFunction = type === 'tractor' ? setSelectedTractors : setSelectedAttachments
        setFunction(prev => {
            const existingItem = prev.find(item => item.id === equipment.id)
            if (existingItem) {
                return prev.map(item =>
                    item.id === equipment.id ? { ...item, count: item.count + 1 } : item
                )
            } else {
                return [...prev, { id: equipment.id, count: 1 }]
            }
        })
    }

    const handleEquipmentChange = (id: string, type: 'tractor' | 'attachment', increment: boolean) => {
        const setFunction = type === 'tractor' ? setSelectedTractors : setSelectedAttachments
        setFunction(prev => {
            const existingItem = prev.find(item => item.id === id)
            if (existingItem) {
                if (increment) {
                    return prev.map(item => item.id === id ? { ...item, count: item.count + 1 } : item)
                } else {
                    return prev.map(item => item.id === id ? { ...item, count: Math.max(0, item.count - 1) } : item)
                        .filter(item => item.count > 0)
                }
            } else if (increment) {
                return [...prev, { id, count: 1 }]
            }
            return prev
        })
    }

    const handleRemoveEquipment = (id: string, type: 'tractor' | 'attachment') => {
        const setFunction = type === 'tractor' ? setSelectedTractors : setSelectedAttachments
        setFunction(prev => prev.filter(item => item.id !== id))
    }

    const filteredTractors = tractors.filter(tractor =>
        tractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tractor.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredAttachments = attachments.filter(attachment =>
        attachment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attachment.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const CostItem = ({ label, value }: { label: any; value: any }) => (
        <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium">{formatCurrency(value)}</span>
        </div>
    );

    function userBookingConfirm() {
        if (newBooking && newBooking.id) {
            setIsBooking(true)
            renderInstance.patch(`/booking/${newBooking.id}/user_confirm`, {}, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }).then((res) => {
                successMessage("Successfully booked")
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
            }).finally(() => { setIsBooking(false) })
        } else {
            errorMessage("Booking is not available")
        }
    }

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    function handleBooking() {
        if (!selectedFarm) {
            errorMessage("Select a farm, please")
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

        if (selectedAttachments.length === 0 && selectedTractors.length === 0) {
            errorMessage("You need to select at least one item from store")
            return
        }

        setIsBooking(true)
        const start_date = BookingHours === "more" ? date?.from : startDate
        let booking;

        if (BookingHours === "more") {
            booking = {
                user_id: user.userId,
                farm_id: selectedFarm,
                start_date: start_date,
                end_date: BookingHours === "more" ? date?.to : new Date(),
                tractors: selectedTractors,
                attachments: selectedAttachments,
            };
        } else {
            booking = {
                user_id: user.userId,
                farm_id: selectedFarm,
                start_date: start_date,
                end_date: BookingHours === "more" ? date?.to : new Date(),
                booking_hours: BookingHours,
                tractors: selectedTractors,
                attachments: selectedAttachments,
            };
        }

        renderInstance
            .post("/booking/standalone-booking", booking, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            })
            .then((res) => {
                if (res.status === 201) {
                    setNewBooking(res.data)
                    successMessage("Booked")
                }
            })
            .catch((err) => {
                if (err.response && err.response.status === 400 && err.response.data.message === "Farmer not found") {
                    errorMessage("Farmer not found")
                } else if (err.response && err.response.status === 404 && err.response.data.message === "Log in user not found") {
                    errorMessage("Log in user not found")
                } else if (err.response && err.response.status === 409 && err.response.data.message === "You are not allowed for this operation") {
                    errorMessage("You are not allowed for this operation")
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
                setIsBooking(false)
            });
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>

            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isBooking}
            >
                <CircularProgress />
            </Backdrop>

            <DialogTrigger asChild>
                <Button
                    onClick={() => {
                        setOpen(true);
                    }}
                >
                    <span>Post Booking</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="h-[90vh] container overflow-auto">

                {
                    newBooking ?
                        <Card className="w-full mx-auto shadow-lg">
                            <CardHeader className="text-center border-b">
                                <CardTitle className="text-2xl font-bold text-primary">Booking Confirmation</CardTitle>
                                <p className="text-gray-500">Booking ID: {newBooking.id}</p>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                {/* Date and Duration Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold">Booking Period</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pl-7">
                                        <div>
                                            <p className="text-gray-600">From</p>
                                            <p className="font-medium">{new Date(newBooking.start_date).toLocaleDateString()}</p>
                                        </div>
                                        {newBooking.end_date && (
                                            <div>
                                                <p className="text-gray-600">To</p>
                                                <p className="font-medium">{new Date(newBooking.end_date).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>

                                    {!newBooking.end_date && (
                                        <div className="flex items-center gap-2 pl-7">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <p>Duration: {newBooking.booking_hours} hours</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Distance Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold">Distance Details</h3>
                                    </div>
                                    <p className="pl-7">Total Distance: {parseFloat(newBooking.distance).toFixed(2)} km</p>
                                </div>

                                <Separator />

                                {/* Cost Breakdown Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold">Cost Breakdown</h3>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <CostItem label="Attachment Cost" value={newBooking.total_attachment_cost?.toFixed(2)} />
                                        <CostItem label="Tractor Cost" value={newBooking.total_tractor_cost?.toFixed(2)} />
                                        <CostItem label="Service Charge" value={newBooking.total_service_charge?.toFixed(2)} />
                                        <CostItem label="Distance Cost" value={newBooking.total_distance_cost?.toFixed(2)} />
                                        <CostItem label="Tax" value={newBooking.total_tax?.toFixed(2)} />
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center pt-2 font-bold">
                                            <span>Total Amount</span>
                                            <span className="text-primary text-lg">
                                                {formatCurrency(newBooking.total_cost.toFixed(2))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button>Cancel</Button>
                                <Button onClick={() => { userBookingConfirm() }}>Confirm Booking</Button>
                            </CardFooter>
                        </Card>
                        :

                        <div className="flex h-full bg-white w-full">

                            {/* Left side details */}
                            <div className="w-1/2 border-r">

                                <ScrollArea className="h-full">

                                    <div className="p-6 space-y-6">

                                        <h2 className="text-2xl font-bold text-center">Booking form</h2>

                                        <div className="space-y-6">

                                            <div className="space-y-4">
                                                <Label>Select Farm</Label>
                                                {
                                                    fetchingFarms ? <p>Loading farm lists</p>
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

                                            <div className="space-y-4">
                                                <Label className="mb-3">
                                                    Booking hours
                                                </Label>

                                                <Select
                                                    onValueChange={(value) => { setBookingHours(value) }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select booking hours" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="One_Hour">1 hour</SelectItem>
                                                        <SelectItem value="Two_Hours">2 hour</SelectItem>
                                                        <SelectItem value="Three_Hours">3 hour</SelectItem>
                                                        <SelectItem value="Four_Hours">4 hour</SelectItem>
                                                        <SelectItem value="Five_Hours">5 hour</SelectItem>
                                                        <SelectItem value="Six_Hours">6 hour</SelectItem>
                                                        <SelectItem value="Seven_Hours">7 hour</SelectItem>
                                                        <SelectItem value="Eight_Hours">8 hour</SelectItem>
                                                        <SelectItem value="more">More than 8 hours</SelectItem>
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
                                                                        "w-[300px] justify-start text-left font-normal",
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
                                                                        <span>Pick a date</span>
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
                                                                        "w-[280px] justify-start text-left font-normal",
                                                                        !startDate && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
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

                                            {selectedTractors.length > 0 && (
                                                <div className="space-y-4">
                                                    <h3 className="font-medium">Selected Tractors {selectedTractors.length}</h3>
                                                    <AnimatePresence>
                                                        {selectedTractors.map(tractor => {
                                                            return (
                                                                <motion.div
                                                                    key={tractor.id}
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="flex items-center justify-between bg-muted rounded-lg p-2"
                                                                >
                                                                    <span>Tractor ID: {tractor.id}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleEquipmentChange(tractor.id, 'tractor', false)}
                                                                        >
                                                                            <Minus className="h-4 w-4" />
                                                                        </Button>
                                                                        <span className="w-8 text-center">{tractor.count}</span>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleEquipmentChange(tractor.id, 'tractor', true)}
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleRemoveEquipment(tractor.id, 'tractor')}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </motion.div>
                                                            )
                                                        })}
                                                    </AnimatePresence>
                                                </div>
                                            )}

                                            {selectedAttachments.length > 0 && (
                                                <div className="space-y-4">
                                                    <h3 className="font-medium">Selected Tractors {selectedAttachments.length}</h3>
                                                    <AnimatePresence>
                                                        {selectedAttachments.map(attachment => {
                                                            return (
                                                                <motion.div
                                                                    key={attachment.id}
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="flex items-center justify-between bg-muted rounded-lg p-2"
                                                                >
                                                                    <span>Attachment ID: {attachment.id}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleEquipmentChange(attachment.id, 'tractor', false)}
                                                                        >
                                                                            <Minus className="h-4 w-4" />
                                                                        </Button>
                                                                        <span className="w-8 text-center">{attachment.count}</span>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handleEquipmentChange(attachment.id, 'tractor', true)}
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleRemoveEquipment(attachment.id, 'tractor')}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </motion.div>
                                                            )
                                                        })}
                                                    </AnimatePresence>
                                                </div>
                                            )}

                                        </div>

                                        <Button
                                            className="w-full"
                                            size="lg"
                                            onClick={() => { handleBooking() }}
                                        >
                                            Book Equipment
                                        </Button>

                                    </div>

                                </ScrollArea>

                            </div>

                            {/* Right side details */}
                            <div className="w-1/2">
                                <ScrollArea className="h-full">
                                    <div className="p-6">
                                        <div className="mb-6">
                                            <SearchInput
                                                type="text"
                                                placeholder="Search tractors or attachments..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10"  // Added left padding for the icon
                                                icon={<Search className="h-4 w-4 text-gray-500" />}
                                            />
                                        </div>
                                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="tractors">
                                                    <TractorIcon className="mr-2 h-4 w-4" />
                                                    Tractors
                                                </TabsTrigger>
                                                <TabsTrigger value="attachments">
                                                    <Truck className="mr-2 h-4 w-4" />
                                                    Attachments
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="tractors" className="mt-6">
                                                {
                                                    fetchingTractors ?
                                                        <p>Loading all tractor lists</p>
                                                        :
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {filteredTractors.map(tractor => (
                                                                <Card
                                                                    key={tractor.id}
                                                                    className={cn(
                                                                        "cursor-pointer transition-colors",
                                                                        selectedTractors.some(a => a.id === tractor.id)
                                                                            ? "bg-muted"
                                                                            : "hover:bg-muted/50"
                                                                    )}
                                                                    onClick={() => handleEquipmentSelect(tractor, 'tractor')}
                                                                >
                                                                    <CardContent className="p-4">
                                                                        <div className="flex flex-col gap-4">
                                                                            <Image
                                                                                src={tractor.images[0]}
                                                                                alt={tractor.name}
                                                                                width={300}
                                                                                height={200}
                                                                                className="rounded-md object-cover"
                                                                            />
                                                                            <div>
                                                                                <h4 className="font-medium">{tractor.name}</h4>
                                                                                <p className="text-sm text-muted-foreground">{tractor.description}</p>
                                                                                {/* <p className="text-sm font-medium mt-2">${tractor.hourlyPrice}/hour</p> */}
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {/* Year: {format(new Date(tractor.year), 'yyyy')} | */}
                                                                                    Type: {tractor.type}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                }
                                            </TabsContent>
                                            <TabsContent value="attachments" className="mt-6">
                                                {
                                                    fetchingAttachments ?
                                                        <p>Loading all attachment lists</p>
                                                        :
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {filteredAttachments.map(attachment => (
                                                                <Card
                                                                    key={attachment.id}
                                                                    className={cn(
                                                                        "cursor-pointer transition-colors",
                                                                        selectedAttachments.some(a => a.id === attachment.id)
                                                                            ? "bg-muted"
                                                                            : "hover:bg-muted/50"
                                                                    )}
                                                                    onClick={() => handleEquipmentSelect(attachment, 'attachment')}
                                                                >
                                                                    <CardContent className="p-4">
                                                                        <div className="flex flex-col gap-4">
                                                                            <Image
                                                                                src={attachment.images[0]}
                                                                                alt={attachment.name}
                                                                                width={300}
                                                                                height={200}
                                                                                className="rounded-md object-cover"
                                                                            />
                                                                            <div>
                                                                                <h4 className="font-medium">{attachment.name}</h4>
                                                                                <p className="text-sm text-muted-foreground">{attachment.description}</p>
                                                                                {/* <p className="text-sm font-medium mt-2">${attachment.hourlyPrice}/hour</p> */}
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                }
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </ScrollArea>
                            </div>

                        </div>
                }
            </DialogContent>
        </Dialog>
    )
}

export default WithoutStoreBooking

interface SearchInputProps extends InputProps {
    icon?: ReactNode
}

export const SearchInput: FC<SearchInputProps> = ({ icon, ...props }) => {
    return (
        <div className="relative">
            <Input {...props} />
            {icon && (
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {icon}
                </div>
            )}
        </div>
    )
}