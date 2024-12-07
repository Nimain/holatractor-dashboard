"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import { Store } from '@/utils/Types/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OwnerShrimmer from '../../Owner/_components/OwnerShrimmer';
import TranslatedText from '@/components/Menubar/TranslatedText';
import { storePageTranslations } from '../../Farmer/Stores/StoreTranslations';

interface Location {
  latitude: number | null;
  longitude: number | null;
}

interface DistanceStore {
  store: Store,
  distance: number,
  cheapestEquipment: number | null,
  mostExpensiveEquipment: number | null
}

const Stores = () => {
  const [stores, setStores] = useState<DistanceStore[]>([])
  const [fetching, setFetching] = useState(true)

  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
  const [error, setError] = useState<string | null>(null);

  function getAllStores() {
    if(location.latitude && location.longitude){
      setFetching(true)
      renderInstance.get(`/store/all_stores/with_in_distance?lat=${location.latitude}&lng=${location.longitude}&radius=80`)
      .then(res=>{
        setStores(res.data)
      }).catch((err)=>{
        errorMessage("Error fetching stores")
      }).finally(()=>{
        setFetching(false)
      })
    }
  }

  useEffect(()=>{
    getAllStores()
  },[location])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error: GeolocationPositionError) => {
          setError(error.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold text-gray-900">
          <TranslatedText greetings={storePageTranslations.farmStore} />
          </h1>
          <span className="text-2xl text-gray-500">
            {stores.length}
          </span>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center">
            <span className="text-gray-600"><TranslatedText greetings={storePageTranslations.allStores} /></span>
          </div>
          <button className="p-2 bg-green-50 rounded-full">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {
        fetching ? Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse bg-gray-300 rounded-lg shadow-sm w-full h-48" />
        ))
        :
        stores.map((center, index) => (
           <Link
           href={`/operator/stores/${center.store.id}`}
           key={index}
           className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
         >
           <div className="relative">
             <Image
               src={center.store.image}
               alt={center.store.name}
               width={400}
               height={250}
               className="w-full h-48 object-cover"
               placeholder="blur"
               blurDataURL="https://chehalisfarmstore.com/wp-content/uploads/2023/06/The-Farm-Store-sq.jpg"
             />
             {/* <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded-lg shadow-sm">
               <span className="font-medium">⬥ {center.rating}</span>
             </div> */}
           </div>

           <div className="p-4">
             <div className="flex justify-between items-start mb-2">
               <div>
                 <h3 className="font-medium text-lg text-gray-900">{center.store.name}</h3>
                 <div className="flex items-center gap-2 text-gray-500">
                   <div className="text-xl font-semibold text-gray-900">
               ${center.cheapestEquipment ? `${center.cheapestEquipment}` : "0"} - ${center.mostExpensiveEquipment ? center.mostExpensiveEquipment : "0"}
             </div>
                 </div>
               </div>
               <span className="text-gray-500 text-sm">{center.distance}Km</span>
             </div>

             
           </div>
         </Link>
        ))}
      </div>
    </div>
  );
}

export default Stores