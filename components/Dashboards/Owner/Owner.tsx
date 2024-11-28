"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Attachment, Booking, Operator, OperatorInStore, Owner, Store, Tractor } from '@/utils/Types/types'
import { BarChartIcon, CalendarIcon, ClipboardListIcon, ClockIcon, DollarSignIcon, MapPinIcon, TractorIcon, Truck, UserIcon } from 'lucide-react'
import { useCookie } from 'next-cookie'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import HomeDashboard from './_components/HomeDashboard'
import TranslatedText from '@/components/Menubar/TranslatedText'
import { WelcomeTranslation } from '../Farmer/FarmerTranslation'
import Languages from '@/components/Menubar/Languages'
import { Input } from '@/components/ui/input'
import OwnerShrimmer from './_components/OwnerShrimmer'
import NewStore from './_components/NewStore'

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const OwnerDashboardPage = () => {
  const [fetchingOwnerDetails, setFetchingOwnerDetails] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [operators, setOperators] = useState<OperatorInStore[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tractors, setTractors] = useState<Tractor[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [tractorsInUse, setTractorsInUse] = useState(0)
  const [attachmentsInUse, setAttachmentsInUse] = useState(0)

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  function fetchOwner() {
    setFetchingOwnerDetails(true)

    renderInstance.get(`/owner/${user.userId}`)
      .then((res) => {
        setStores(res.data.stores)
        setOperators(res.data.operators)
        setBookings(res.data.bookings)
        setTractors(res.data.tractors)
        setAttachments(res.data.attachments)
        setTractorsInUse(res.data.tractorsInuse)
        setAttachmentsInUse(res.data.attachmentsInuse)
      }).catch((err) => {
        errorMessage("Error fetching user detaild")
      }).finally(() => {
        setFetchingOwnerDetails(false)
      })
  }

  useEffect(() => {
    if (user) {
      fetchOwner()
    }
  }, [])

  if (fetchingOwnerDetails) return <OwnerShrimmer />

  if (!user) return <p>user not found</p>

  return (
    <div className="flex flex-col w-full overflow-y-auto" >

      <div className="bg-white text-white p-4 flex flex-col 1050px:flex-row items-start 1050px:items-center justify-start 1050px:justify-between gap-4 shadow-md rounded-2xl">
        <h1 className="text-xl md:text-3xl font-bold text-gray-700"><TranslatedText greetings={WelcomeTranslation} /> {user.name}</h1>

        <div className="flex items-center space-x-6">

          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              className="p-2 pl-10 pr-4 rounded-full text-gray-800 shadow-md border-2 w-full 768px:w-72"
            />
            {/* Search Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.5 3a5.5 5.5 0 11-5.5 5.5A5.507 5.507 0 018.5 3zm0 1a4.5 4.5 0 10-4.5 4.5A4.507 4.507 0 008.5 4zM14 14a6 6 0 11-2.13-4.73l4.9 4.9a1 1 0 011.41-1.42l-4.9-4.9A5.979 5.979 0 0114 14z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <Button
            className="bg-green-600 hover:bg-green-900 text-white py-2 px-6 rounded-full text-sm hidden 1200px:inline-block">
            Upgrade Plan
          </Button>

          <Languages />
        </div>

      </div>

      {/* Main Content */}

      <HomeDashboard
        stores={stores}
        operators={operators}
        tractors={tractors}
        attachments={attachments}
        bookings={bookings}
        tractorsInUse={tractorsInUse}
        attachmentsInUse={attachmentsInUse} />

    </div>
  )
}

export default OwnerDashboardPage