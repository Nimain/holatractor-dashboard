'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, QrCode, PlusCircle, Upload, Currency } from 'lucide-react'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { useCookie } from 'next-cookie'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { BankAccount, PayPal, TransactionMethod, UPI } from '@/utils/Types/types'
import { uploadFileToS3 } from '@/utils/AWS/FileUpload'
import { CircularProgress } from '@mui/material'

const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    // Add more currencies as needed
]

export default function PaymentMethods({ bookingId }: { bookingId: string }) {
    const [open, setOpen] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [confirming, setConfirming] = useState(false)

    const [fetchingBankAccounts, setFetchingBankAccounts] = useState(false)
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

    const [fetchingPaypalAccounts, setFetchingPaypalAccounts] = useState(false)
    const [paypalAccounts, setPaypalAccounts] = useState<PayPal[]>([])

    const [fetchingUPIAccounts, setFetchingUPIAccounts] = useState(false)
    const [UPIAccounts, setUPIAccounts] = useState<UPI[]>([])

    const [allBankIds, setAllBankIds] = useState<string[]>([])
    const [allPaypalIds, setallPaypalIds] = useState<string[]>([])
    const [allUPIIds, setallUPIIds] = useState<string[]>([])

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")


    function fetchBankAccounts() {
        setFetchingBankAccounts(true)
        renderInstance.get(`/bank-account`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            setBankAccounts(res.data)
            const bankIds = res.data.map((bank: BankAccount) => bank.id)
            setAllBankIds(bankIds)
        }).catch((err) => {
            errorMessage("Error fetching bank accounts")
        }).finally(() => {
            setFetchingBankAccounts(false)
        })
    }

    function fetchPaypalAccounts() {
        setFetchingPaypalAccounts(true)
        renderInstance.get(`/paypal`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            setPaypalAccounts(res.data)
            const paypalIds = res.data.map((bank: PayPal) => bank.id)
            setallPaypalIds(paypalIds)
        }).catch((err) => {
            errorMessage("Error fetching paypal accounts")
        }).finally(() => {
            setFetchingPaypalAccounts(false)
        })
    }

    function fetchUPIAccounts() {
        setFetchingUPIAccounts(true)
        renderInstance.get(`/upi`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            setUPIAccounts(res.data)
            const UPIIds = res.data.map((bank: UPI) => bank.id)
            setallUPIIds(UPIIds)
        }).catch((err) => {
            errorMessage("Error fetching UPI accounts")
        }).finally(() => {
            setFetchingUPIAccounts(false)
        })
    }

    const handleAccept = (id: string) => {
        if (!selectedMethod) {
            errorMessage("Pleasen select a payment method")
            return
        }
        let isPaypal = allPaypalIds.includes(selectedMethod) ? selectedMethod : ""
        let isBank = allBankIds.includes(selectedMethod) ? selectedMethod : ""
        let isUpi = allUPIIds.includes(selectedMethod) ? selectedMethod : ""
        if (!isPaypal && !isBank && !isUpi) {
            errorMessage("Please select an account")
            return
        }
        setConfirming(true)
        // Implement accept logic here
        const ownerConfirmBodyData = {
            TransactionMethod: isBank ? "Bank" : isPaypal ? "PayPal" : isUpi && "UPI",
            bank_account_id: isBank,
            paypal_id: isPaypal,
            upi_id: isUpi,
        }
        renderInstance.patch(`/booking/${id}/owner_confirm`, {
            ...ownerConfirmBodyData
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("Thank you for confirming. Now assign an operator")
        }).catch((err) => {
            if (err.response && err.response.status === 404) {
                if(err.response.data.message === "Booking is not valid"){
                    errorMessage("Booking is not valid")
                } else if(err.response.data.message === "Bank account not found"){
                    errorMessage("Bank account not found")
                } else if(err.response.data.message === "Paypal details not found"){
                    errorMessage("Paypal details not found")
                } else if(err.response.data.message === "UPI details not found"){
                    errorMessage("UPI details not found")
                }
            } else if (err.response && err.response.status === 400) {
                if(err.response.data.message === "User has not confirmed the booking. Wait till user booked"){
                    errorMessage("User has not confirmed the booking. Wait till user booked")
                } else if(err.response.data.message === "You are not allowed to perform this task"){
                    errorMessage("You are not allowed to perform this task")
                } else if(err.response.data.message === "Bank details not found"){
                    errorMessage("Bank details not found")
                }
            } else {
                errorMessage("Some error occurred")
            }
        }).finally(() => {
            setConfirming(false)
        })
    }

    useEffect(() => {
        fetchBankAccounts()
        fetchPaypalAccounts()
        fetchUPIAccounts()
    }, [isAddModalOpen])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    Accept
                </Button>
            </DialogTrigger>
            <DialogContent>
                {
                    fetchingBankAccounts ? <p>Fetching bank accounts</p> :
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Payment Methods</h2>
                                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Payment Method
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
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

                            {(bankAccounts.length === 0 && paypalAccounts.length === 0 && UPIAccounts.length === 0) ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>No Payment Methods</CardTitle>
                                        <CardDescription>You haven't added any payment methods yet.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">Click the "Add Payment Method" button above to get started.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Select Payment Method</CardTitle>
                                        <CardDescription>Choose how you want to receive payments</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <RadioGroup value={selectedMethod || ''} onValueChange={setSelectedMethod}>
                                            {
                                                fetchingBankAccounts ? <p>Fetching bank accounts</p>
                                                    :
                                                    bankAccounts.map((method) => (
                                                        <div key={method.id} className="flex items-center space-x-2 mb-4">
                                                            <RadioGroupItem value={method.id} id={method.id} />
                                                            <Label htmlFor={method.id} className="flex items-center">
                                                                <Currency className="w-4 h-4 mr-2" />
                                                                <span className="capitalize">Bank account: xxxxx{method.accountNumber.slice(-6)}</span>
                                                            </Label>
                                                        </div>
                                                    ))
                                            }
                                            {
                                                fetchingPaypalAccounts ? <p>Fetching paypal account</p>
                                                    :
                                                    paypalAccounts.map((method) => (
                                                        <div key={method.id} className="flex items-center space-x-2 mb-4">
                                                            <RadioGroupItem value={method.id} id={method.id} />
                                                            <Label htmlFor={method.id} className="flex items-center">
                                                                <CreditCard className="w-4 h-4 mr-2" />
                                                                <span className="capitalize">Paypal account: xxxxx{method.email.slice(-6)}</span>
                                                            </Label>
                                                        </div>
                                                    ))
                                            }
                                            {
                                                fetchingUPIAccounts ? <p>Fetching UPI accounts</p>
                                                    :
                                                    UPIAccounts.map((method) => (
                                                        <div key={method.id} className="flex items-center space-x-2 mb-4">
                                                            <RadioGroupItem value={method.id} id={method.id} />
                                                            <Label htmlFor={method.id} className="flex items-center">
                                                                {/* {method.type === 'paypal' && <CreditCard className="w-4 h-4 mr-2" />} */}
                                                                <QrCode className="w-4 h-4 mr-2" />
                                                                <span className="capitalize">UPI account: xxxxx{method.upi_id.slice(-6)}</span>
                                                            </Label>
                                                        </div>
                                                    ))
                                            }
                                        </RadioGroup>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => { handleAccept(bookingId) }}>
                                            {
                                                confirming ?
                                                    <CircularProgress />
                                                    :
                                                    "Accept booking"
                                            }
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                }
            </DialogContent>
        </Dialog>
    )
}

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
            if (err.response && err.response.status === 404){
                if(err.response.data.message === "Log in user not found"){
                    errorMessage("Log in user not found")
                } 
            } else if (err.response && err.response.status === 409){
                if(err.response.data.message === "You can't add someone else's account"){
                    errorMessage("You can't add someone else's account")
                } 
            } else {
                errorMessage("Error adding bank account")
            }
        }).finally(() => {
            setLoading(false)
        })
    }

    if (loading) return <p>Adding your details</p>

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            if (err.response && err.response.status === 404){
                if(err.response.data.message === "Log in user not found"){
                    errorMessage("Log in user not found")
                } 
            } else if (err.response && err.response.status === 409){
                if(err.response.data.message === "You can't add someone else's account"){
                    errorMessage("You can't add someone else's account")
                } 
            } else {
                errorMessage("Error adding paypal account")
            }
        }).finally(() => {
            setLoading(false)
        })
    }

    if (loading) return <p>Adding your details</p>

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="PayPal Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit">Add PayPal</Button>
        </form>
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
            if (err.response && err.response.status === 404){
                if(err.response.data.message === "Log in user not found"){
                    errorMessage("Log in user not found")
                } 
            } else if (err.response && err.response.status === 409){
                if(err.response.data.message === "You can't add someone else's account"){
                    errorMessage("You can't add someone else's account")
                } 
            } else {
                errorMessage("Error adding paypal account")
            }
        }).finally(() => {
            setLoading(false)
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setQrCode(e.target.files[0])
        }
    }

    if (loading) return <p>Adding your details</p>

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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