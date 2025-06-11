"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Wifi, WifiOff, Truck, MapPin, Clock, Plus, RefreshCw, Trash2 } from "lucide-react"
import DeviceApiService, { type Device } from "./Device"
import { AddDeviceModal } from "./AddDeviceModal"
import { DeviceMapModal } from "./DeviceMapModal"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"

interface DeviceListProps {
  language?: "en" | "es"
}

export function DeviceList({ language = "en" }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  const translations = {
    en: {
      title: "My Devices",
      connectedDevices: "Connected Devices",
      noDevices: "No connected devices",
      noDevicesDesc: "Click + to add a device",
      addDevice: "Add Device",
      refresh: "Refresh",
      loading: "Loading devices...",
      online: "Online",
      offline: "Offline",
      model: "Model:",
      imei: "IMEI:",
      hour: "hour",
      viewLocation: "View Location",
      removeDevice: "Remove Device",
      confirmRemove: "Are you sure you want to remove this device?",
      deviceRemoved: "Device removed successfully",
      errorRemoving: "Failed to remove device",
    },
    es: {
      title: "Mis Dispositivos",
      connectedDevices: "Dispositivos Conectados",
      noDevices: "No hay dispositivos conectados",
      noDevicesDesc: "Toca + para agregar un dispositivo",
      addDevice: "Agregar Dispositivo",
      refresh: "Actualizar",
      loading: "Cargando dispositivos...",
      online: "En línea",
      offline: "Desconectado",
      model: "Modelo:",
      imei: "IMEI:",
      hour: "hora",
      viewLocation: "Ver Ubicación",
      removeDevice: "Eliminar Dispositivo",
      confirmRemove: "¿Estás seguro de que quieres eliminar este dispositivo?",
      deviceRemoved: "Dispositivo eliminado exitosamente",
      errorRemoving: "Error al eliminar el dispositivo",
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
      errorMessage("Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchDevices()
    } finally {
      setRefreshing(false)
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm(t.confirmRemove)) return

    try {
      await DeviceApiService.removeDevice(deviceId)
      setDevices((prev) => prev.filter((device) => device.id !== deviceId))
      successMessage(t.deviceRemoved)
    } catch (error) {
      console.error("Error removing device:", error)
      errorMessage(t.errorRemoving)
    }
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

  const getDeviceStatus = (status: number) => {
    return status === 1 ? "online" : "offline"
  }

  if (loading && devices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">
            {t.connectedDevices} ({devices.length})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {t.refresh}
          </Button>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addDevice}
          </Button>
        </div>
      </div>

      {/* Device Grid */}
      {devices.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t.noDevices}</h3>
            <p className="text-muted-foreground mb-4">{t.noDevicesDesc}</p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.addDevice}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const status = getDeviceStatus(device.base.status)
            const isOnline = status === "online"

            return (
              <Card key={device.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {device.tractorInStore?.baseTractor?.images?.[0] ? (
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={device.tractorInStore.baseTractor.images[0] || "/placeholder.svg"}
                            alt={device.tractorInStore.baseTractor.name}
                          />
                          <AvatarFallback>
                            <Truck className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                          <Truck className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{device.tractorInStore.baseTractor.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {t.model} {device.tractorInStore.baseTractor.model}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
                      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {isOnline ? t.online : t.offline}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.imei}:</span>
                      <span className="font-mono">{device.device_imei}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold text-green-600">
                        ${device.tractorInStore.hourly_price}/{t.hour}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last seen:
                      </span>
                      <span className="text-xs">{formatTime(device.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedDevice(device)
                        setMapModalOpen(true)
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {t.viewLocation}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRemoveDevice(device.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <AddDeviceModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onDeviceAdded={fetchDevices}
        language={language}
      />

      <DeviceMapModal open={mapModalOpen} onOpenChange={setMapModalOpen} device={selectedDevice} language={language} />
    </div>
  )
}
