"use client"

import { ShoppingCartIcon as PayPalIcon, PlusCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table'
import { RiArrowUpDownLine } from "react-icons/ri";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useEffect, useRef, useState } from 'react'
import { Owner, Booking, Subscriptions, PayPal, BankAccount, UPI, Payment } from '@/utils/Types/types'
import { Input } from '@/components/ui/input'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance'
import { uploadFileToS3 } from '@/utils/AWS/FileUpload'
import { useCookie } from 'next-cookie'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Backdrop, CircularProgress } from '@mui/material'
import OwnerShrimmer from '../_components/OwnerShrimmer'
import PaymentSheet from './PaymentSheet'
import { DownloadPDFButton } from './PaymentPDF';
import { addDays } from 'date-fns'
import Image from 'next/image'
import { io, Socket } from 'socket.io-client'

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  // Add more currencies as needed
]

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const OwnerPayment = () => {
  const [ownerDetails, setOwnerDetails] = useState<Owner | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [monthlyRejected, setMonthlyRejected] = useState(0)
  const [subscription, setSubscription] = useState<Subscriptions | null>(null)
  const [subscriptionActive, setSubscriptionActive] = useState<Subscriptions | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [receiverPayments, setReceiverPayments] = useState<Payment[]>([])
  const [senderPayments, setSenderPayments] = useState<Payment[]>([])

  const { cookie } = useCookie()
  const user: user = cookie.get("user")

  const bookingFilters = [
    {
      placeholder: "All",
      value: "all",
    },
    {
      placeholder: "Un paid",
      value: "unpaid",
    },
    {
      placeholder: "Owner review",
      value: "review",
    },
    {
      placeholder: "Rejected",
      value: "rejected",
    },
    {
      placeholder: "Completed",
      value: "completed",
    },
  ]

  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const getSelectedPaymentsAndBookings = () => {
    if (!ownerDetails) {
      return { payments: [], bookings: [] };
    }

    const payments = [...ownerDetails.user.paymentReciever, ...ownerDetails.user.paymentSender]
      .filter(payment => selectedPayments.includes(payment.id));
    const bookings = payments.map(payment =>
      ownerDetails.user.Booking.find(booking => booking.id === payment.booking_id)
    ).filter(Boolean) as Booking[];
    return { payments, bookings };
  };

  function fetchPageDetails() {
    setIsFetching(true)

    renderInstance.get(`/owner/get-owner-payment-page-details/${user.userId}`)
      .then((res) => {
        setOwnerDetails(res.data.ownerDetails)
        setReceiverPayments(res.data.ownerDetails.user.paymentReciever)
        setSenderPayments(res.data.ownerDetails.user.paymentSender)
        setMonthlyRevenue(res.data.monthlyRevenue)
        setMonthlyRejected(res.data.monthlyRejected)
        setSubscription(res.data.subscription)
        setSubscriptionActive(res.data.subscriptionActive)
      }).catch((err) => {
        errorMessage("Error fetching operator lists")
      }).finally(() => {
        setIsFetching(false)
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
    newSocket.on('getUpdatedPayment', (payment: Payment) => {
      setSenderPayments((prevPayments) => {
        const existingPaymentIndex = prevPayments.findIndex((b) => b.id === payment.id);
    
        if (existingPaymentIndex !== -1) {
          // If payment exists, remove the old one and add the new one at the start
          const updatedPayments = prevPayments.filter((b) => b.id !== payment.id);
          return [payment, ...updatedPayments];
        } else {
          // If payment doesn't exist, leave the array as it is
          return prevPayments;
        }
      });
      setReceiverPayments((prevPayments) => {
        const existingPaymentIndex = prevPayments.findIndex((b) => b.id === payment.id);
    
        if (existingPaymentIndex !== -1) {
          // If payment exists, remove the old one and add the new one at the start
          const updatedPayments = prevPayments.filter((b) => b.id !== payment.id);
          return [payment, ...updatedPayments];
        } else {
          // If payment doesn't exist, leave the array as it is
          return prevPayments;
        }
      });
     });

    // Clean up the event listener when the component unmounts
    return () => {
        newSocket.disconnect();
    };
}, []);

  useEffect(() => {
    if (user) {
      fetchPageDetails()
    }
  }, [])

  if (isFetching) return <OwnerShrimmer />

  if (!ownerDetails) return <p>Owner details not present</p>

  return (
    <div>
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/owner">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/owner/payment">Payment</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="bank">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bank">Bank Account</TabsTrigger>
                <TabsTrigger value="paypal">PayPal</TabsTrigger>
                <TabsTrigger value="upi">UPI</TabsTrigger>
              </TabsList>
              <TabsContent value="bank">
                <BankAccountForm setIsAddModalOpen={setIsAddModalOpen} />
              </TabsContent>
              <TabsContent value="paypal">
                <PayPalForm setIsAddModalOpen={setIsAddModalOpen} />
              </TabsContent>
              <TabsContent value="upi">
                <UPIForm setIsAddModalOpen={setIsAddModalOpen} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

      </div>

      {/* Revenue & Profit Section */}
      <div className="mb-8">
        <Card className="w-full ">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 768px:grid-cols-2 1050px:grid-cols-4 gap-6">
              {/* Revenue Section */}
              <div className="border-r border-gray-200 pr-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Revenue this month</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">${monthlyRevenue}</span>
                    {/* <div className="flex items-center text-sm text-emerald-500">
                      <ArrowUpIcon className="h-4 w-4" />
                      <span>+608</span>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Profit Section */}
              {/* <div className="border-r border-gray-200 pr-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Profit this month</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">$3,982</span>
                    <div className="flex items-center text-sm text-emerald-500">
                      <ArrowUpIcon className="h-4 w-4" />
                      <span>+198</span>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Rejected Section */}
              <div className="border-r border-gray-200 pr-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Rejected this month</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">${monthlyRejected}</span>
                    {/* <div className="flex items-center text-sm text-red-500">
                      <ArrowDownIcon className="h-4 w-4" />
                      <span>-15</span>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Operator Pay Section */}
              {/* <div className="space-y-1">
                <p className="text-sm text-gray-500">Operator Pay</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">$1,245</span>
                  <div className="flex items-center text-sm text-emerald-500">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>+50</span>
                  </div>
                </div>
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Plan & Payment Method Section */}
      <div className="grid grid-cols-1 1050px:grid-cols-2 gap-6 mb-8">
        {/* My Plan Section */}
        {
          subscription &&
          <Card className="w-full">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">My Plan</h2>
              <p className="text-gray-600 mb-4">Change your plan based on your needs</p>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span className="font-medium">
                  {subscription.name}
                </span>
                <span className="text-gray-500 text-sm">Billed monthly</span>
              </div>
              <div className="mb-4">
                <span className="text-xl font-semibold">${subscription.actual_cost.toFixed(2)} USD</span>
                <span className="text-gray-500 text-sm ml-2">
                  {subscriptionActive ? `Expires on ${addDays(new Date(subscription.createdAt), subscription.total_days)}` : `Subscription expired.`}
                </span>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Button variant="default">Explore Plans</Button>
                <Button variant="outline">Manage Plans</Button>
              </div>
            </CardContent>
          </Card>
        }

        {/* Payment Method Section */}
        <Card className="w-full">
          <CardContent className="p-6 flex flex-col gap-3 max-h-[300px] overflow-auto" style={{ scrollbarWidth: "none" }}>
            <div className="w-full flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              {
                ((ownerDetails.user.BankAccount.length === 0) && (ownerDetails.user.PayPal.length === 0) && (ownerDetails.user.UPI.length === 0)) &&
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Payment Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
                    <DialogHeader>
                      <DialogTitle>Add Payment Method</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="bank">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="bank">Bank Account</TabsTrigger>
                        <TabsTrigger value="paypal">PayPal</TabsTrigger>
                        <TabsTrigger value="upi">UPI</TabsTrigger>
                      </TabsList>
                      <TabsContent value="bank">
                        <BankAccountForm setIsAddModalOpen={setIsAddModalOpen} />
                      </TabsContent>
                      <TabsContent value="paypal">
                        <PayPalForm setIsAddModalOpen={setIsAddModalOpen} />
                      </TabsContent>
                      <TabsContent value="upi">
                        <UPIForm setIsAddModalOpen={setIsAddModalOpen} />
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              }
            </div>
            {
              ownerDetails.user.PayPal.map((paypal, i) => {
                return (
                  <div className="flex items-center justify-between flex-wrap gap-4 border p-4 rounded-lg" key={i}>
                    <div className="flex items-center flex-wrap gap-4">
                      <PayPalIcon className="h-6 w-6 text-blue-600" />
                      <p>{paypal.email}</p>
                    </div>
                    <PaypalReadOnly email={paypal.email} />
                  </div>
                )
              })
            }
            {
              ownerDetails.user.UPI.map((upi, i) => {
                return (
                  <div className="flex items-center justify-between flex-wrap gap-4 border p-4 rounded-lg" key={i}>
                    <div className="flex items-center flex-wrap gap-4">
                      <PayPalIcon className="h-6 w-6 text-blue-600" />
                      <p>{upi.upi_id}</p>
                    </div>
                    <UPIReadonly upi={upi} />
                  </div>
                )
              })
            }
            {
              ownerDetails.user.BankAccount.map((bankAccount, i) => {
                return (
                  <div className="flex items-center justify-between flex-wrap gap-4 border p-4 rounded-lg" key={i}>
                    <div className="flex items-center flex-wrap gap-4">
                      <PayPalIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <p>{bankAccount.accountNumber}</p>
                        <p className="text-sm text-gray-500">{bankAccount.bankName}</p>
                      </div>
                    </div>
                    <BankAccountReadOnly bankAccount={bankAccount} />
                  </div>
                )
              })
            }
          </CardContent>
        </Card>
      </div>

      {/* Payment History Section */}

      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-xl font-semibold">Payment History ({ownerDetails.user.paymentReciever.length + ownerDetails.user.paymentSender.length})</h2>
          <p className="text-gray-600">See history of your payment plan invoice</p>
        </div>
        <div className="flex items-center gap-2">
        <Select onValueChange={e => setActiveFilter(e)} defaultValue='all'>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            {
              bookingFilters.map((filer, index) => {
                return (
                  <SelectItem key={index} value={filer.value}>
                    {filer.placeholder}
                  </SelectItem>
                )
              })
            }
          </SelectContent>
        </Select>
        <DownloadPDFButton
          payments={[...ownerDetails.user.paymentReciever, ...ownerDetails.user.paymentSender]}
          bookings={[...ownerDetails.user.paymentReciever, ...ownerDetails.user.paymentSender]
            .map(payment =>
              ownerDetails.user.Booking.find(booking => booking.id === payment.booking_id)
            ).filter(Boolean) as Booking[]
          }
          fileName="all_payments.pdf"
          />
          </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="border border-gray-200 rounded-lg">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Input type="checkbox" className="rounded w-4 h-4 accent-primaryColor" />
              </TableHead>
              <TableHead className="font-bold">
                <div className="flex items-center gap-2">
                  Payment Invoice
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="font-bold">
                <div className="flex items-center gap-2">
                  Amount
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="font-bold">
                <div className="flex items-center gap-2">
                  Last modified
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="font-bold">
                <div className="flex items-center gap-2">
                  Status
                  <div className="hover:bg-gray-200 p-1 aspect-square rounded-full">
                    <RiArrowUpDownLine className="h-4 w-4" />
                  </div>
                </div>
              </TableHead>
              <TableHead className="font-bold"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeFilter === "all" && receiverPayments.map((item, index) => {
              return (
                <PaymentSheet index={index} item={item} key={index} />
              )
            })}
            {activeFilter === "unpaid" && senderPayments.filter(po=>(`${po.status}` === "FarmerPENDING")).map((item, index) => {
              return (
                <PaymentSheet index={index} item={item} key={index} />
              )
            })}
            {activeFilter === "review" && senderPayments.filter(po=>(`${po.status}` === "FarmerCONFIRMED")).map((item, index) => {
              return (
                <PaymentSheet index={index} item={item} key={index} />
              )
            })}
            {activeFilter === "rejected" && senderPayments.filter(po=>(`${po.status}` === "OwnerREJECTED")).map((item, index) => {
              return (
                <PaymentSheet index={index} item={item} key={index} />
              )
            })}
            {activeFilter === "completed" && senderPayments.filter(po=>(`${po.status}` === "COMPLETED")).map((item, index) => {
              return (
                <PaymentSheet index={index} item={item} key={index} />
              )
            })}
          </TableBody>
        </Table>
      </div>

    </div>

  )
}

