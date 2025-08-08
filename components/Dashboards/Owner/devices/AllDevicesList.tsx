"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Wifi,
  WifiOff,
  Truck,
  MapPin,
  Clock,
  Plus,
  RefreshCw,
  Trash2,
  Cross,
  CrossIcon,
} from "lucide-react";
import DeviceApiService, { type Device } from "./Device";
import { AddDeviceModal } from "./AddDeviceModal";
import { DeviceMapModal } from "./DeviceMapModal";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import Image from "next/image";

interface DeviceListProps {
  language?: "en" | "es";
}

export function AllDeviceList({ language = "en" }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const translations = {
    en: {
      title: "All Devices",
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
  };

  const t = translations[language];

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const devicesData = await DeviceApiService.getAllDevices();
      setDevices(devicesData);
    } catch (error) {
      console.error("Error fetching devices:", error);
      errorMessage("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchDevices();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm(t.confirmRemove)) return;

    try {
      await DeviceApiService.removeDevice(deviceId);
      setDevices((prev) => prev.filter((device) => device.id !== deviceId));
      successMessage(t.deviceRemoved);
    } catch (error) {
      console.error("Error removing device:", error);
      errorMessage(t.errorRemoving);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1)
      return language === "es" ? "Ahora mismo" : "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDeviceStatus = (status: number) => {
    return status === 1 ? "online" : "offline";
  };

  if (loading && devices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-red-600 font-bold">{t.title}</h1>
          {/* <p className="text-muted-foreground">
            {t.connectedDevices} ({devices.length})
          </p> */}
        </div>
        <div className="flex gap-2">
          {/* <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {t.refresh}
          </Button> */}
          {/* <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addDevice}
          </Button> */}
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
        <div className="flex gap-6 overflow-x-auto px-2 py-4">
          {/* Add Device */}
          <div className="flex-shrink-0 w-[410px]">
            {devices.map((device) => (
              <div key={device.id}>
                {/* Your existing device card JSX here */}
              </div>
            ))}

            <Card className="flex flex-col items-center justify-center cursor-pointer border-2 border-white hover:bg-white/10 transition-all bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white overflow-hidden h-[380px]">
              <CardContent className="flex flex-col justify-between items-center h-full p-6">
                {/* Centered Plus Icon */}
                <div className="flex-1 flex items-center justify-center w-full">
                  <CrossIcon className="h-12 w-12 text-white" onClick={() => setAddModalOpen(true)}/>
                </div>

                {/* Bottom Full-Width Button */}
                <div className="w-full ">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-[320px] text-white bg-orange-500 border-none hover:bg-orange-600 hover:text-white rounded-full"
                    onClick={() => setAddModalOpen(true)}
                  >
                    <Cross className="h-4 w-4 mr-2" />
                    Add New Device
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Devices */}
          {devices.map((device) => {
            const status = getDeviceStatus(device.base.status);
            const isOnline = status === "online";

            return (
              <div key={device.id} className="flex">
                <Card className="bg-gradient-to-r from-[#8c0000] to-[#4d0000] text-white overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="">
                        {/* Original */}
                        {/* {device.tractorInStore?.baseTractor?.images?.[0] ? (
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              device.tractorInStore.baseTractor.images[0] ||
                              "/placeholder.svg"
                            }
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
                      )} */}

                        {/* Updated One */}
                        <div className="flex justify-center mx-14">
                          <div className="relative bg-[#f4e6e6] p-2 rounded-xl shadow-2xl w-[250px] h-36 flex items-center justify-center">
                            {/* Green online dot */}
                            <div className="absolute top-1 right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white shadow z-10" />

                            {device.tractorInStore?.baseTractor?.images?.[0] ? (
                              <Image
                                src={
                                  device.tractorInStore.baseTractor.images[0]
                                }
                                alt={device.tractorInStore.baseTractor.name}
                                width={400}
                                height={400}
                                unoptimized={true}
                                className="object-cover w-full h-32 rounded-md"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                                <Truck className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3">
                          <CardTitle className="text-base">
                            {device.tractorInStore.baseTractor?.name}
                          </CardTitle>
                          <p className="text-sm text-muted">
                            {/* {t.model} {device.tractorInStore.baseTractor.model} */}
                          </p>
                        </div>
                      </div>
                      {/* <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
                      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {isOnline ? t.online : t.offline}
                    </Badge> */}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">{t.imei}</span>
                        <span className="font-mono">{device.device_imei}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Price:</span>
                        <span className="font-semibold text-white">
                          ${device.tractorInStore.hourly_price}/{t.hour}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1">
                          {/* <Clock className="h-3 w-3" /> */}
                          Last seen:
                        </span>
                        <span className="text-xs">
                          {formatTime(device.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-white bg-orange-500 border-none hover:bg-orange-500 hover:text-white rounded-full"
                        onClick={() => {
                          setSelectedDevice(device);
                          setMapModalOpen(true);
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        {t.viewLocation}
                      </Button>
                      {/* <Button variant="outline" size="sm" onClick={() => handleRemoveDevice(device.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button> */}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
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

      <DeviceMapModal
        open={mapModalOpen}
        onOpenChange={setMapModalOpen}
        device={selectedDevice}
        language={language}
      />
    </div>
  );
}
