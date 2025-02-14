"use client"

import TranslatedText from '@/components/Menubar/TranslatedText'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NestJsBaseURL, renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { OperatorAddStoreReuests } from '@/utils/Types/types'
import { CheckCircle, Clock, DollarSign, MessageCircle } from 'lucide-react'
import { useCookie } from 'next-cookie'
import React, { useState } from 'react'
import { operatorWorkPageTranslations } from '../../Operator/WorkSection/WorkPageTranslations'
import { useOperatorsRequestToJoinStoreContext } from '@/components/wrappers/OperatorsRequestToJoinStoreProvider'

const OperatorRequests = ({ requests }: { requests: OperatorAddStoreReuests[]; }) => {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

    const { fetchAllOperatorRequests, fetching } = useOperatorsRequestToJoinStoreContext()

    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const handleAccept = (request: OperatorAddStoreReuests) => {
        setLoadingStates((prev) => ({ ...prev, [request.id]: true }))
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
        }).then(async () => {
            fetchAllOperatorRequests()
            successMessage("Congratulations")
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
            setLoadingStates((prev) => ({ ...prev, [request.id]: false }))
        })
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                <TranslatedText greetings={operatorWorkPageTranslations.newRequests} /> {requests.length}
                </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] overflow-auto' style={{ scrollbarWidth: "none" }}>
                <div className='w-full grid grid-cols-2'>
                    {
                        requests.map((requset, index) => {
                            return (
                                <Card className="w-full max-w-md" key={index}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarImage src={requset.operator.user.image || undefined} alt={`${requset.operator.user.first_name} ${requset.operator.user.last_name}`} />
                                            <AvatarFallback>{requset.operator.user.first_name[0]}{requset.operator.user.last_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle>{requset.operator.user.first_name} {requset.operator.user.last_name}</CardTitle>
                                            <p className="text-sm text-muted-foreground"><TranslatedText greetings={operatorWorkPageTranslations.operator} /> ID: {requset.operator_id}</p>
                                        </div>
                                        <p><TranslatedText greetings={operatorWorkPageTranslations.storeName} />: {requset.store.name}</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="text-green-500" />
                                            <span className="font-semibold">{requset.operator.OperatorBookingJob.length} <TranslatedText greetings={operatorWorkPageTranslations.jobsCompleted} /></span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="text-green-500" />
                                            <span className="font-semibold"><TranslatedText greetings={operatorWorkPageTranslations.costPerHour} />: {requset.cost_per_hour}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="text-green-500" />
                                            <span className="font-semibold"><TranslatedText greetings={operatorWorkPageTranslations.costPerJob} />: {requset.cost_per_job}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="text-green-500" />
                                            <span className="font-semibold"><TranslatedText greetings={operatorWorkPageTranslations.costPerMonth} />: {requset.cost_per_month}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <MessageCircle className="text-green-500" />
                                            <span className="font-semibold"><TranslatedText greetings={operatorWorkPageTranslations.message} />: {requset.note}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {requset.operator.OperatorBookingJob.slice(0, 3).map((job) => (
                                                <div key={job.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="text-muted-foreground" size={16} />
                                                        <span className="text-sm">{new Date(job.booking.start_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <Badge variant="outline">
                                                        ${job.booking.total_cost.toFixed(2)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end space-x-2 mt-4">
                                        <FillAcceptanceForm id={requset.id} />
                                        <Button onClick={() => {handleAccept(requset)}} disabled={loadingStates[requset.id] && fetching}>
                                            {(loadingStates[requset.id] || fetching) ? <TranslatedText greetings={operatorWorkPageTranslations.accepting} /> : <TranslatedText greetings={operatorWorkPageTranslations.accept} />}
                                        </Button>
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

export default OperatorRequests

function FillAcceptanceForm({id}:{id: string;}){
    const [open, setOpen] = useState(false)
    const [requesting, setRequesting] = useState(false)
    
    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const [formData, setFormData] = useState({
        field1: '',
        field2: '',
        field3: '',
        textArea: ''
      })

      const { fetchAllOperatorRequests } = useOperatorsRequestToJoinStoreContext()

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
      }

      function handleRequest(id: string) {
        if(!formData.field1 || !formData.field2 || !formData.field3 || !formData.textArea){
            errorMessage("All fields are required")
            return
        }
        
          setRequesting(true)
          renderInstance.patch(`/owner/rejectAddStoreRequest/${id}`, {
            cost_per_job: formData.field1,
            cost_per_hour: formData.field2,
            cost_per_month: formData.field3,
            note: formData.textArea
          }, {
              headers: {
                  Authorization: `Bearer ${access_token}`,
              }
          }).then((res) => {
              // Logic to fetch all request
              fetchAllOperatorRequests()
              successMessage("Requested")
              setOpen(false)
          }).catch((err) => {
              if (err.response && err.response.status && err.response.data.message) {
                  errorMessage(err.response.data.message)
              }  else {
                  errorMessage("Error in requesting")
              }
          }).finally(() => {
              setRequesting(false)
          })
      }

    return(
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={"outline"}>
                <TranslatedText greetings={operatorWorkPageTranslations.negotiate} />
                </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] overflow-auto w-fit h-fit' style={{ scrollbarWidth: "none" }}>
            <Card className='w-[600px]'>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="field1"><TranslatedText greetings={operatorWorkPageTranslations.costPerJob} /></Label>
                                <Input
                                    id="field1"
                                    name="field1"
                                    type="number"
                                    placeholder="Enter your amount..."
                                    value={formData.field1}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="field2"><TranslatedText greetings={operatorWorkPageTranslations.costPerHour} /></Label>
                                <Input
                                    id="field2"
                                    name="field2"
                                    type="number"
                                    placeholder="Enter your amount..."
                                    value={formData.field2}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="field3"><TranslatedText greetings={operatorWorkPageTranslations.costPerMonth} /></Label>
                                <Input
                                    id="field3"
                                    name="field3"
                                    type="number"
                                    placeholder="Enter your amount..."
                                    value={formData.field3}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="textArea"><TranslatedText greetings={operatorWorkPageTranslations.message} /></Label>
                                <Textarea
                                    id="textArea"
                                    name="textArea"
                                    placeholder="Enter your message here"
                                    value={formData.textArea}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                        disabled={requesting}
                            className='w-full' onClick={()=>{handleRequest(id)}}>
                            {
                                requesting ? <TranslatedText greetings={operatorWorkPageTranslations.submitting} /> : <TranslatedText greetings={operatorWorkPageTranslations.submit} />
                            }
                        </Button>
                    </CardFooter>
                </Card>
            </DialogContent>
        </Dialog>
    )
}