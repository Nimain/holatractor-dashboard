"use client"

import { Booking, BookingStatus } from '@/utils/Types/types'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle, FileText, Users, MessageSquare, FileQuestion, Tractor } from 'lucide-react'

const LatestBookingComponent = ({booking, bookingLength}:{booking: Booking[]; bookingLength: number;}) => {

    if(booking.length === 0){
        return (
            <Card className="w-full max-w-sm bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white border-none rounded-3xl">
                <CardContent className="space-y-4 flex items-center justify-center flex-col gap-2 py-5">
                <CheckCircle2 className="h-12 w-12 text-yellow-400" />
                <p className='text-xl 900px:text-2xl font-semibold text-center'>
                    No bookings available
                </p>
                </CardContent>
            </Card>
        )
    }

    return (
      <Card className="w-full 900px:max-w-md bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white border-none rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center justify-between">
            Latest bookings
            <span className="font-normal text-2xl">
              {booking.length}/{bookingLength}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 text-sm justify-between"
            >
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 flex items-center justify-center aspect-square rounded-full bg-white'>
                    <Tractor className='text-red-600' />
                </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="truncate text-sm font-medium">#holabook{task.id.slice(-4)}</span>
                <span className="text-xs text-zinc-400">{new Date(task.createdAt).toLocaleDateString()} {task.bookingStatus}</span>
              </div>
              </div>
              <div className="relative">
                {task.bookingStatus === BookingStatus.Finished ? (
                  <CheckCircle2 className="h-6 w-6 text-orange-700" />
                ) : (
                  <Circle className="h-6 w-6 text-orange-600" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
}

export default LatestBookingComponent