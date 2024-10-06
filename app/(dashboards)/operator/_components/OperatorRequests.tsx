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
            <Button asChild>
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
                          return (
                            <Card key={request.id} className="drop-shadow-md">
                              <CardHeader>
                                <CardTitle>{request.store.owner ? `${request.store.owner.user.first_name} ${request.store.owner.user.middle_name ?? ""} ${request.store.owner.user.last_name}` : `${request.store.agentOwner.user.first_name} ${request.store.agentOwner.user.middle_name ?? ""} ${request.store.agentOwner.user.last_name}`}</CardTitle>
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