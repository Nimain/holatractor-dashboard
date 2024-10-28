"use client"

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage } from "@/utils/Toastify/Messages";
import { Dealer } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { useEffect, useState } from "react";
import { Store, PhoneCall, BarChart2, Package, Tractor } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 4500 },
  { name: 'May', sales: 6000 },
  { name: 'Jun', sales: 5500 },
]

const storeList = [
  { id: 1, name: 'Main Street Store', address: '123 Main St, Anytown, USA' },
  { id: 2, name: 'Downtown Branch', address: '456 Oak Ave, Metropolis, USA' },
  { id: 3, name: 'Suburban Outlet', address: '789 Pine Rd, Suburbville, USA' },
]

const DealerDashboardPage = () => {
  const [dealer, setDealer] = useState<Dealer | null>(null)
  const [fetchingDealerDetails, setFetchingDealerDetails] = useState(false)

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  function fetchDealer() {
    setFetchingDealerDetails(true)

    renderInstance.get(`/dealer/${user.userId}`)
      .then((res) => {
        setDealer(res.data.dealer)
      }).catch((err) => {
        if (err.response && err.response.status === 404 && err.response.data.message === "Dealer not found") {
          errorMessage("Dealer not found")
        } else {
          errorMessage("Error fetching user detaild")
        }
      }).finally(() => {
        setFetchingDealerDetails(false)
      })
  }

  useEffect(() => {
    if (user) {
      fetchDealer()
    }
  }, [])

  if (fetchingDealerDetails) return <p>Loading dealer details</p>

  if (!user) return <p>user not found</p>

  return (
    <main className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeList.length}</div>
              <p className="text-xs text-muted-foreground">+1 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tractors</CardTitle>
              <Tractor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">145</div>
              <p className="text-xs text-muted-foreground">+15 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attachments</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">287</div>
              <p className="text-xs text-muted-foreground">+29 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34</div>
              <p className="text-xs text-muted-foreground">+5 from last week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  sales: {
                    label: "Sales",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" name="Sales" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>You are currently on the Pro plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <BarChart2 className="h-8 w-8 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">$29.99/month</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <div className="w-full">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Usage</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="mt-2" />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button className="w-full">Upgrade Plan</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
  )
}

export default DealerDashboardPage