"use client"

import { User, Clock, CheckCircle, MapPin } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Operator, Store } from '@/utils/Types/types'
import { useCookie } from 'next-cookie'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Backdrop, CircularProgress } from '@mui/material'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function OperatorCard({ operator }: { operator: Operator }) {

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={operator.user.image || undefined} alt={`${operator.user.first_name} ${operator.user.last_name}`} />
                    <AvatarFallback>{operator.user.first_name[0]}{operator.user.last_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{operator.user.first_name} {operator.user.last_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Operator ID: {operator.id}</p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="text-green-500" />
                    <span className="font-semibold">{operator.OperatorBookingJob.length} Completed Bookings</span>
                </div>
                <div className="space-y-2">
                    {operator.OperatorBookingJob.slice(0, 3).map((job) => (
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
            <CardFooter>
                <SelectStore id={operator.id} />
            </CardFooter>
        </Card>
    )
}

function SelectStore({id}:{id: string}) {
    const [stores, setStores] = useState<Store[]>([])
    const [fetching, setFetching] = useState(false)

    const { cookie } = useCookie()
    const user = cookie.get("user")

    function fetchOwner() {
        setFetching(true)
        renderInstance.get(`/owner/${user.userId}`)
            .then((res) => {
                setStores(res.data.stores)
            }).catch((err) => {
                errorMessage("Error fetching user detaild")
            }).finally(()=>{setFetching(false)})
    }

    useEffect(()=>{
        if(user){
            fetchOwner()
        }
    },[])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className='w-full'>
                    Select
                </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] overflow-auto grid grid-cols-2 gap-4' style={{ scrollbarWidth: "none" }}>
                {
                    fetching ? <>Getting store lists</> : stores.length === 0 ? <p>No stores available</p> : stores.map((store, i) => {
                        return (
                            <Card className="w-full max-w-md overflow-hidden" key={i}>
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={store.image || '/placeholder.svg?height=192&width=384'}
                                        alt={store.name}
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl font-bold">{store.name}</CardTitle>
                                        {/* <Badge variant="secondary" className="flex items-center">
                                <Star className="h-4 w-4 mr-1 fill-current" />
                                {averageRating.toFixed(1)}
                            </Badge> */}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">{store.description}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>
                                                {new Date(store.opening_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(store.closing_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {store.closing_days.map((day, index) => (
                                                <Badge key={index} variant="outline">{day}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <FillAcceptanceForm id={id} slug={store.id} />
                                </CardFooter>
                            </Card>
                        )
                    })
                }
            </DialogContent>
        </Dialog>
    )
}

function FillAcceptanceForm({id, slug}:{id: string; slug: string;}){
    const [requesting, setRequesting] = useState(false)
    
    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")

    const [formData, setFormData] = useState({
        field1: '',
        field2: '',
        field3: '',
        textArea: ''
      })

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
      }

      function handleRequest(id: string, slug: string) {
        if(!formData.field1 || !formData.field2 || !formData.field3 || !formData.textArea){
            errorMessage("All fields are required")
            return
        }
        
          setRequesting(true)
          renderInstance.patch(`/store/requestToAddOperator/${slug}/${id}`, {
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
              successMessage("Requested")
              window.location.reload()
          }).catch((err) => {
              if (err.response && err.response.status === 404 && err.response.data.message === "Store not found") {
                  errorMessage("Store not found")
              } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                  errorMessage("Operator not found")
              } else if (err.response && err.response.status === 409 && err.response.data.message === "You are not allowed for this task") {
                  errorMessage("You are not allowed for this task")
              } else if (err.response && err.response.status === 409 && err.response.data.message === "You are already in this store") {
                  errorMessage("Operator is already in this store")
              } else {
                  errorMessage("Error in requesting")
              }
          }).finally(() => {
              setRequesting(false)
          })
      }

    return(
        <Dialog>
            <DialogTrigger asChild>
                <Button className='w-full'>
                    Select
                </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] overflow-auto w-fit h-fit' style={{ scrollbarWidth: "none" }}>
            <Card className='w-[600px]'>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="field1">Cost per job</Label>
                                <Input
                                    id="field1"
                                    name="field1"
                                    type="number"
                                    placeholder="Enter a number"
                                    value={formData.field1}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="field2">Cost per hour</Label>
                                <Input
                                    id="field2"
                                    name="field2"
                                    type="number"
                                    placeholder="Enter a number"
                                    value={formData.field2}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="field3">Cost per month</Label>
                                <Input
                                    id="field3"
                                    name="field3"
                                    type="number"
                                    placeholder="Enter a number"
                                    value={formData.field3}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="textArea">Message</Label>
                                <Textarea
                                    id="textArea"
                                    name="textArea"
                                    placeholder="Enter your text here"
                                    value={formData.textArea}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className='w-full' onClick={()=>{handleRequest(id, slug)}}>
                            {
                                requesting ? <CircularProgress /> : "Request"
                            }
                        </Button>
                    </CardFooter>
                </Card>
            </DialogContent>
            <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={requesting}>

                    <CircularProgress />

                </Backdrop >
        </Dialog>
    )
}