export default OwnerPayment

function BankAccountForm({ setIsAddModalOpen }: { setIsAddModalOpen: (open: boolean) => void }) {

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    iban: '',
    routingNumber: '',
    branchCode: '',
    currency: '',
    country: '',
  })

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")
  const user = cookie.get("user")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    renderInstance.post("/bank-account", { ...formData, ownerId: user.userId }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(() => {
      successMessage("Bank account added")
      setIsAddModalOpen(false)
    }).catch((err) => {
      errorMessage("Error adding bank account")
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}>
        <CircularProgress />
      </Backdrop >
      <Input name="accountHolderName" placeholder="Account Holder Name" onChange={handleChange} required />
      <Input name="bankName" placeholder="Bank Name" onChange={handleChange} required />
      <Input name="accountNumber" placeholder="Account Number" onChange={handleChange} required />
      <Input name="swiftCode" placeholder="SWIFT Code" onChange={handleChange} />
      <Input name="iban" placeholder="IBAN" onChange={handleChange} />
      <Input name="routingNumber" placeholder="Routing Number" onChange={handleChange} />
      <Input name="branchCode" placeholder="Branch Code" onChange={handleChange} />
      <Select onValueChange={(value) => setFormData({ ...formData, currency: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Select Currency" />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="country" placeholder="Country" onChange={handleChange} required />
      <Button type="submit">Add Bank Account</Button>
    </form>
  )
}

function BankAccountReadOnly({ bankAccount }: { bankAccount: BankAccount }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"outline"}>
          View
        </Button>
      </DialogTrigger>
      <DialogContent className='w-fit'>
        <Card>
          <CardContent className='space-y-4 max-w-sm'>
            <Input value={bankAccount.accountHolderName} readOnly />
            <Input value={bankAccount.bankName} readOnly />
            <Input value={bankAccount.accountNumber} readOnly />
            <Input value={bankAccount.swiftCode} readOnly />
            <Input value={bankAccount.iban} readOnly />
            <Input value={bankAccount.routingNumber} readOnly />
            <Input value={bankAccount.branchCode} readOnly />
            <Input value={bankAccount.currency} readOnly />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

function PayPalForm({ setIsAddModalOpen }: { setIsAddModalOpen: (open: boolean) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")
  const user = cookie.get("user")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    renderInstance.post("/paypal", { email }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(() => {
      successMessage("paypal account added")
      setIsAddModalOpen(false)
    }).catch((err) => {
      errorMessage("Error adding bank account")
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}>
        <CircularProgress />
      </Backdrop >
      <Input type="email" placeholder="PayPal Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit">Add PayPal</Button>
    </form>
  )
}

function PaypalReadOnly({ email }: { email: string; }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"outline"}>
          View
        </Button>
      </DialogTrigger>
      <DialogContent className='w-fit'>
        <Card>
          <CardContent className='max-w-sm'>
            <div className='space-y-4'>
              <Input value={email} readOnly />
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

function UPIForm({ setIsAddModalOpen }: { setIsAddModalOpen: (open: boolean) => void }) {
  const [upiId, setUpiId] = useState('')
  const [qrCode, setQrCode] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")
  const user = cookie.get("user")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrCode) {
      errorMessage("Please upload your qr code")
      return
    }
    const imageLink = await uploadFileToS3(Buffer.from(await qrCode.arrayBuffer()), qrCode.name)
    setLoading(true)
    renderInstance.post("/upi", { qr_code: imageLink, upi_id: upiId }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then(() => {
      successMessage("paypal account added")
      setIsAddModalOpen(false)
    }).catch((err) => {
      errorMessage("Error adding bank account")
    }).finally(() => {
      setLoading(false)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQrCode(e.target.files[0])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}>
        <CircularProgress />
      </Backdrop >
      <Input placeholder="UPI ID" value={upiId} onChange={(e) => setUpiId(e.target.value)} required />
      <div className="flex items-center space-x-2">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        <Button type="button" onClick={() => fileInputRef.current?.click()} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          {qrCode ? 'Change QR Code' : 'Upload QR Code'}
        </Button>
      </div>
      {qrCode && <p className="text-sm text-muted-foreground">File selected: {qrCode.name}</p>}
      <Button type="submit">Add UPI</Button>
    </form>
  )
}

function UPIReadonly({ upi }: { upi: UPI }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"outline"}>
          View
        </Button>
      </DialogTrigger>
      <DialogContent className='w-fit'>
        <Card>
          <CardContent className='max-w-sm max-h-[80vh] overflow-auto' style={{ scrollbarWidth: "none" }}>
            <div className='space-y-4'>
              <Input value={upi.upi_id} readOnly />
              <Image alt={upi.upi_id} src={upi.qr_code} width={400} height={400} className='w-full h-auto object-cover' unoptimized={true} />
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}