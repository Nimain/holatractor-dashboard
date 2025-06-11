"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Smartphone, ChevronRight, MapPin, Wifi, WifiOff, Truck } from "lucide-react"
import DeviceApiService, { type Device } from "./Device"
import { DeviceMapModal } from "./DeviceMapModal"
import Link from "next/link"

interface AddedDevicesSectionProps {
  language?: "en" | "es"
}

export function AddedDevicesSection({ language = "en" }: AddedDevicesSectionProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [mapModalOpen, setMapModalOpen] = useState(false)

  const translations = {
    en: {
      title: "Added Devices",
      seeMore: "SEE MORE",
      noDevices: "No devices found",
      noDevicesDesc: "Devices will appear here once added",
      loading: "Loading devices...",
      located: "Located",
      noGps: "No GPS",
      online: "Online",
      offline: "Offline",
    },
    es: {
      title: "Dispositivos Agregados",
      seeMore: "VER MÁS",
      noDevices: "No hay dispositivos",
      noDevicesDesc: "Los dispositivos aparecerán aquí una vez agregados",
      loading: "Cargando dispositivos...",
      located: "Ubicado",
      noGps: "Sin GPS",
      online: "En línea",
      offline: "Desconectado",
    },
  }

  const t = translations[language]

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const devicesData = await DeviceApiService.getAllDevices()
      setDevices(devicesData)
    } catch (error) {
      console.error("Error fetching devices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDevicePress = (device: Device) => {
    setSelectedDevice(device)
    setMapModalOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">{t.noDevices}</h3>
            <p className="text-sm text-muted-foreground">{t.noDevicesDesc}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <Link href="/owner/devicestractors">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                {t.seeMore}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {devices.slice(0, 5).map((device) => {
              const isOnline = device.base.status === 1
              const hasLocation = device.tractorInStore.lat && device.tractorInStore.lan

              return (
                <Card
                  key={device.id}
                  className="min-w-[200px] cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleDevicePress(device)}
                >
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 mx-auto">
                        {device.tractorInStore.baseTractor.images?.[0] ? (
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
                      <div className="absolute -top-1 -right-1">
                        <div className={`w-4 h-4 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h4 className="font-semibold text-sm truncate">{device.tractorInStore.baseTractor.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {device.tractorInStore.baseTractor.model}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-green-600">${device.tractorInStore.hourly_price}/hr</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-muted-foreground">{hasLocation ? t.located : t.noGps}</span>
                        </div>
                      </div>

                      <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
                        {isOnline ? (
                          <>
                            <Wifi className="h-3 w-3 mr-1" />
                            {t.online}
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 mr-1" />
                            {t.offline}
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <DeviceMapModal open={mapModalOpen} onOpenChange={setMapModalOpen} device={selectedDevice} language={language} />
    </>
  )
}
