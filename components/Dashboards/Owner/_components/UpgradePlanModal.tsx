"use client"

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Subscriptions } from '@/utils/Types/types'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { useCookie } from 'next-cookie'
import { Check, Loader2, Sparkles, Store, Tractor, Wrench } from 'lucide-react'

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [plans, setPlans] = useState<Subscriptions[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [purchasingId, setPurchasingId] = useState<string | null>(null)

  const { cookie } = useCookie()
  const access_token = cookie.get('access_token')

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionPlans()
    }
  }, [isOpen])

  const fetchSubscriptionPlans = async () => {
    setLoading(true)
    try {
      const res = await renderInstance.get('/subscription')
      if (res.status === 200 && Array.isArray(res.data)) {
        // Filter plans meant for owners or general
        const ownerPlans = res.data.filter(
          (plan: Subscriptions) => plan.for_owner !== false
        )
        setPlans(ownerPlans.length > 0 ? ownerPlans : res.data)
      }
    } catch (err: any) {
      console.error('Error fetching subscription plans:', err)
      errorMessage('Failed to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: Subscriptions) => {
    if (!access_token) {
      errorMessage('User session expired. Please log in again.')
      return
    }

    setPurchasingId(plan.id)
    try {
      const res = await renderInstance.post(
        `/subscription/owner_purchase/${plan.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )

      if (res.status === 200 || res.status === 201) {
        successMessage(`Successfully upgraded to ${plan.name} plan!`)
        if (onSuccess) onSuccess()
        onClose()
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upgrade subscription plan'
      errorMessage(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setPurchasingId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        <DialogHeader className="text-center pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Upgrade Your Subscription Plan
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Unlock additional stores, tractors, attachments, and premium platform features.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <p className="text-sm text-gray-500 font-medium">Loading subscription plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No subscription plans available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {plans.map((plan) => {
              const isPurchasing = purchasingId === plan.id
              const hasDiscount = plan.actual_cost > plan.discount_cost

              return (
                <Card
                  key={plan.id}
                  className="flex flex-col justify-between border border-gray-200 dark:border-zinc-800 hover:border-green-500 dark:hover:border-green-500 transition-all duration-200 hover:shadow-lg rounded-xl overflow-hidden bg-gray-50/50 dark:bg-zinc-900/50"
                >
                  <div>
                    <CardHeader className="pb-4 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                          {plan.type || 'Standard'}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          {plan.total_days} Days
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </CardTitle>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                          ${plan.discount_cost}
                        </span>
                        {hasDiscount && (
                          <span className="ml-2 text-sm font-medium text-gray-400 line-through">
                            ${plan.actual_cost}
                          </span>
                        )}
                        <span className="ml-1 text-xs text-gray-500">USD</span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-4">
                      {/* Limit Badges */}
                      <div className="grid grid-cols-3 gap-2 py-2 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800">
                        <div className="flex flex-col items-center text-center">
                          <Store className="h-4 w-4 text-green-600 mb-1" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {plan.total_stores ?? 'Unlimited'}
                          </span>
                          <span className="text-[10px] text-gray-400">Stores</span>
                        </div>
                        <div className="flex flex-col items-center text-center border-x border-gray-100 dark:border-zinc-800">
                          <Tractor className="h-4 w-4 text-green-600 mb-1" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {plan.total_tractors ?? 'Unlimited'}
                          </span>
                          <span className="text-[10px] text-gray-400">Tractors</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                          <Wrench className="h-4 w-4 text-green-600 mb-1" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {plan.total_attachments ?? 'Unlimited'}
                          </span>
                          <span className="text-[10px] text-gray-400">Attachments</span>
                        </div>
                      </div>

                      {/* Features List */}
                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Included Features</p>
                          <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <Check className="h-3.5 w-3.5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  <CardFooter className="pt-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <Button
                      onClick={() => handleUpgrade(plan)}
                      disabled={isPurchasing || !!purchasingId}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default UpgradePlanModal
