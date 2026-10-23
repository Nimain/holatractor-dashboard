"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface PurchaseCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  minPurchaseAmount: number
  initialAmount?: number
  onPurchase: (amount: number) => void
}

export function PurchaseCreditsModal({
  open,
  onOpenChange,
  title,
  description,
  minPurchaseAmount,
  initialAmount = 0,
  onPurchase,
}: PurchaseCreditsModalProps) {
  const [amount, setAmount] = React.useState<number>(initialAmount)

  React.useEffect(() => {
    if (!open) {
      setAmount(initialAmount) // Reset amount when modal closes
    }
  }, [open, initialAmount])

  const handleQuickAdd = (value: number) => {
    setAmount((prev) => prev + value)
  }

  const handlePurchaseClick = () => {
    if (amount < minPurchaseAmount) {
      // You might want to use a toast message here
      alert(`Minimum purchase of $${minPurchaseAmount} Credits is allowed`)
      return
    }
    onPurchase(amount)
    onOpenChange(false) // Close modal after purchase
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-lg shadow-lg bg-[#A10A0C] text-white border-none max-h-[90vh] w-[90vw]">
        <DialogHeader className="relative p-6 bg-white text-black">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <p className="text-sm leading-relaxed">{description}</p>

          <div className="bg-white p-6 rounded-lg space-y-4">
            <div>
              <Label htmlFor="amount" className="block text-sm font-semibold text-gray-800">
                Enter Amount
              </Label>
              <p className="text-xs text-gray-600 mb-2">Minimum Purchase of ${minPurchaseAmount} Credits is allowed</p>
              <Input
                id="amount"
                type="number"
                placeholder={`$${minPurchaseAmount}`}
                value={amount === 0 ? "" : amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[250, 350, 450, 550].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  className="bg-red-600 text-white border-red-700 hover:bg-red-700 hover:text-white"
                  onClick={() => handleQuickAdd(val)}
                >
                  + ${val}
                </Button>
              ))}
            </div>
            <Button
              onClick={handlePurchaseClick}
              className="w-full bg-[#F76A1E] hover:bg-[#E65A0D] text-white font-semibold py-3 rounded-lg"
            >
              Purchase Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
