"use client"

import { useEffect, useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, User, Briefcase, DollarSign, ChevronRight, MoreHorizontal, Plus, MessageCircle, NotepadText, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Booking } from '@/utils/Types/types';
import OwnerShrimmer from '../_components/OwnerShrimmer';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { useCookie } from 'next-cookie';
import NewBookings from './NewBookings'
import SeeBooking from './SeeBooking'
import TranslatedText from '@/components/Menubar/TranslatedText'
import { ownerMarketPlaceTranslations } from './OwnerMarketPlaceTranslations'


interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  time: string;
}

interface Column {
  id: number;
  title: string;
  leads: Lead[];
  statusColor: string;
}

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

interface NewBookings {
  booking: Booking;
  minDistance: number | null
}

interface Location {
  latitude: number | null;
  longitude: number | null;
}

const Marketplace = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false)
  const [currentLead, setCurrentLead] = useState(null);
  const [fetchingPageDetails, setFetchingPageDetails] = useState(false)

  const [totalReceived, setTotalReceived] = useState(0)
  const [totalStandAloneBookimgs, setTotalStandAloneBookimgs] = useState(0)
  const [customers, setCustomers] = useState(0)
  const [openBookings, setOpenBookings] = useState<Booking[]>([])
  const [newBookings, setNewBookings] = useState<NewBookings[]>([])
  const [inProgressBookings, setInProgressBookings] = useState<Booking[]>([])
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([])

  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
  const [error, setError] = useState<string | null>(null);

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const stats = [
    {
      title: <TranslatedText greetings={ownerMarketPlaceTranslations.income} />,
      value: `$${totalReceived}`,
      change: "10.5%",
      isPositive: true,
      description: <TranslatedText greetings={ownerMarketPlaceTranslations.vsLastMonth} />,
    },
    {
      title: <TranslatedText greetings={ownerMarketPlaceTranslations.avgSales} />,
      value: `$${totalReceived}`,
      change: "6.2%",
      isPositive: true,
      description: <TranslatedText greetings={ownerMarketPlaceTranslations.vsLastMonth} />,
    },
    {
      title: <TranslatedText greetings={ownerMarketPlaceTranslations.bookings} />,
      value: totalStandAloneBookimgs,
      change: "0.7%",
      isPositive: false,
      description: <TranslatedText greetings={ownerMarketPlaceTranslations.vsLastMonth} />,
    },
    {
      title: <TranslatedText greetings={ownerMarketPlaceTranslations.leads} />,
      value: customers,
      change: "15.2%",
      isPositive: false,
      description: <TranslatedText greetings={ownerMarketPlaceTranslations.vsLastMonth} />,
    },
  ];

  const handleCardClick = (lead: any) => {
    if (lead.title === "LEADS") { // Only trigger dialog for "LEADS"
      setCurrentLead(lead);  // Set the selected lead
      setOpen(true);         // Open the dialog
    }
  };

  function fetchPageDetails() {
    setFetchingPageDetails(true)

    renderInstance.get(`/owner/get-owner-market-page-details/${user.userId}`)
      .then((res) => {
        setCustomers(res.data.customers)
        setTotalStandAloneBookimgs(res.data.totalStandAloneBookimgs)
        setOpenBookings(res.data.openBookings)
        setInProgressBookings(res.data.inProgressBookings)
        setTotalReceived(res.data.totalReceived)
        setCompletedBookings(res.data.completedBookings)
      }).catch((err) => {
        errorMessage("Error fetching user detaild")
      }).finally(() => {
        setFetchingPageDetails(false)
      })
  }

  function fetchNewBookings() {
    setFetchingPageDetails(true)
    
    renderInstance.get(`/booking/get/stand-alone/bookings?lat=${location.latitude}&lng=${location.longitude}&radius=80`)
      .then((res) => {
        setNewBookings(res.data)
      }).catch((err) => {
        errorMessage("Error fetching user detaild")
      }).finally(() => {
        setFetchingPageDetails(false)
      })
  }

  useEffect(() => {
    if (user) {
      fetchPageDetails()
    }
  }, [])

  useEffect(() => {
    if(location.latitude && location.longitude) {
      fetchNewBookings()
    }
  }, [location])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error: GeolocationPositionError) => {
          setError(error.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <>
      <div className="flex justify-between items-center gap-4 flex-wrap mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/owner"><TranslatedText greetings={ownerMarketPlaceTranslations.dashboard} /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/owner/marketplace"><TranslatedText greetings={ownerMarketPlaceTranslations.marketplace} /></BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <TooltipProvider>
        <div className="p-6 space-y-6 ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => handleCardClick(stat)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p><TranslatedText greetings={ownerMarketPlaceTranslations.clickForMoreDetails} /></p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {/* <p className="text-xs text-muted-foreground">
                    <span className={stat.isPositive ? "text-green-600" : "text-red-600"}>
                      {stat.isPositive ? "▲" : "▼"} {stat.change}
                    </span>
                    {" "}
                    {stat.description}
                  </p> */}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* "New" Status Column */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white p-7 rounded-md">
                  <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                    <span><TranslatedText greetings={ownerMarketPlaceTranslations.new} /></span>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {newBookings.length} <TranslatedText greetings={ownerMarketPlaceTranslations.leads} />
                  </span>
                </CardHeader>
              </Card>
              {fetchingPageDetails ?
              <LeadShrimmer />
              : 
              newBookings.length === 0 ? <p><TranslatedText greetings={ownerMarketPlaceTranslations.noOpenBookingsAvailable} /></p> : newBookings.map((lead) => (
                <NewBookings booking={lead.booking} key={lead.booking.id} minDistance={lead.minDistance} />
              ))}
            </div>

            {/* "Open" Status Column */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white p-7 rounded-md">
                  <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-purple-500"></span>
                    <span><TranslatedText greetings={ownerMarketPlaceTranslations.open} /></span>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {openBookings.length} <TranslatedText greetings={ownerMarketPlaceTranslations.leads} />
                  </span>
                </CardHeader>
              </Card>
              {fetchingPageDetails ?
              <LeadShrimmer />
              :
              openBookings.length === 0 ? <p><TranslatedText greetings={ownerMarketPlaceTranslations.noOpenBookingsAvailable} /></p> : openBookings.map((lead) => (
                <SeeBooking booking={lead} key={lead.id} />
              ))}
            </div>

            {/* "In Progress" Status Column */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white p-7 rounded-md">
                  <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <span><TranslatedText greetings={ownerMarketPlaceTranslations.inProgress} /></span>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {inProgressBookings.length} <TranslatedText greetings={ownerMarketPlaceTranslations.leads} />
                  </span>
                </CardHeader>
              </Card>
              {
              fetchingPageDetails ?
              <LeadShrimmer />
              :
              inProgressBookings.length === 0 ? <p><TranslatedText greetings={ownerMarketPlaceTranslations.noOpenBookingsAvailable} /></p> : inProgressBookings.map((lead) => (
                <SeeBooking booking={lead} key={lead.id} />
              ))}
            </div>

            {/* "Closed" Status Column */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white p-7 rounded-md">
                  <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span><TranslatedText greetings={ownerMarketPlaceTranslations.closed} /></span>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {completedBookings.length} <TranslatedText greetings={ownerMarketPlaceTranslations.leads} />
                  </span>
                </CardHeader>
              </Card>
              {
              fetchingPageDetails ?
              <LeadShrimmer />
              :
              completedBookings.length === 0 ? <p><TranslatedText greetings={ownerMarketPlaceTranslations.noOpenBookingsAvailable} /></p> : completedBookings.map((lead) => (
                <SeeBooking booking={lead} key={lead.id} />
              ))}
            </div>
          </div>


        </div>
      </TooltipProvider>

    </>
  )
}

export default Marketplace

function LeadShrimmer() {
  return (
    <div className="space-y-4">
      {
        Array.from({ length: 2 }).map((_, index) => (
          <div className="animate-pulse w-full h-32 bg-white shadow-sm rounded-md" key={index} />
        ))
      }
    </div>
  )
}