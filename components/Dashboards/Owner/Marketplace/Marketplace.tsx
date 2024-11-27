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

const marketplace = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false)
  const [currentLead, setCurrentLead] = useState(null);
  const [fetchingPageDetails, setFetchingPageDetails] = useState(false)

  const [totalReceived, setTotalReceived] = useState(0)
  const [totalStandAloneBookimgs, setTotalStandAloneBookimgs] = useState(0)
  const [customers, setCustomers] = useState(0)
  const [openBookings, setOpenBookings] = useState<Booking[]>([])
  const [newBookings, setNewBookings] = useState<Booking[]>([])
  const [inProgressBookings, setInProgressBookings] = useState<Booking[]>([])
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([])

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const stats = [
    {
      title: "INCOME",
      value: `$${totalReceived}`,
      change: "10.5%",
      isPositive: true,
      description: "vs last month",
    },
    {
      title: "AVG. SALES",
      value: `$${totalReceived}`,
      change: "6.2%",
      isPositive: true,
      description: "vs last month",
    },
    {
      title: "BOOKINGS",
      value: totalStandAloneBookimgs,
      change: "0.7%",
      isPositive: false,
      description: "vs last month",
    },
    {
      title: "LEADS",
      value: customers,
      change: "15.2%",
      isPositive: false,
      description: "vs last month",
    },
  ];

  const handleCardClick = (lead: any) => {
    if (lead.title === "LEADS") { // Only trigger dialog for "LEADS"
      setCurrentLead(lead);  // Set the selected lead
      setOpen(true);         // Open the dialog
    }
  };

  const handleDialogClose = () => {
    setOpen(false);        // Close the dialog
    setCurrentLead(null);  // Reset the selected lead
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

    renderInstance.get(`/booking/get/stand-alone/bookings`)
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

  useEffect(()=>{
    fetchNewBookings()
  },[])

  if (fetchingPageDetails) return <OwnerShrimmer />

  if (!user) return <p>user not found</p>

  return (
    <>
      <div className="flex justify-between items-center gap-4 flex-wrap mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/owner">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/owner/marketplace">Marketplace</BreadcrumbLink>
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
                      <p>Click for more details</p>
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
                    <span>New</span>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {newBookings.length} Leads
                  </span>
                </CardHeader>
              </Card>
              {newBookings.length === 0 ? <p>No open bookings available</p> : newBookings.map((lead) => (
                <NewBookings booking={lead} key={lead.id} />
              ))}
            </div>

            {/* "Open" Status Column */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white p-7 rounded-md">
                  <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-purple-500"></span>
                    <span>Open</span>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {openBookings.length} Leads
                  </span>
                </CardHeader>
              </Card>
              {openBookings.length === 0 ? <p>No open bookings available</p> : openBookings.map((lead) => (
                <SeeBooking booking={lead} />
              ))}
            </div>

            {/* "In Progress" Status Column */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white p-7 rounded-md">
                  <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <span>In Progress</span>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {inProgressBookings.length} Leads
                  </span>
                </CardHeader>
              </Card>
              {inProgressBookings.length === 0 ? <p>No open bookings available</p> :inProgressBookings.map((lead) => (
                <Card key={lead.id} className="overflow-hidden bg-white shadow-sm rounded-md mt-3">
                  <CardContent className="flex items-center space-x-4 p-4">
                    <Avatar className="h-12 w-12">
                      {
                        lead.user && lead.user?.image &&
                      <AvatarImage src={lead.user?.image} alt={lead.user.first_name} />
                      }
                      <AvatarFallback>
                        {lead.user?.first_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.user?.first_name} {lead.user?.middle_name ?? ""} {lead.user?.last_name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p>
                      <div className="flex items-center pt-2">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {`${lead.user?.email.split('@')[0].slice(0, 3)}...@${lead.user?.email.split('@')[1]}`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* "Closed" Status Column */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white p-7 rounded-md">
                  <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span>Closed</span>
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {completedBookings.length} Leads
                  </span>
                </CardHeader>
              </Card>
              {completedBookings.length === 0 ? <p>No open bookings available</p> :completedBookings.map((lead) => (
                <Card key={lead.id} className="overflow-hidden bg-white shadow-sm rounded-md mt-3">
                  <CardContent className="flex items-center space-x-4 p-4">
                    <Avatar className="h-12 w-12">
                      {
                        lead.user && lead.user?.image &&
                      <AvatarImage src={lead.user?.image} alt={lead.user.first_name} />
                      }
                      <AvatarFallback>
                        {lead.user?.first_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.user?.first_name} {lead.user?.middle_name ?? ""} {lead.user?.last_name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p>
                      <div className="flex items-center pt-2">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {`${lead.user?.email.split('@')[0].slice(0, 3)}...@${lead.user?.email.split('@')[1]}`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>


        </div>
      </TooltipProvider>

    </>
  )
}

export default marketplace