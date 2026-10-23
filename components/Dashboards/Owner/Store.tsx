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
import { getAuthUserId } from '@/utils/auth/clientAuth'
import { errorMessage } from '@/utils/Toastify/Messages'

export default function StoresPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const [stores, setStores] = useState<Store[]>([])
  const [fetchingStores, setFetchingStores] = useState(false)

  const { cookie } = useCookie()
  const rawUser = cookie.get("user")
  const parsedUser = typeof rawUser === "string" ? (() => { try { return JSON.parse(rawUser); } catch { return null; } })() : rawUser
  const user = parsedUser || {}
  const currentUserId = user?.userId || getAuthUserId()
  const access_token = cookie.get("access_token")

  function fetchStores() {
    setFetchingStores(true);

    const loadStores = async () => {
      const targetId = currentUserId || getAuthUserId();
      // 1. Fetch stores filtered by this owner ID
      try {
        const apiUrl = targetId ? `/api/store?owner_id=${encodeURIComponent(targetId)}` : `/api/store`;
        const localRes = await fetch(apiUrl);
        if (localRes.ok) {
          const localData = await localRes.json();
          if (Array.isArray(localData)) {
            setStores(localData);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed fetching /api/store, falling back to backend:", e);
      }

      // 2. Fallback to renderInstance endpoints with owner ID
      try {
        const endpoint = targetId ? `/owner/stores/${targetId}` : `/owner/stores`;
        const res = await renderInstance.get(endpoint, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const data = res.data?.data || res.data?.stores || res.data;
        const list = Array.isArray(data) ? data : [];
        setStores(list);
      } catch (err) {
        console.error("Error fetching stores from renderInstance:", err);
        setStores([]);
      }
    };

    loadStores().finally(() => {
      setFetchingStores(false);
    });
  }

  useEffect(() => {
    fetchStores();
  }, [currentUserId]);

  if (fetchingStores) return <p>Fetching store lists</p>;

  const ownerStores = stores;

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
        {ownerStores.length === 0 ? 
        <p>
          No stores found for this owner
        </p>
        :
        ownerStores.map((store) => (
          <Card key={store.id} className="flex flex-col">
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