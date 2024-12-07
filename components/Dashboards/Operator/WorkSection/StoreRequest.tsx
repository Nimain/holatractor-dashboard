"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { OperatorAddStoreReuests } from '@/utils/Types/types'
import { Clock, DollarSign, Hand, Calendar, MessageCircle, User, Store } from 'lucide-react'
import { useCookie } from 'next-cookie'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import RejectionForm from './RejectionForm'
import TranslatedText from '@/components/Menubar/TranslatedText'
import { operatorWorkPageTranslations } from './WorkPageTranslations'

interface user {
    userId: string;
    image: string;
    name: string;
    email: string;
}

const StoreRequest = () => {
    const [fetchingRequests, setFetchingRequests] = useState(false)
    const [allRequests, setAllRequests] = useState<OperatorAddStoreReuests[]>([])

    const [selectedRequest, setSelectedRequest] = useState<OperatorAddStoreReuests | null>(null)

    const [loading, setLoading] = useState(false)

    const { cookie } = useCookie()
    const user: user = cookie.get("user")
    const access_token = cookie.get("access_token")

    function fetchRequests() {
        setFetchingRequests(true)
        renderInstance.get(`/operator/getAllAddRequestByOperatorId/${user.userId}`)
            .then((res) => { setAllRequests(res.data) })
            .catch((err) => { errorMessage("Error in fetching requests") })
            .finally(() => { setFetchingRequests(false) })
    }

    const handleAccept = (request: OperatorAddStoreReuests) => {

        setLoading(true)
        renderInstance.post('/operator/addOperatorToStore', {
            operator_id: request.operator_id,
            store_id: request.store_id,
            cost_per_job: request.cost_per_job,
            cost_per_hour: request.cost_per_hour,
            cost_per_month: request.cost_per_month,
            note: request.note,
            status: "Active",
            request_id: request.id
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        }).then(() => {
            successMessage("Congratulations")
            window.location.reload()
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "User is not found") {
                errorMessage("User not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Request not found") {
                errorMessage("Request not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                errorMessage("Operator not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Store not found") {
                errorMessage("Store not found")
            } else if (err.response && err.response.status === 400 && err.response.data.message === "The operator and store hasn't make any request") {
                errorMessage("The operator and store hasn't make any request")
            } else {
                errorMessage("Some error occurred")
            }
        }).finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        if (user) {
            fetchRequests()
        }
    }, [])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="px-4 py-2 bg-white border rounded-lg shadow-sm flex items-center gap-2">
                    <Hand className="h-4 w-4" />
                    Requests
                </button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] overflow-auto' style={{ scrollbarWidth: "none" }}>

                <div className='w-full grid grid-cols-2'>
                    {
                        fetchingRequests ? <div><TranslatedText greetings={operatorWorkPageTranslations.loading} />...</div> : allRequests.length === 0 ? <div><TranslatedText greetings={operatorWorkPageTranslations.noRequestsAvailable} /></div> : allRequests.map((request, index) => {
                            const storeOwnerName = `${request.store.owner.user.first_name} ${request.store.owner.user.middle_name ?? ""} ${request.store.owner.user.last_name}`
                            return (
                                <Card key={request.id}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{request.store.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm">
                                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span><TranslatedText greetings={operatorWorkPageTranslations.owner} />: {storeOwnerName}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span><TranslatedText greetings={operatorWorkPageTranslations.costPerHour} />: ${request.cost_per_hour}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span><TranslatedText greetings={operatorWorkPageTranslations.costPerJob} />: ${request.cost_per_job}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span><TranslatedText greetings={operatorWorkPageTranslations.costPerMonth} />: ${request.cost_per_month}</span>
                                            </div>
                                            {
                                                request.note &&
                                                <div className="flex items-center text-sm">
                                                    <MessageCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                                                    <span><TranslatedText greetings={operatorWorkPageTranslations.message} />: {request.note}</span>
                                                </div>
                                            }
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" onClick={() => setSelectedRequest(request)}>
                                                    <TranslatedText greetings={operatorWorkPageTranslations.viewDetails} />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle><TranslatedText greetings={operatorWorkPageTranslations.requestDetails} /></DialogTitle>
                                                </DialogHeader>
                                                {selectedRequest && (
                                                    <div className="mt-4 space-y-4">
                                                        <div className="relative h-48 w-full rounded-lg overflow-hidden">
                                                            <Image
                                                                src={selectedRequest.store.image || '/placeholder.svg?height=192&width=384'}
                                                                alt={selectedRequest.store.name}
                                                                layout="fill"
                                                                objectFit="cover"
                                                            />
                                                        </div>
                                                        <h3 className="text-lg font-semibold">{selectedRequest.store.name}</h3>
                                                        {selectedRequest.store.description && (
                                                            <div>
                                                                <p className="text-sm">{selectedRequest.store.description}</p>
                                                            </div>
                                                        )}
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex items-center">
                                                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                <span>
                                                                    {new Date(selectedRequest.store.opening_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                                    {new Date(selectedRequest.store.closing_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                <span>
                                                                <TranslatedText greetings={operatorWorkPageTranslations.totalOperators} />: {selectedRequest.store.OperatorInStore.length}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                <span>
                                                                <TranslatedText greetings={operatorWorkPageTranslations.totalBookings} />: {selectedRequest.store.Booking.length}
                                                                </span>
                                                            </div>
                                                            {
                                                                selectedRequest.store.closing_days.length !== 0 &&
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                    <span>
                                                                    <TranslatedText greetings={operatorWorkPageTranslations.closesOn} /> - {selectedRequest.store.closing_days.map((day) => (<span key={day}>{day}</span>))}
                                                                    </span>
                                                                </div>
                                                            }
                                                        </div>
                                                        <div className="flex justify-end space-x-2 mt-4">
                                                            <RejectionForm request={selectedRequest} />
                                                            <Button onClick={() => handleAccept(selectedRequest)} disabled={loading}>
                                                                {
                                                                    loading ? <TranslatedText greetings={operatorWorkPageTranslations.accepting} /> : <TranslatedText greetings={operatorWorkPageTranslations.accept} />
                                                                }
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                        {/* {request.status === 'pending' && (
                                        <div className="space-x-2">
                                            <Button variant="outline" onClick={() => handleReject(request)}>Reject</Button>
                                            <Button onClick={() => handleAccept(request)}>Accept</Button>
                                        </div>
                                    )} */}
                                    </CardFooter>
                                </Card>
                            )
                        })
                    }
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default StoreRequest