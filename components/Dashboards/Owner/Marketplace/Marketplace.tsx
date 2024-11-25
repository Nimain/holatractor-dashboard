"use client"

import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FiChevronRight, FiMail, FiPhone, FiMoreVertical } from 'react-icons/fi';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, User, Briefcase, DollarSign, ChevronRight, MoreHorizontal, Plus, MessageCircle, NotepadText, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


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

const marketplace = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false)
  const [currentLead, setCurrentLead] = useState(null);

  const toggleDialog = () => {
    setIsOpen(!isOpen);
  };

  const columns: Column[] = [
    {
      id: 1,
      title: "New",
      statusColor: "bg-blue-500",
      leads: [
        {
          id: 1,
          name: "Darlene Robertson",
          email: "darlenekrobertson@mail.com",
          phone: "(891) 252-4969",
          time: "Today at 09:30 AM",
          avatar: "/avatar1.png",
        },
        {
          id: 2,
          name: "Kristin Watson",
          email: "kristine@mail.com",
          phone: "(758) 371-8990",
          time: "Today at 10:08 AM",
          avatar: "/avatar2.png",
        },
        {
          id: 3,
          name: "Annette Black",
          email: "annette@fikri.studio",
          phone: "(886) 293-6223",
          time: "Today at 11:00 AM",
          avatar: "/avatar3.png",
        },
        {
          id: 4,
          name: "Jerome Bell",
          email: "jeromeb@mail.com",
          phone: "(873) 614-4635",
          time: "Today at 09:12 AM",
        },
      ],
    },
    {
      id: 2,
      title: "Open",
      statusColor: "bg-purple-500",
      leads: [
        {
          id: 1,
          name: "Wade Warren",
          email: "wade@acme.com",
          phone: "(415) 430-7093",
          time: "Today at 01:30 PM",
          avatar: "/avatar4.png",
        },
        {
          id: 2,
          name: "Marvin McKinney",
          email: "marvinmckinney@mail.com",
          phone: "(587) 448-9915",
          time: "Today at 02:07 PM",
          avatar: "/avatar5.png",
        },
        {
          id: 3,
          name: "Jenny Wilson",
          email: "jennywilson@mail.com",
          phone: "(276) 881-1656",
          time: "Today at 02:30 PM",
          avatar: "/avatar6.png",
        },
      ],
    },
    {
      id: 3,
      title: "In Progress",
      statusColor: "bg-green-500",
      leads: [
        {
          id: 1,
          name: "Arlene McCoy",
          email: "emailkuyahut@gmail.com",
          phone: "(582) 574-6016",
          time: "Today at 09:02 AM",
          avatar: "/avatar7.png",
        },
        {
          id: 2,
          name: "Dianne Russell",
          email: "diannerussell@acme.com",
          phone: "(534) 396-3870",
          time: "Today at 03:12 PM",
          avatar: "/avatar8.png",
        },
        {
          id: 3,
          name: "Jacob Jones",
          email: "jacobjones@mail.com",
          phone: "(843) 651-4727",
          time: "Today at 04:30 PM",
          avatar: "/avatar9.png",
        },
      ],
    }, {
      id: 4,
      title: "close",
      statusColor: "bg-red-500",
      leads: [
        {
          id: 1,
          name: "Arlene McCoy",
          email: "emailkuyahut@gmail.com",
          phone: "(582) 574-6016",
          time: "Today at 09:02 AM",
          avatar: "/avatar7.png",
        },
        {
          id: 2,
          name: "Dianne Russell",
          email: "diannerussell@acme.com",
          phone: "(534) 396-3870",
          time: "Today at 03:12 PM",
          avatar: "/avatar8.png",
        },
        {
          id: 3,
          name: "Jacob Jones",
          email: "jacobjones@mail.com",
          phone: "(843) 651-4727",
          time: "Today at 04:30 PM",
          avatar: "/avatar9.png",
        },
      ],
    },
  ];

  const stats = [
    {
      title: "INCOME",
      value: "$53,765",
      change: "10.5%",
      isPositive: true,
      description: "vs last month",
    },
    {
      title: "AVG. SALES",
      value: "$16,459",
      change: "6.2%",
      isPositive: true,
      description: "vs last month",
    },
    {
      title: "BOOKINGS",
      value: "22,451",
      change: "0.7%",
      isPositive: false,
      description: "vs last month",
    },
    {
      title: "LEADS",
      value: "516K",
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
                  <p className="text-xs text-muted-foreground">
                    <span className={stat.isPositive ? "text-green-600" : "text-red-600"}>
                      {stat.isPositive ? "▲" : "▼"} {stat.change}
                    </span>
                    {" "}
                    {stat.description}
                  </p>
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
                    {columns[0].leads.length} Leads
                  </span>
                </CardHeader>
              </Card>
              {columns[0].leads.map((lead) => (
                <Card key={lead.id} className="overflow-hidden bg-white shadow-sm rounded-md mt-3">
                  <CardContent className="flex items-center space-x-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={lead.avatar} alt={lead.name} />
                      <AvatarFallback>
                        {lead.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.time}</p>
                      <div className="flex items-center pt-2">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {`${lead.email.split('@')[0].slice(0, 3)}...@${lead.email.split('@')[1]}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{`${lead.phone.slice(0, 3)}-XXX-XXXX)`}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                    {columns[1].leads.length} Leads
                  </span>
                </CardHeader>
              </Card>
              {columns[1].leads.map((lead) => (
                <Card key={lead.id} className="overflow-hidden bg-white shadow-sm rounded-md mt-3">
                  <CardContent className="flex items-center space-x-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={lead.avatar} alt={lead.name} />
                      <AvatarFallback>
                        {lead.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.time}</p>
                      <div className="flex items-center pt-2">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {`${lead.email.split('@')[0].slice(0, 3)}...@${lead.email.split('@')[1]}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{`${lead.phone.slice(0, 3)}-XXX-XXXX)`}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                    {columns[2].leads.length} Leads
                  </span>
                </CardHeader>
              </Card>
              {columns[2].leads.map((lead) => (
                <Card key={lead.id} className="overflow-hidden bg-white shadow-sm rounded-md mt-3">
                  <CardContent className="flex items-center space-x-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={lead.avatar} alt={lead.name} />
                      <AvatarFallback>
                        {lead.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.time}</p>
                      <div className="flex items-center pt-2">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {`${lead.email.split('@')[0].slice(0, 3)}...@${lead.email.split('@')[1]}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{`${lead.phone.slice(0, 3)}-XXX-XXXX)`}</span>
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
                    {columns[3].leads.length} Leads
                  </span>
                </CardHeader>
              </Card>
              {columns[3].leads.map((lead) => (
                <Card key={lead.id} className="overflow-hidden bg-white shadow-sm rounded-md mt-3">
                  <CardContent className="flex items-center space-x-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={lead.avatar} alt={lead.name} />
                      <AvatarFallback>
                        {lead.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.time}</p>
                      <div className="flex items-center pt-2">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {`${lead.email.split('@')[0].slice(0, 3)}...@${lead.email.split('@')[1]}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{`${lead.phone.slice(0, 3)}-XXX-XXXX)`}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>


        </div>
      </TooltipProvider>

      <Sheet open={open} onOpenChange={setOpen}>

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

    </>
  )
}

export default marketplace