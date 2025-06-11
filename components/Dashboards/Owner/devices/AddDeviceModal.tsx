"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Truck, Clock, MapPin, ArrowRight, Loader2, ChevronLeft } from "lucide-react"
import DeviceApiService, { type Store, type TractorInStore } from "./Device"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"

interface AddDeviceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeviceAdded: () => void
  language?: "en" | "es"
}

type Step = "store" | "tractor" | "imei"

export function AddDeviceModal({ open, onOpenChange, onDeviceAdded, language = "en" }: AddDeviceModalProps) {
  const [step, setStep] = useState<Step>("store")
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedTractor, setSelectedTractor] = useState<TractorInStore | null>(null)
  const [imeiNumber, setImeiNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  const translations = {
    en: {
      title: "Add Device",
      selectStore: "Select Store",
      selectTractor: "Select Tractor",
      enterImei: "Enter IMEI Number",
      noStores: "No stores available",
      noTractors: "This store has no available tractors",
      tractors: "tractors",
      viewLocation: "View location",
      model: "Model:",
      imeiLabel: "IMEI Number (15 digits)",
      imeiPlaceholder: "0867010070133765",
      imeiExample: "Example: 0867010070133765",
      selectedTractor: "Selected Tractor:",
      cancel: "Cancel",
      back: "Back",
      next: "Next",
      addDevice: "Add Device",
      loading: "Loading stores...",
      invalidImei: "IMEI number must be 15 digits",
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
      imeiLabel: "Número IMEI (15 dígitos)",
      imeiPlaceholder: "0867010070133765",
      imeiExample: "Ejemplo: 0867010070133765",
      selectedTractor: "Tractor Seleccionado:",
      cancel: "Cancelar",
      back: "Atrás",
      next: "Siguiente",
      addDevice: "Agregar Dispositivo",
      loading: "Cargando tiendas...",
      invalidImei: "El número IMEI debe tener 15 dígitos",
      deviceExists: "Este número IMEI ya está registrado",
      deviceAdded: "Dispositivo agregado exitosamente",
      errorAdding: "Error al agregar el dispositivo",
    },
  }

  const t = translations[language]

  useEffect(() => {
    if (open) {
      fetchStores()
      setStep("store")
      setSelectedStore(null)
      setSelectedTractor(null)
      setImeiNumber("")
    }
  }, [open])

  const fetchStores = async () => {
    try {
      setLoading(true)
      const storesData = await DeviceApiService.getAllStores()
      setStores(storesData)
    } catch (error) {
      console.error("Error fetching stores:", error)
      errorMessage("Failed to load stores")
    } finally {
      setLoading(false)
    }
  }

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store)
    if (store.TractorInStore && store.TractorInStore.length > 0) {
      setStep("tractor")
    } else {
      errorMessage(t.noTractors)
    }
  }

  const handleTractorSelect = (tractor: TractorInStore) => {
    setSelectedTractor(tractor)
    setStep("imei")
  }

  const handleAddDevice = async () => {
    if (!imeiNumber.trim()) {
      errorMessage("Please enter IMEI number")
      return
    }

    const imeiRegex = /^\d{15}$/
    if (!imeiRegex.test(imeiNumber.trim())) {
      errorMessage(t.invalidImei)
      return
    }

    if (!selectedTractor) {
      errorMessage("No tractor selected")
      return
    }

    setAdding(true)

    try {
      await DeviceApiService.addDeviceToTractor(imeiNumber.trim(), selectedTractor.id)

      successMessage(t.deviceAdded)

      onDeviceAdded()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error adding device:", error)

      let errorMessageText = t.errorAdding
      if (error.message.includes("already registered") || error.message.includes("409")) {
        errorMessageText = t.deviceExists
      }

      errorMessage(errorMessageText)
    } finally {
      setAdding(false)
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getStepTitle = () => {
    switch (step) {
      case "store":
        return t.selectStore
      case "tractor":
        return t.selectTractor
      case "imei":
        return t.enterImei
      default:
        return t.title
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "store" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === "tractor") setStep("store")
                  if (step === "imei") setStep("tractor")
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
                <div className="grid gap-4">
                  {stores.map((store) => (
                    <Card key={store.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4" onClick={() => handleStoreSelect(store)}>
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={store.image || "/placeholder.svg"} alt={store.name} />
                            <AvatarFallback>{store.name[0]}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{store.description}</p>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Truck className="h-4 w-4 text-green-600" />
                                <span>
                                  {store.TractorInStore?.length || 0} {t.tractors}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span>
                                  {formatTime(store.opening_time)} - {formatTime(store.closing_time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-red-600" />
                                <span>{t.viewLocation}</span>
                              </div>
                            </div>
                          </div>

                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tractor Selection */}
          {step === "tractor" && selectedStore && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Store: {selectedStore.name}</p>
              </div>

              <div className="grid gap-4">
                {selectedStore.TractorInStore.map((tractor) => (
                  <Card key={tractor.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4" onClick={() => handleTractorSelect(tractor)}>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          {tractor.baseTractor.images?.[0] ? (
                            <AvatarImage
                              src={tractor.baseTractor.images[0] || "/placeholder.svg"}
                              alt={tractor.baseTractor.name}
                            />
                          ) : (
                            <AvatarFallback>
                              <Truck className="h-8 w-8" />
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{tractor.baseTractor.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t.model} {tractor.baseTractor.model}
                          </p>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {tractor.baseTractor.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-green-600">${tractor.hourly_price}/hr</span>
                            <Badge variant="secondary">{tractor.baseTractor.type}</Badge>
                          </div>
                        </div>

                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* IMEI Input */}
          {step === "imei" && selectedTractor && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">{t.selectedTractor}</h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {selectedTractor.baseTractor.images?.[0] ? (
                        <AvatarImage
                          src={selectedTractor.baseTractor.images[0] || "/placeholder.svg"}
                          alt={selectedTractor.baseTractor.name}
                        />
                      ) : (
                        <AvatarFallback>
                          <Truck className="h-6 w-6" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedTractor.baseTractor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.model} {selectedTractor.baseTractor.model}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="imei">{t.imeiLabel}</Label>
                  <Input
                    id="imei"
                    type="text"
                    placeholder={t.imeiPlaceholder}
                    value={imeiNumber}
                    onChange={(e) => setImeiNumber(e.target.value)}
                    maxLength={15}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t.imeiExample}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>

          {step === "imei" && (
            <Button onClick={handleAddDevice} disabled={adding}>
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.addDevice}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
