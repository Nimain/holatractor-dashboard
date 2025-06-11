"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Clock, Battery, Wifi, WifiOff, Truck, RefreshCw, Navigation } from "lucide-react"
import type { Device } from "./Device"

interface DeviceMapModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device | null
  language?: "en" | "es"
}

interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

export function DeviceMapModal({ open, onOpenChange, device, language = "en" }: DeviceMapModalProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  const translations = {
    en: {
      title: "Current Location",
      gettingLocation: "Getting Your Location...",
      locationError: "Unable to get location",
      tryAgain: "Try Again",
      yourLocation: "Your Current Location",
      accuracy: "Accuracy:",
      refreshLocation: "Refresh Location",
      online: "Online",
      offline: "Offline",
      lastSeen: "Last seen:",
      battery: "Battery",
      hourlyRate: "Hourly Rate:",
      startTracking: "Start Tracking",
      viewDetails: "View Details",
      model: "Model:",
      imei: "IMEI:",
    },
    es: {
      title: "Ubicación Actual",
      gettingLocation: "Obteniendo Tu Ubicación...",
      locationError: "No se pudo obtener la ubicación",
      tryAgain: "Intentar de Nuevo",
      yourLocation: "Tu Ubicación Actual",
      accuracy: "Precisión:",
      refreshLocation: "Actualizar Ubicación",
      online: "En línea",
      offline: "Desconectado",
      lastSeen: "Visto por última vez:",
      battery: "Batería",
      hourlyRate: "Tarifa por Hora:",
      startTracking: "Iniciar Seguimiento",
      viewDetails: "Ver Detalles",
      model: "Modelo:",
      imei: "IMEI:",
    },
  }

  const t = translations[language]

  useEffect(() => {
    if (open) {
      getCurrentLocation()
    }
  }, [open])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported")
      return
    }

    setLocationLoading(true)

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation({ latitude, longitude, accuracy })
        setLocationLoading(false)
        setMapLoaded(true)
      },
      (error) => {
        console.error("Error getting location:", error)
        setLocationLoading(false)

        // Try with lower accuracy
        const lowAccuracyOptions = {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 30000,
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords
            setUserLocation({ latitude, longitude, accuracy })
            setMapLoaded(true)
          },
          (error) => {
            console.error("Low accuracy location also failed:", error)
          },
          lowAccuracyOptions,
        )
      },
      options,
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return language === "es" ? "Ahora mismo" : "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getAccuracyText = (accuracy?: number) => {
    if (!accuracy) return ""
    if (accuracy < 10) return "Very High"
    if (accuracy < 50) return "High"
    if (accuracy < 100) return "Medium"
    return "Low"
  }

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return "text-muted-foreground"
    if (accuracy < 10) return "text-green-600"
    if (accuracy < 50) return "text-yellow-600"
    if (accuracy < 100) return "text-orange-600"
    return "text-red-600"
  }

  if (!device) return null

  const isOnline = device.base.status === 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {device.tractorInStore.baseTractor?.name} - {device.tractorInStore.baseTractor?.model}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Map Section */}
          <Card>
            <CardContent className="p-0">
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                {locationLoading ? (
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t.gettingLocation}</p>
                  </div>
                ) : userLocation ? (
                  <div className="w-full h-full relative">
                    {/* Simple map placeholder - in a real app, you'd use a proper map component */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                        <p className="text-xs font-medium">
                          {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                        </p>
                        {userLocation.accuracy && (
                          <p className={`text-xs ${getAccuracyColor(userLocation.accuracy)}`}>
                            {t.accuracy} {getAccuracyText(userLocation.accuracy)} ({userLocation.accuracy.toFixed(0)}m)
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={getCurrentLocation}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      {t.refreshLocation}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">{t.locationError}</p>
                    <Button size="sm" onClick={getCurrentLocation}>
                      {t.tryAgain}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  {device.tractorInStore.baseTractor?.images?.[0] ? (
                    <AvatarImage
                      src={device.tractorInStore.baseTractor.images[0] || "/placeholder.svg"}
                      alt={device.tractorInStore.baseTractor.name}
                    />
                  ) : (
                    <AvatarFallback>
                      <Truck className="h-8 w-8" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{device.tractorInStore.baseTractor.name}</h3>
                  <p className="text-muted-foreground mb-2">
                    {t.model} {device.tractorInStore.baseTractor.model}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {t.imei} {device.device_imei}
                  </p>
                </div>

                <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOnline ? t.online : t.offline}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.lastSeen}</p>
                    <p className="text-sm font-medium">{formatTime(device.updatedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.battery}</p>
                    <p className="text-sm font-medium">85%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.hourlyRate}</p>
                    <p className="text-sm font-medium text-green-600">${device.tractorInStore.hourly_price}/hr</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">
                  <Navigation className="h-4 w-4 mr-2" />
                  {t.startTracking}
                </Button>
                <Button variant="outline" className="flex-1">
                  {t.viewDetails}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
