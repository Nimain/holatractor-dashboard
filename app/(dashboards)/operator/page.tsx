"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Operator } from '@/utils/Types/types'
import { MapPinIcon } from 'lucide-react'
import { useCookie } from 'next-cookie'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const OperatorDashboardPage = () => {

    const [operator, setOperator] = useState<Operator | null>(null)
    const [fetchingOperatorDetails, setFetchingOperatorDetails] = useState(false)
  
    const { cookie } = useCookie()
    const user = cookie.get("user")
  
    function fetchOperator(){
      setFetchingOperatorDetails(true)
  
      renderInstance.get(`/operator/getOperator/${user.userId}`)
      .then((res)=>{
        setOperator(res.data.details)
      }).catch((err)=>{
        errorMessage("Error fetching user detaild")
      }).finally(()=>{
        setFetchingOperatorDetails(false)
      })
    }
  
    useEffect(()=>{
      if(user){
        fetchOperator()
      }
    },[])
  
    if(fetchingOperatorDetails) return <p>Loading operator details</p>
    if(!operator) return <p>Operator details not present</p>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Avatar className="h-20 w-20 mr-4">
            {
              user.image &&
            <AvatarImage src={user.image} alt={`${user.name}`} />
            }
            <AvatarFallback>{user.name[0]}{user.name[1]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
        <Button asChild>
          <Link href={`/operator/${operator.id}`}>Bookings</Link>
        </Button>
        </div>
      </div>
    </div>
  )
}

export default OperatorDashboardPage