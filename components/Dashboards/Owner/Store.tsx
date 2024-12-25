"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Calendar } from 'lucide-react'
import { Store } from '@/utils/Types/types'
import { useCookie } from 'next-cookie'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'

export default function StoresPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const [stores, setStores] = useState<Store[]>([])
  const [fetchingStores, setFetchingStores] = useState(false)

  const { cookie } = useCookie()
  const user = cookie.get("user")
  const access_token = cookie.get("access_token")

  function fetchStores(){
    setFetchingStores(true)

    renderInstance.get(`/store`,{headers: {
      Authorization: `Bearer ${access_token}`,
    }})
    .then((res)=>{
      setStores(res.data)
    }).catch((err)=>{
      errorMessage("Error fetching user detaild")
    }).finally(()=>{
      setFetchingStores(false)
    })
  }

  useEffect(()=>{
    if(user) {
        fetchStores()
    }
  },[])

  if(fetchingStores) return <p>Fetching store lists</p>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Available Stores</h1>
      <Input
        type="text"
        placeholder="Search stores..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.filter(store=>store.owner.user_id === user.userId).length === 0 ? 
        <p>
          No stores found for this owner
        </p>
        :
        stores.filter(store=>store.owner.user_id === user.userId).map((store) => (
          <Card key={store.id} className={`${store.owner.user_id === user.userId ? "flex" : "none"} flex-col`}>
            <CardHeader>
              <CardTitle>{store.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="aspect-video relative mb-4">
                <Image
                  src={store.image || 'https://wallpapercave.com/wp/wp13077902.jpg'}
                  alt={store.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">{store.description}</p>
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">
                {new Date(store.opening_time).toLocaleTimeString()} - {new Date(store.closing_time).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  Closed on: {store.closing_days.join(', ')}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/owner/stores/${store.id}`}>Continue</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}