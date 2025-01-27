'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BadgeCheck, Building2, Check, Clock, Download, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from 'next/image'
import {PaymentTab} from './PaymentTab'
interface TractorRental {
  id: number
  userId: string
  tractorNameModel: string
  startDate: string
  duration: string
  cost: number
  paymentStatus: 'Paid' | 'Pending' | 'Overdue'
  status: 'Active' | 'Completed' | 'Cancelled'
}
interface RentalDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  rental: TractorRental | null
}
export function RentalDetailsModal({ isOpen, onClose, rental }: RentalDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [showSignDialog, setShowSignDialog] = useState(false)
  useEffect(() => {
    console.log('Active tab:', activeTab)
  }, [activeTab])
  if (!rental) return null
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contact">Contract</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          <TabsContent value="contact" className="bg-white rounded-lg">
            <div className="space-y-8">
              {/* Header Section */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">B2B · VLGROUP/Arlene/1/2023</h2>
                  <div className="flex items-center space-x-4 mt-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>AM</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Contract for</p>
                      <p className="font-medium">Arlene McCoy</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">Draft</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">Review and Sign</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px] p-6">
                      <DialogHeader>
                        <DialogTitle>Signing Contract</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">On behalf on</span>
                            </div>
                            <p className="font-medium">VirtusLab Sp. z o. o.</p>
                            <Input 
                              placeholder="Representative name" 
                              className="mt-2" 
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">On behalf on</span>
                            </div>
                            <p className="font-medium">Arlene Design Ltd</p>
                            <Input 
                              placeholder="Representative name" 
                              defaultValue="Arlene McCoy" 
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                            Agree and Sign
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowSignDialog(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Contract Time Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Contract Time</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium mt-1">February 24, 2023</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected End Date</p>
                    <p className="text-muted-foreground mt-1">Not Filled</p>
                  </div>
                </div>
              </div>
              <Separator />
              {/* Parties Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Parties</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Promisor</p>
                    </div>
                    <div>
                      <p className="font-medium">VirtusLab Sp. z o. o.</p>
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <p>ul. Zofii Natkowskie 23</p>
                        <p>35-211 Rzeszów</p>
                        <p>PODKARPACKIE, PL</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Promisee</p>
                    </div>
                    <div>
                      <p className="font-medium">Arlene Design Ltd</p>
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <p>ul. Armii Krajowej 13</p>
                        <p>00-00 Warszawa</p>
                        <p>MAZOWIECKIE, PL</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              {/* Bank Accounts Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Bank Accounts</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Sender Bank Account</p>
                    <div className="space-y-2">
                      <p className="font-mono font-medium">PL44 1234 4412 0000 0012 1241</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">PLN</Badge>
                        <Badge variant="secondary">Default</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Receiver Bank Account</p>
                    <div className="space-y-2">
                      <p className="font-mono font-medium">PL34 3313 4141 0000 2231 4412</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">PLN</Badge>
                        <div className="flex items-center space-x-1 text-emerald-600">
                          <BadgeCheck className="h-4 w-4" />
                          <span className="text-sm">Verified in the White list</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="details">
            <div className="space-y-2">
              <p><strong>Tractor:</strong> {rental.tractorNameModel}</p>
              <p><strong>Start Date:</strong> {rental.startDate}</p>
              <p><strong>Duration:</strong> {rental.duration}</p>
              <p><strong>Status:</strong> {rental.status}</p>
            </div>
          </TabsContent>
          <TabsContent value="payment">
            <PaymentTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}