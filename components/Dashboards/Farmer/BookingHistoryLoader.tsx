import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function FarmerBookingHistoryShimmer() {
  const tabsList = [
    "All", "Booked", "Arriving", "Started", "Unpaid", "Review", "Completed", "Rejected"
  ]

  return (
    <div className="my-10 animate-in fade-in duration-500 p-10 rounded-md border-2">
      <h1 className="text-3xl font-bold mb-6 text-center">Booking History</h1>
      <Tabs defaultValue="all">
        <TabsList className="space-x-2 bg-transparent mb-4">
          {tabsList.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase()}
              className="relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-white focus-visible:ring-blue-500"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div
            className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="w-full max-w-sm min-w-sm flex-shrink-0">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white shadow-md"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}