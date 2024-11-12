"use client"

import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet'
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { EditControl } from "react-leaflet-draw";
import { useState, useEffect } from "react"

interface Location {
  latitude: number | null;
  longitude: number | null;
}

interface FarmMap {
  layerType: string;
  _latlngs: Location[]
}

const FarmBooking = () => {
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });
  const [farmMap, setFarmMap] = useState<FarmMap | null>(null)

  const _created = (e: any) => {
    setFarmMap(e)
  }

  console.log(farmMap)

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
        <MapContainer center={[location.latitude, location.longitude]} zoom={13} scrollWheelZoom={false} style={{ width: "100%", height: "100vh" }}>
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
    </>
  )
}

export default FarmBooking