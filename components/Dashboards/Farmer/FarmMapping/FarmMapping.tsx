"use client"

import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet'
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { EditControl } from "react-leaflet-draw";
import { useState, useEffect } from "react"
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { CircularProgress } from '@mui/material';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { Button } from '@/components/ui/button';
import { useCookie } from 'next-cookie';

interface Location {
  latitude: number | null;
  longitude: number | null;
}

interface user {
  userId: string;
  image: string;
  name: string;
  email: string;
}

const FarmBooking = () => {
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
  const [layerType, setLayerType] = useState("")
  const [coordinates, setCoordinates] = useState<Location[]>([])
  const [open, setOpen] = useState(false)

  const [farmName, setFarmName] = useState("")
  const [farmDescription, setFarmDescription] = useState("")

  const [adding, setAdding] = useState(false)

  const { cookie } = useCookie()
  const user: user = cookie.get("user")
  const access_token = cookie.get("access_token")

  const _created = (e: any) => {
    setLayerType(e.layerType)
    setCoordinates(e.layer._latlngs)
    setOpen(true)
  }

  function handleAddFarm() {
    if (!layerType || coordinates.length === 0) {
      errorMessage("Please check the area again")
      return
    }
    if (!farmName) {
      errorMessage("Please give the farm name")
      return
    }

    setAdding(true)
    renderInstance.post("/farm", {
      owner_id: user.userId,
      type: layerType,
      name: farmName,
      boundary: {
        coordinates: [coordinates]
      }
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    }).then(()=>{
      successMessage("Farm added")
    }).catch((err)=>{
      if (err.response && err.response.status === 404 && err.response.data.message === "Booking is not valid") {
        errorMessage("Booking is not valid")
    } else if (err.response && err.response.status === 400 && err.response.data.message === "Booking already confirm") {
        successMessage("Successfully booked")
    } else if (err.response && err.response.status === 400 && err.response.data.message === "You are not allowed to perform this task") {
        successMessage("You are not allowed to perform this task")
    } else {
        errorMessage("Some error occurred. Please try again...")
    }
    }).finally(()=>{setAdding(false)})
  }

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
    <>
      {error ? (
        <p>Error: {error}</p>
      ) : (location.latitude && location.longitude) ? (
        <MapContainer 
        center={[location.latitude, location.longitude]} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ width: "100%", height: "100vh", zIndex: 1 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={_created}
              draw={
                {
                  // rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                }
              }
            />
          </FeatureGroup>
        </MapContainer>
      ) : (
        <p>Latitude and longitude not available</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-fit h-fit">

          <Card className="w-full max-w-sm">
            <CardHeader>
              Give ffarm details
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Farm name</Label>
                <Input
                  value={farmName}
                  onChange={e => { setFarmName(e.target.value) }}
                  required={true} />
              </div>
              <div className="space-y-4">
                <Label>Farm descriiption</Label>
                <Textarea
                  value={farmDescription}
                  onChange={e => { setFarmDescription(e.target.value) }}
                  className="resize-none" />
              </div>
              <Separator />
            </CardContent>
            <CardFooter>
              <Button onClick={() => { handleAddFarm() }}>
                {adding && <CircularProgress />}
                Save
              </Button>
            </CardFooter>
          </Card>

        </DialogContent>
      </Dialog>
    </>
  )
}

export default FarmBooking