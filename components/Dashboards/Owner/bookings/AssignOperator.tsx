"use client"

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { OperatorInStore, Store } from '@/utils/Types/types'
import { CircularProgress } from '@mui/material';
import { useCookie } from 'next-cookie';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import RequestOperators from '../_components/RequestOperators';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, FileText, Mail, Phone } from 'lucide-react';
import TranslatedText from '@/components/Menubar/TranslatedText';
import { ownerBookingsTranslation } from './OwnerBookingsTranslations';

const AssignOperator = ({ selectedRequest, storeId }: { selectedRequest: string; storeId?: string | null; }) => {

    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [fetchingOperators, setFetchingOperators] = useState(false)
    const [allOperators, setAllOperators] = useState<OperatorInStore[]>([])
    const [assigning, setAssigning] = useState(false)

    const [allRequests, setAllRequests] = useState<string[]>([])

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const handleAssign = (operatorId: string) => {
        setAssigning(true)
        renderInstance.patch(`/booking/${selectedRequest}/${operatorId}/request_operator`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        }).then((res) => {
            successMessage("Operator assigned")
            setIsAssignOpen(false)
        }).catch((err) => {
            if (err.response && err.response.status === 404 && err.response.data.message === "Booking is not valid") {
                errorMessage("Log in user not found")
            } else if (err.response && err.response.status === 400) {
                if (err.response.data.message === "This booking is not Open now") {
                    errorMessage("This booking is not Open now")
                } else if (err.response.data.message === "You are not allowed to perform this task") {
                    errorMessage("You are not allowed to perform this task")
                } else if (err.response.data.message === "Operator not found") {
                    errorMessage("Operator not found")
                } else if (err.response.data.message === "This operator is not present in this store") {
                    errorMessage("This operator is not present in this store")
                } else if (err.response.data.message === "You already request to this user") {
                    errorMessage("You have already request to this user")
                } else if (err.response.data.message === "User has not confirmed the booking") {
                    errorMessage("User has not confirmed the booking")
                } else if (err.response.data.message === "Owner has not confirmed the booking") {
                    errorMessage("Owner has not confirmed the booking")
                } else if (err.response.data.message === "Booking status has changed") {
                    errorMessage("Booking status has changed")
                }
            } else {
                errorMessage("Some error occurred while assigning")
            }
        }).finally(() => {
            setAssigning(false)
        })
    }

    function handleFetchAllOperators() {
        setFetchingOperators(true)
        renderInstance.get(`/operator/getOperatorsByStoreId/${storeId}`)
            .then((res) => {
                setAllOperators(res.data)
            }).catch((err) => {
                errorMessage("Some error occurred in fetching operators")
            }).finally(() => {
                setFetchingOperators(false)
            })
    }

    function handleFetchAllOperatorsRequests() {
        setFetchingOperators(true)
        renderInstance.get(`/store/all_operator_requests/${selectedRequest}`)
            .then((res) => {
                setAllRequests(res.data)
            }).catch((err) => {
                errorMessage("Some error occurred in fetching operators")
            }).finally(() => {
                setFetchingOperators(false)
            })
    }

    useEffect(() => {
        handleFetchAllOperators()
    }, [])

    useEffect(() => {
        handleFetchAllOperatorsRequests()
    }, [])

    return (
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogTrigger asChild>
                <Button
                    className="w-full mt-6"
                    onClick={() => {
                        setIsAssignOpen(true)
                    }}
                >
                    <TranslatedText greetings={ownerBookingsTranslation.assignOperator} />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle><TranslatedText greetings={ownerBookingsTranslation.assignOperator} /></DialogTitle>
                </DialogHeader>
                {
                    fetchingOperators ?
                        <p><TranslatedText greetings={ownerBookingsTranslation.fetchingOperators} /></p>
                        :
                        allOperators.length === 0 ?
                            <div
                                className="w-fill h-[50vh] flex items-center justify-center flex-col gap-5">
                                <p><TranslatedText greetings={ownerBookingsTranslation.noOperatorsAvailable} /></p>
                                {/* <RequestOperators store={store} /> */}
                            </div>
                            :
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[90vh] overflow-auto" style={{ scrollbarWidth: "none" }}>
                                {allOperators.map((operator: OperatorInStore) => {
                                    return (
                                        <Card className="w-full max-w-md" key={operator.id}>
                                            <CardHeader>
                                                <div className="flex items-center space-x-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={operator.operator.user.image || ''} alt={`${operator.operator.user.first_name} ${operator.operator.user.last_name}`} />
                                                        <AvatarFallback>{operator.operator.user.first_name[0]}{operator.operator.user.last_name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle>{operator.operator.user.first_name} {operator.operator.user.middle_name ?? ""} {operator.operator.user.last_name}</CardTitle>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="flex items-center">
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    <span className="text-sm">{operator.operator.user.email}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    <span className="text-sm">{operator.operator.user.mobile}</span>
                                                </div>
                                                {operator.operator.OperatorBookingJob.length > 0 && (
                                                    <div className="flex items-center">
                                                        <Briefcase className="mr-2 h-4 w-4" />
                                                        <span className="text-sm"><TranslatedText greetings={ownerBookingsTranslation.stores} />: {operator.operator.OperatorBookingJob.length}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                            <CardFooter>
                                                <Button className="w-full" disabled={assigning || allRequests.includes(operator.operator_id)} onClick={() => { handleAssign(operator.operator_id) }}>
                                                    {
                                                        assigning ? <TranslatedText greetings={ownerBookingsTranslation.assigning} /> : allRequests.includes(operator.operator_id) ? "Requested" : <TranslatedText greetings={ownerBookingsTranslation.assign} />
                                                    }
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                }
            </DialogContent>
        </Dialog>
    )
}

export default AssignOperator