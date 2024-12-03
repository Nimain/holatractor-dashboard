"use client"

import { Button } from '@/components/ui/button'
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance'
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
import { io, Socket } from 'socket.io-client'

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
    // Connect to the socket server
    const newSocket: Socket = io(NestJsBaseURL, {
      query: {
        userId: user.userId
      }
    });

    // Listen for the 'newFarmerNotification' event
    newSocket.on('newOwnerStore', (addedStore: Store) => {
      setStores(pre => [...pre, addedStore])
    });

    // Clean up the event listener when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchOwner()
    }
  }, [])

  if (fetchingOwnerDetails) return <OwnerShrimmer />

  if (!user) return <p>user not found</p>

  return (
    <div className="flex flex-col w-full overflow-y-auto" >

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