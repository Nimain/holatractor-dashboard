'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import Image from 'next/image'
import { X } from 'lucide-react'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { useCookie } from 'next-cookie'
import { CircularProgress } from '@mui/material'
import TranslatedText from '@/components/Menubar/TranslatedText'
import { ownerMarketPlacePaymentTranslations } from '../Marketplace/OwnerMarketplaceBookingTranslations'

type PaymentReviewProps = {
  screenshotUrl: string
  referenceNumber?: string
  paymentId: string
}

export default function PaymentReview({ screenshotUrl, referenceNumber, paymentId }: PaymentReviewProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { cookie } = useCookie()
  const access_token = cookie.get("access_token")

  const handleAccept = () => {
    // Here you would typically send the acceptance to your backend
    setLoading(true)
    renderInstance.patch(`/owner/confirm_payment/${paymentId}`, {}, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((res) => {
        successMessage("Accepted")
        window.location.reload()
      }).catch((err) => {
        if (err.response && err.response.status === 404 && err.response.data.message === "Log in user not found") {
          errorMessage("Log in user not found")
        } else if (err.response && err.response.status === 404 && err.response.data.message === "Payment not found") {
          errorMessage("Payment not found")
        } else if (err.response && err.response.status === 409 && err.response.data.message === "You are not the correct reciever") {
          errorMessage("You are not the correct reciever")
        } else if (err.response && err.response.status === 400 && err.response.data.message === "Farmer has not confirmed this payment") {
          errorMessage("Farmer has not confirmed this payment")
        } else {
          errorMessage("Error in accepting")
        }
      }).finally(() => {
        setLoading(false)
      })
  }

  const handleReject = () => {
    if (rejectionReason.trim() === '') {
      errorMessage('Please provide a reason for rejection')
      return
    }
    // Here you would typically send the rejection to your backend
    setLoading(true)
    renderInstance.patch(`/owner/reject_payment/${paymentId}`, {
      reason: rejectionReason
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then((res) => {
        successMessage("Accepted")
        window.location.reload()
      }).catch(() => {
        errorMessage("Error in accepting")
      }).finally(() => {
        setLoading(false)
      })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
        <TranslatedText greetings={ownerMarketPlacePaymentTranslations.review} />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-auto' style={{ scrollbarWidth: "none" }}>
        <Card>
          <CardHeader>
            <CardTitle><TranslatedText greetings={ownerMarketPlacePaymentTranslations.reviewPaymentProof} /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isFullScreenOpen} onOpenChange={setIsFullScreenOpen}>
              <DialogTrigger asChild>
                <Image
                  src={screenshotUrl}
                  alt="Payment Screenshot"
                  width={400}
                  height={400}
                  className='object-cover rounded m-auto w-[400px] h-[400px]'
                />
              </DialogTrigger>
              <DialogContent className="max-w-full h-full p-0">
                <div className="relative w-full h-full">
                  <Image
                    src={screenshotUrl}
                    alt="Payment Screenshot"
                    layout="fill"
                    objectFit="contain"
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-4 right-4"
                    onClick={() => setIsFullScreenOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {referenceNumber && (
              <p className="text-sm text-muted-foreground">
                <TranslatedText greetings={ownerMarketPlacePaymentTranslations.referenceNumber} />: {referenceNumber}
              </p>
            )}
            {isRejecting && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason"><TranslatedText greetings={ownerMarketPlacePaymentTranslations.reasonForRejection} /></Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection"
                  required
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {isRejecting ? (
                <>
                  <Button variant="outline" onClick={() => setIsRejecting(false)}>
                  <TranslatedText greetings={ownerMarketPlacePaymentTranslations.cancel} />
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={loading}>
                  <TranslatedText greetings={ownerMarketPlacePaymentTranslations.confirmRejection} />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="destructive" onClick={() => setIsRejecting(true)}>
                  <TranslatedText greetings={ownerMarketPlacePaymentTranslations.reject} />
                  </Button>
                  <Button variant="default" onClick={handleAccept} disabled={loading}>
                  <TranslatedText greetings={ownerMarketPlacePaymentTranslations.accept} />
                  </Button>
                </>
              )}
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  )
}