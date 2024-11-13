"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { Farm } from '@/utils/Types/types'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MapContainer, Polygon, TileLayer } from 'react-leaflet'

interface Location {
    latitude: number | null;
    longitude: number | null;
  }

const SingleFarm = () => {
    const [farm, setFarm] = useState<Farm | null>(null)
    const [fetching, setFetching] = useState(false)
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });

    const { slug } = useParams()

    const limeOptions = { color: 'lime' }

    function fetchFarmer() {
        setFetching(true)
        renderInstance.get(`/farm/${slug}`)
        .then((res)=>{
            setFarm(res.data)
        }).catch(()=>{
            errorMessage("Error fetching farm details")
        }).finally(()=>{
            setFetching(false)
        })
    }

    useEffect(()=>{
        if(slug){
            fetchFarmer()
        }
    },[slug])

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

    if(fetching) return <p>Getting farm details</p>

    if(!farm) return <p>Farm details not available</p>

  return (
    <>
    {error ? (
      <p>Error: {error}</p>
    ) : (location.latitude && location.longitude) ? (
      <MapContainer
        center={farm.boundary.coordinates[0]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100vh", zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polygon pathOptions={limeOptions} positions={farm.boundary.coordinates} />
      </MapContainer>
    ) : (
      <p>Latitude and longitude not available</p>
    )}
  </>
  )
}

export default SingleFarm