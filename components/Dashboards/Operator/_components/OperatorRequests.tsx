"use client"

import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { OperatorAddStoreReuests } from '@/utils/Types/types'
import { CircularProgress } from '@mui/material'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import AcceptanceForm from './AcceptForm'

const OperatorRequests = () => {
    const [fetchingRequests, setFetchingRequests] = useState(false)
    const [allRequests, setAllRequests] = useState<OperatorAddStoreReuests[]>([])

    const { slug } = useParams()

    function fetchRequests(){
        setFetchingRequests(true)
        renderInstance.get(`/operator/getAllAddRequestByOperatorId/${slug}`)
        .then((res)=>{ setAllRequests(res.data) })
        .catch((err)=>{ errorMessage("Error in fetching requests") })
        .finally(()=>{ setFetchingRequests(false) })
    }

    useEffect(()=>{
        if(slug){
            fetchRequests()
        }
    },[slug])

  return (
    <Dialog>
        <DialogTrigger asChild>
            <Button>
                Store requests
            </Button>
        </DialogTrigger>
        <DialogContent>
        {
                fetchingRequests ? <p>Getting all the requests</p>
                :
                allRequests.length === 0 ? <p>No requests present</p>
                  :
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {allRequests
                        .map((request) => {
                            const ownerUser = request.store?.owner?.user || request.store?.agentOwner?.user;
                            const title = ownerUser
                              ? `${ownerUser.first_name || ""} ${ownerUser.middle_name ?? ""} ${ownerUser.last_name || ""}`.replace(/\s+/g, " ").trim()
                              : (request.store?.name || "Store Owner");
                            return (
                              <Card key={request.id} className="drop-shadow-md">
                                <CardHeader>
                                  <CardTitle>{title}</CardTitle>
                                </CardHeader>
                              <CardFooter className="flex justify-end space-x-2">
                                <AcceptanceForm id={request.id} store_id={request.store_id} />
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

export default OperatorRequests