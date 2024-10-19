"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage, successMessage } from '@/utils/Toastify/Messages'
import { Operator } from '@/utils/Types/types'
import { CircularProgress } from '@mui/material'
import { useCookie } from 'next-cookie'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const RequestOperators = () => {

    const [open, setOpen] = useState(false)
    const [fetchingOperators, setFetchingOperators] = useState(false)
    const [allOperators, setAllOperators] = useState<Operator[]>([])

    const[requesting, setRequesting] = useState(false)

    const { slug } = useParams()

    const { cookie } = useCookie()
    const user = cookie.get("user")
    const access_token = cookie.get("access_token")

    function handleRequest(id: string){
        setRequesting(true)
        renderInstance.patch(`/store/requestToAddOperator/${slug}/${id}`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
              }
        }).then(()=>{
            // Logic to fetch all request
            successMessage("Requested")
        }).catch((err)=>{
            if (err.response && err.response.status === 404 && err.response.data.message === "Store not found") {
                errorMessage("Store not found")
            } else if (err.response && err.response.status === 404 && err.response.data.message === "Operator not found") {
                errorMessage("Operator not found")
            } else if (err.response && err.response.status === 409 && err.response.data.message === "You are not allowed for this task") {
                errorMessage("You are not allowed for this task")
            } else if (err.response && err.response.status === 409 && err.response.data.message === "You are already in this store") {
                errorMessage("You are already in this store")
            } else {
                errorMessage("Error in requesting")
            }
        }).finally(()=>{
            setRequesting(false)
        })
    }

    function fetchOperators(){
        setFetchingOperators(true)
        renderInstance.get('/operator')
        .then((res)=>{
            setAllOperators(res.data)
        }).catch((err)=>{
            errorMessage("Error in fetching operators")
        }).finally(()=>{
            setFetchingOperators(false)
        })
    }

    useEffect(()=>{
        fetchOperators()
    },[])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    Add an operator
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Operator</DialogTitle>
                </DialogHeader>
                {
                    fetchingOperators ? <p>Loading...</p> : allOperators.length === 0 ? <p>No operators present</p> :
                        allOperators.map((operator, index) => {
                            return (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle>{`${operator.user.first_name} ${operator.user.middle_name ?? ""} ${operator.user.last_name}`}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {
                                            operator.user.image &&
                                            <Image
                                                src={operator.user.image}
                                                alt={`${operator.user.first_name} ${operator.user.middle_name ?? ""} ${operator.user.last_name}`}
                                                className="w-24 h-24 rounded-full mx-auto"
                                                width={200}
                                                height={200}
                                            />
                                        }
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            onClick={() => handleRequest(operator.id)}
                                        >
                                            {
                                                requesting ? <CircularProgress /> : "Request"
                                            }
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })
                }
            </DialogContent>
        </Dialog>
    )
}

export default RequestOperators