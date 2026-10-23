'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { uploadFileToS3 } from '@/utils/AWS/FileUpload'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { useCookie } from 'next-cookie'
import { CircularProgress } from '@mui/material'

export default function PaymentUpload({ paymentId }: { paymentId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [screenshot, setScreenshot] = useState<File | null>(null)
    const [referenceNumber, setReferenceNumber] = useState('')

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Here you would typically send the data to your backend
        if (!screenshot) {
            errorMessage("Upload the payment screenshot or image")
            return
        }
        setLoading(true)
        const buffer = Buffer.from(await screenshot.arrayBuffer());
        const imageLink = await uploadFileToS3(buffer, screenshot.name)

        renderInstance.patch(`/farmer/payment_confirm/${paymentId}`, {
            ref_no: referenceNumber,
            screenshots: [imageLink]
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("Payment details submitted")
            window.location.reload()
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "Log in user not found") {
                errorMessage("Log in user not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Farmer not found") {
                errorMessage("Farmer not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Payment not found") {
                errorMessage("Payment not found")
            } else if (err.response && err.response.status === 409 && err.response.data.message === "You are not allowed for this task") {
                errorMessage("You are not allowed for this task")
            } else {
                errorMessage("Error in submitting payment proofs")
            }
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Upload payment proof</Button>
            </DialogTrigger>
            <DialogContent>
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Payment Proof</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="screenshot">Payment Screenshot</Label>
                                <Input
                                    id="screenshot"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
                                <Input
                                    id="referenceNumber"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    placeholder="Enter reference number"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                                <Upload className="mr-2 h-4 w-4" />
                                {
                                    loading ?
                                        <CircularProgress />
                                        :
                                        "Submit Payment Proof"
                                }
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </DialogContent>
        </Dialog>
    )
}