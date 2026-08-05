"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Truck,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
  ChevronLeft,
  Tractor,
  Store,
} from "lucide-react";
import DeviceApiService, { type Store, type TractorInStore } from "./Device";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import Image from "next/image";

interface AddDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceAdded: () => void;
  language?: "en" | "es";
}

type Step = "store" | "tractor" | "imei";

export function AddDeviceModal({
  open,
  onOpenChange,
  onDeviceAdded,
  language = "en",
}: AddDeviceModalProps) {
  const [step, setStep] = useState<Step>("store");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedTractor, setSelectedTractor] = useState<TractorInStore | null>(
    null
  );
  const [imeiNumber, setImeiNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deviceRegion, setDeviceRegion] = React.useState("southwest");

  const translations = {
    en: {
      title: "Add Device",
      selectStore: "Select Store",
      selectTractor: "Select Tractor",
      // enterImei: "Enter IMEI Number",
      noStores: "No stores available",
      noTractors: "This store has no available tractors",
      tractors: "tractors",
      viewLocation: "View location",
      model: "Model:",
      imeiLabel: "IMEI Number (up to 20 digits)",
      imeiPlaceholder: "0867010070133765",
      imeiExample: "Example: 0867010070133765",
      selectedTractor: "Selected Tractor:",
      cancel: "Cancel",
      back: "Back",
      next: "Next",
      addDevice: "Add Device",
      loading: "Loading stores...",
      invalidImei: "IMEI number must be up to 20 digits",
      deviceExists: "This IMEI number is already registered",
      deviceAdded: "Device added successfully",
      errorAdding: "Failed to add device",
    },
    es: {
      title: "Agregar Dispositivo",
      selectStore: "Seleccionar Tienda",
      selectTractor: "Seleccionar Tractor",
      enterImei: "Ingresar Número IMEI",
      noStores: "No hay tiendas disponibles",
      noTractors: "Esta tienda no tiene tractores disponibles",
      tractors: "tractores",
      viewLocation: "Ver ubicación",
      model: "Modelo:",
      imeiLabel: "Número IMEI (hasta 20 dígitos)",
      imeiPlaceholder: "0867010070133765",
      imeiExample: "Ejemplo: 0867010070133765",
      selectedTractor: "Tractor Seleccionado:",
      cancel: "Cancelar",
      back: "Atrás",
      next: "Siguiente",
      addDevice: "Agregar Dispositivo",
      loading: "Cargando tiendas...",
      invalidImei: "El número IMEI debe tener hasta 20 dígitos",
      deviceExists: "Este número IMEI ya está registrado",
      deviceAdded: "Dispositivo agregado exitosamente",
      errorAdding: "Error al agregar el dispositivo",
    },
  };

  const t = translations[language];

  useEffect(() => {
    if (open) {
      fetchStores();
      setStep("store");
      setSelectedStore(null);
      setSelectedTractor(null);
      setImeiNumber("");
    }
  }, [open]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const storesData = await DeviceApiService.getAllStores();
      setStores(storesData);
    } catch (error) {
      console.error("Error fetching stores:", error);
      errorMessage("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    if (store.TractorInStore && store.TractorInStore.length > 0) {
      setStep("tractor");
    } else {
      errorMessage(t.noTractors);
    }
  };

  const handleTractorSelect = (tractor: TractorInStore) => {
    setSelectedTractor(tractor);
    setStep("imei");
  };

  const handleAddDevice = async () => {
    if (!imeiNumber.trim()) {
      errorMessage("Please enter IMEI number");
      return;
    }

    const imeiRegex = /^\d{1,20}$/;
    if (!imeiRegex.test(imeiNumber.trim())) {
      errorMessage(t.invalidImei);
      return;
    }

    if (!selectedTractor) {
      errorMessage("No tractor selected");
      return;
    }

    setAdding(true);

    try {
      await DeviceApiService.addDeviceToTractor(
        imeiNumber.trim(),
        selectedTractor.id
      );

      successMessage(t.deviceAdded);

      onDeviceAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding device:", error);

      let errorMessageText = t.errorAdding;
      if (
        error.message.includes("already registered") ||
        error.message.includes("409")
      ) {
        errorMessageText = t.deviceExists;
      }

      errorMessage(errorMessageText);
    } finally {
      setAdding(false);
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStepTitle = () => {
    switch (step) {
      case "store":
        return t.selectStore;
      case "tractor":
        return t.selectTractor;
      case "imei":
        return t.enterImei;
      default:
        return t.title;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-gradient-to-r from-[#8c0000] to-[#4d0000] border-[#4d0000] text-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "store" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "tractor") setStep("store");
                  if (step === "imei") setStep("tractor");
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                {t.back}
              </Button>
            )}
            <DialogTitle>{getStepTitle()}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Store Selection */}
          {step === "store" && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">{t.loading}</span>
                </div>
              ) : stores.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t.noStores}</p>
                </div>
              ) : (
                <>
                  {/* Grid Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {stores.map((store) => (
                      <Card
                        key={store.id}
                        className="rounded-xl overflow-hidden shadow-md cursor-pointer transition-all hover:shadow-lg border-none "
                        onClick={() => handleStoreSelect(store)}
                      >
                        {/* Top Image or Icon Section */}
                        <div className="bg-pink-200 dark:bg-pink-900 h-32 flex items-center justify-center">
                          {store.image ? (
                            <Image
                              src={store.image}
                              alt={store.name}
                              width={400}
                              height={200}
                              unoptimized={true}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Store className="h-12 w-12 text-pink-800 dark:text-pink-200" />
                          )}
                        </div>

                        {/* Bottom Info Section */}
                        <div className="bg-white dark:bg-zinc-950 p-4 space-y-2">
                          <div className="flex">
                            <h3 className="font-semibold text-lg text-red-700 dark:text-red-400">
                              {store.name}
                            </h3>
                            {/* <p className="text-sm text-muted-foreground line-clamp-2">
                            {store.description}
                          </p> */}
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-red-600" />
                              <span className="text-xs">{t.viewLocation}</span>
                            </div>
                          </div>

                          <div className="flex justify-around gap-1 mt-1 text-[10px] text-muted-foreground">
                            {/* Tractor Box */}
                            <div className="flex items-center justify gap-0.5 border border-black px-1 py-[2px] rounded text-red-600  h-10">
                              <Tractor className=" text-sm text-red-600 w-4 h-4 mb-4" />
                              <div className="leading-none">
                                <span className="block text-sm">
                                  {t.tractors}
                                </span>
                                <span className="block text-center  text-sm">
                                  {store.TractorInStore?.length || 0}
                                </span>
                              </div>
                            </div>

                            {/* Store Time Box */}
                            <div className="flex flex-col border border-black px-1 py-[2px] rounded text-red-500  leading-tight">
                              <div className="flex items-center gap-0.5">
                                <Clock className="h-4 w-4 text-red-600" />
                                <span className="text-sm">Time</span>
                              </div>
                              <span className="text-[11px] ">
                                {formatTime(store.opening_time).replace(
                                  " ",
                                  ""
                                )}{" "}
                                -{" "}
                                {formatTime(store.closing_time).replace(
                                  " ",
                                  ""
                                )}
                              </span>
                            </div>
                          </div>

                          <Button className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                            Select Store
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* View All Stores Button */}
                  <div className="text-center mt-6 border-transparent">
                    <Button
                      variant="outline"
                      className="bg-orange-500 text-white border-transparent hover:bg-orange-600 hover:text-white rounded-full"
                    >
                      View All Stores
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tractor Selection */}
          {step === "tractor" && selectedStore && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Store: {selectedStore.name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedStore.TractorInStore.map((tractor) => (
                  <Card
                    key={tractor.id}
                    className="rounded-xl overflow-hidden shadow border-none"
                  >
                    {/* Image section */}
                    <div className="bg-[#f4e6e6] h-36 flex items-center justify-center">
                      <Image
                        src={
                          tractor.baseTractor.images?.[0] || "/placeholder.svg"
                        }
                        alt={tractor.baseTractor.name}
                        width={300}
                        height={200}
                        className="h-full w-full object-cover rounded-t-md"
                        unoptimized // remove this if you're using an optimized image CDN
                      />
                    </div>

                    {/* Info section */}
                    <div className="bg-white dark:bg-black p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
                          {tractor.baseTractor.name}
                        </h3>
                        {/* <Badge variant="outline" className="text-[10px] px-2">
                          {tractor.baseTractor.type}
                        </Badge> */}
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-red-500 font-medium">Model:</span>
                        <span className="font-semibold text-red-500">
                          {tractor.baseTractor.model}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span className="font-medium text-red-500">
                            Type:
                          </span>
                          <span className="text-red-500">
                            {tractor.baseTractor.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-red-500 font-medium">Rate:</span>
                        <span className="text-orange-600 font-semibold">
                          ${tractor.hourly_price}/Hour
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleTractorSelect(tractor)}
                        className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded"
                      >
                        Select
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* View All Button */}
              <div className="text-center pt-4">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-semibold">
                  View All Tractors
                </Button>
              </div>
            </div>
          )}

          {/* IMEI Input */}
          {step === "imei" && selectedTractor && (
            <div className="w-full max-w-2xl mx-auto bg-red-800 text-white rounded-xl p-6 space-y-6">
              {/* Top Bar */}
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex-1 text-center font-semibold text-lg">
                  {imeiNumber || "IMEI Number"}
                </div>
                
              </div>

              {/* Selected Tractor */}
              <div>
                <h4 className="font-medium mb-2">{t.selectedTractor}</h4>
                <div className="flex items-center gap-3 bg-white text-red-500 rounded-xl p-1">
                  <Avatar className="h-12 w-12 ">
                    {selectedTractor.baseTractor.images?.[0] ? (
                      <AvatarImage
                        src={
                          selectedTractor.baseTractor.images[0] ||
                          "/placeholder.svg"
                        }
                        alt={selectedTractor.baseTractor.name}
                      />
                    ) : (
                      <AvatarFallback>
                        <Truck className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedTractor.baseTractor.name}
                    </p>
                    <p className="text-sm text-red-500">
                      {t.model} {selectedTractor.baseTractor.model}
                    </p>
                  </div>
                </div>
              </div>

              {/* Device Region */}
              <div>
                <h4 className="font-medium mb-2">Device Region</h4>
                <div className="flex space-x-3">
                  {["southwest", "northwest"].map((region) => (
                    <label key={region} className="flex-1">
                      <input
                        type="radio"
                        name="deviceRegion"
                        value={region}
                        checked={deviceRegion === region}
                        onChange={() => setDeviceRegion(region)}
                        className="sr-only"
                      />
                      <div
                        className={`
                text-center py-2 rounded-md border-2
                ${
                  deviceRegion === region
                    ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-500 hover:text-white"
                    : "border-orange-500 text-white  hover:bg-orange-500 hover:text-white"
                }
              `}
                      >
                        {region === "southwest" ? "South West" : "North West"}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* IMEI Input */}
              <div>
                <Label htmlFor="imei">
                  IMEI Number{" "}
                  <span className="text-sm text-gray-300">(up to 20 digits)</span>
                </Label>
                <div className="flex flex-col  gap-3 mt-1">
                  <Input
                    id="imei"
                    type="text"
                    placeholder="Enter the IMEI Number"
                    value={imeiNumber}
                    onChange={(e) => setImeiNumber(e.target.value)}
                    maxLength={20}
                    className="flex-grow bg-white placeholder:text-red-500 rounded-xl "
                  />
                  <span className="text-xs text-gray-300 whitespace-nowrap">
                    Example: 123456789012345
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="bg-orange-500 text-white hover:bg-orange-500 hover:text-white border-orange-500"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>

          {step === "imei" && (
            <Button
              className="bg-orange-500 text-white hover:bg-orange-500 hover:text-white border-orange-500"
              onClick={handleAddDevice}
              disabled={adding}
            >
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.addDevice}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
