"use client"

import { Booking } from "@/utils/Types/types"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { ChevronRight, Mail, MessageCircle, MoreHorizontal, NotepadText, Phone, Plus } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { useCookie } from "next-cookie";
import { useEffect } from "react";

const NewBookings = ({ booking }: { booking: Booking }) => {

    const { cookie } = useCookie();
    const access_token = cookie.get("access_token");

    function fetchAvailableStores(){
        renderInstance.post(`/booking/standalone-booking/${booking.id}/check-available-stores`,{},{
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          })
        .then((res)=>{
            console.log(res)
        }).catch((err)=>{
            console.log(err)
        })
    } 

    useEffect(() => {
      fetchAvailableStores()
    }, [])

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Card className="overflow-hidden bg-white shadow-sm rounded-md mt-3">
                    <CardContent className="flex items-center space-x-4 p-4">
                        <Avatar className="h-12 w-12">
                            {
                                booking.user && booking.user?.image &&
                                <AvatarImage src={booking.user?.image} alt={booking.user.first_name} />
                            }
                            <AvatarFallback>
                                {booking.user?.first_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">{booking.user?.first_name} {booking.user?.middle_name ?? ""} {booking.user?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{new Date(booking.createdAt).toLocaleDateString()}</p>
                            <div className="flex items-center pt-2">
                                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="text-sm">
                                    {`${booking.user?.email.split('@')[0].slice(0, 3)}...@${booking.user?.email.split('@')[1]}`}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-2xl p-0 bg-white">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <ChevronRight className="h-4 w-4" />
                            <span className="text-lg font-semibold">Lead Preview</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-md"
                        >
                            <span className="text-sm">View full details</span>
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                        </Button>
                    </SheetTitle>
                </SheetHeader>

                <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-80px)]">
                    <div className="bg-white rounded-lg shadow-md p-6 border mt-3">
                        <div className="flex justify-between">

                            <div className="flex items-center space-x-4">
                                <div>
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src="/placeholder.svg?height=64&width=64" />
                                        <AvatarFallback>JB</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <div>
                                        <h2 className="text-xl font-semibold">Jerome Bell</h2>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm">jeromebell@gmail.com</span>
                                        <span>•</span>
                                        <Phone className="h-4 w-4" />
                                        <span className="text-sm">(405) 555-0128</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200">
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200">
                                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                        </div>
                        <div>
                            <div className="grid grid-cols-4 gap-4 mt-6 border">
                                <div className="p-4">
                                    <Label className="text-xs text-muted-foreground">Lead owner</Label>
                                    <div className="font-medium">Esther Howard</div>
                                </div>
                                <div className="p-4">
                                    <Label className="text-xs text-muted-foreground">Company</Label>
                                    <div className="font-medium">Google</div>
                                </div>
                                <div className="p-4">
                                    <Label className="text-xs text-muted-foreground">Job Title</Label>
                                    <div className="font-medium">Content Writer</div>
                                </div>
                                <div className="p-4">
                                    <Label className="text-xs text-muted-foreground block mb-1">Annual revenue</Label>
                                    <div className="font-medium">$ 5,000</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                        <Button variant="secondary" className="bg-green-100 text-green-800 w-32 h-10">New</Button>
                        <Button variant="secondary" className="bg-green-100 text-green-800 w-32 h-10">Open</Button>
                        <Button variant="secondary" className="bg-emerald-500 text-white w-32 h-10">In Progress</Button>
                        <Button variant="outline" size="sm" className="w-32 h-10">Open deals</Button>
                        <Button variant="outline" size="sm" className="w-32 h-10">Closed</Button>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center">
                            <Label className="text-md text-muted-foreground">Lead source</Label>
                            <select className="ml-2 p-1 text-xs border rounded-md">
                                <option value="source1">Source 1</option>
                                <option value="source2">Source 2</option>
                                <option value="source3">Source 3</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2 p-2 border rounded-md">
                            <span className="text-green-500">
                                <i className="fas fa-check-circle"></i>
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Last activity: <span className="font-medium">2 Jan 2020 at 10:00 AM</span>
                            </span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between">
                            <h3 className="text-lg font-semibold">
                                Upcoming Activity
                                <span className="text-sm font-normal text-muted-foreground ml-6">2</span>
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-2 text-red-700 px-4 py-2"
                            >
                                <span>View full details</span>
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                            </Button>
                        </div>
                        <div className="mt-2 border rounded-md p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" className="w-4 h-4 rounded-full border-gray-400 accent-blue-500" />
                                        <h4 className="font-medium">Prepare quote for Jerome Bell</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        She's interested in our new product line and wants our very best price.
                                        Please include a detailed breakdown of costs.
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between mt-4 text-sm border p-4 rounded-md">
                                <div className="flex items-center space-x-4 w-full">
                                    <div className="flex flex-col w-1/3 rounded-md">
                                        <Label className="text-xs text-muted-foreground">Reminder</Label>
                                        <select className="border p-2 rounded-md text-sm">
                                            <option>No reminder</option>
                                            <option>1 hour before</option>
                                            <option>1 day before</option>
                                            <option>Custom</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col w-1/3 rounded-md">
                                        <Label className="text-xs text-muted-foreground">Task Priority</Label>
                                        <select className="border p-2 rounded-md text-sm">
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Critical</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col w-1/3 rounded-md">
                                        <Label className="text-xs text-muted-foreground">Assigned to</Label>
                                        <select className="border p-2 rounded-md text-sm">
                                            <option>Esther Howard</option>
                                            <option>John Doe</option>
                                            <option>Jane Smith</option>
                                            <option>David Williams</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between border-b p-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                                    <NotepadText className="w-5 h-5 text-muted-foreground" />
                                    Notes
                                    <span className="text-sm font-normal text-gray-500">4</span>
                                </h3>
                                <div className="flex items-center gap-2 p-2 border rounded-md shadow-sm">
                                    <Calendar className="text-xl text-blue-500" />
                                    <span className="text-base text-gray-800">January 2, 2024</span>
                                </div>
                            </div>

                            <div className="mt-4 p-4">
                                <div className="flex items-start justify-between pb-4 mb-4">
                                    <div>
                                        <h4 className="font-medium text-gray-800">Note by Esther Howard</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            She's interested in our new product line and wants our very best price.
                                            Please include a detailed breakdown of costs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full mt-4">+ Add note</Button>
                    </div>
                </div>
            </SheetContent>

        </Sheet>
    )
}

export default NewBookings