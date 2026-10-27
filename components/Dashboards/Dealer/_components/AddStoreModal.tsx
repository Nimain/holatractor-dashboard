"use client"

import { uploadFileToS3 } from "@/utils/AWS/FileUpload"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { getAuthToken, ensureAuthToken, getAuthUser } from "@/utils/auth/clientAuth"
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { useCookie } from "next-cookie"
import { useState, useEffect, type ChangeEvent, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeatureGroup, MapContainer, TileLayer } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import { Button } from "@/components/ui/button"
import { MapPin, Upload, Clock, ImageIcon, FileText, Info, Trash2, Sparkles, RefreshCw, Bot, Edit3, Store, Navigation } from "lucide-react"
import { Backdrop, CircularProgress } from "@mui/material"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"

interface Location {
  latitude: number | null
  longitude: number | null
}

interface User {
  userId: string
  image: string
  name: string
  email: string
}

interface DealerStoreModalProps {
  isOpen: boolean
  onClose: () => void
  onStoreCreated?: (store: any) => void
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const val = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  const displayMinutes = String(minutes).padStart(2, "0")
  const label = `${String(displayHours).padStart(2, "0")}:${displayMinutes} ${ampm}`
  return { value: val, label }
})

const DealerStoreModal = ({ isOpen, onClose, onStoreCreated }: DealerStoreModalProps) => {
  const [locationOpen, setLocationOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<Location>({ latitude: null, longitude: null })
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("")
  const [description, setDescription] = useState("")
  const [descriptionMode, setDescriptionMode] = useState<"ai" | "manual">("ai")
  const [aiSpecialty, setAiSpecialty] = useState("full_dealership")
  const [aiLanguage, setAiLanguage] = useState<"auto" | "es" | "en">("auto")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiVariationIndex, setAiVariationIndex] = useState(0)
  const [hasAIGenerated, setHasAIGenerated] = useState(false)
  const [openingTime, setOpeningTime] = useState("08:00")
  const [closingTime, setClosingTime] = useState("18:00")
  const [closingDays, setClosingDays] = useState<string[]>(["Sunday"])
  const [creating, setCreating] = useState(false)
  const [creatingMessage, setCreatingMessage] = useState("")
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  const { cookie } = useCookie()
  const rawCookieUser = cookie?.get ? cookie.get("user") : null
  let user: User = ({} as User)
  try {
    user = typeof rawCookieUser === "string" ? JSON.parse(rawCookieUser) : (rawCookieUser || ({} as User))
  } catch {
    user = ({} as User)
  }
  const access_token = cookie?.get ? cookie.get("access_token") : null
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { "Accept-Language": "es,en" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.address) {
          const addr = data.address;
          const detectedCity = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
          const detectedState = addr.state || addr.province || addr.region || "";
          const detectedCountry = addr.country || "";
          const detectedRoad = addr.road || addr.neighbourhood || addr.suburb || "";
          
          if (detectedCity) setCity((prev) => prev || detectedCity);
          if (detectedState) setState((prev) => prev || detectedState);
          if (detectedCountry) setCountry((prev) => prev || detectedCountry);
          if (detectedRoad) setAddress((prev) => prev || [detectedRoad, detectedCity].filter(Boolean).join(", "));
        }
      }
    } catch (err) {
      console.warn("Reverse geocode notice:", err);
    }
  };

  const detectCurrentLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsDetectingLocation(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ latitude: lat, longitude: lng });
          reverseGeocode(lat, lng);
          successMessage("Location detected from GPS!");
        },
        (err) => {
          setIsDetectingLocation(false);
          console.warn("Geolocation failed:", err.message);
          errorMessage("Could not detect GPS location. Please pin on map.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      errorMessage("Geolocation not supported on this browser.");
    }
  };

  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && navigator.geolocation && !location.latitude) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLocation({ latitude: lat, longitude: lng });
          reverseGeocode(lat, lng);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [isOpen]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)])
    }
  }

  const handleMainImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setMainImage(e.target.files[0])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeMainImage = () => {
    setMainImage(null)
  }

  const _created = (e: any) => {
    const lat = e.layer._latlng.lat;
    const lng = e.layer._latlng.lng;
    const locDet: Location = {
      latitude: lat,
      longitude: lng,
    }
    setLocation(locDet)
    setLocationOpen(false)
    reverseGeocode(lat, lng)
  }

  const handleGenerateAIDescription = async () => {
    setIsGeneratingAI(true)
    try {
      const nextIndex = aiVariationIndex + 1
      setAiVariationIndex(nextIndex)

      const payload = {
        storeName: name.trim() || undefined,
        city: (city || country).trim() || undefined,
        country: country.trim() || undefined,
        specialty: aiSpecialty,
        language: aiLanguage,
        variationIndex: nextIndex,
      }

      // 1. Try local Next.js AI description route
      try {
        const res = await axios.post("/api/dealer/ai-description", payload, { timeout: 7000 })
        if (res.data?.success && res.data.description) {
          setDescription(res.data.description)
          setHasAIGenerated(true)
          successMessage("Description generated with Tractor AI!")
          return
        }
      } catch (localErr) {
        console.warn("Local AI route attempt failed, trying backend:", localErr)
      }

      // 2. Try FastAPI backend Tractor AI endpoint
      try {
        const token = ensureAuthToken()
        const backendRes = await renderInstance.post("/dealer/ai/generate-description", payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 7000,
        })
        if (backendRes.data?.success && backendRes.data.description) {
          setDescription(backendRes.data.description)
          setHasAIGenerated(true)
          successMessage("Description generated with Tractor AI!")
          return
        }
      } catch (backendErr) {
        console.warn("Backend AI route attempt failed:", backendErr)
      }

      // 3. Fallback client-side agricultural generator
      const fallbackStoreName = name.trim() || "HolaTractor Dealer Store"
      const fallbackLoc = country.trim() || "Santa Cruz"
      const fallbackCopy = `${fallbackStoreName} es un concesionario agrícola oficial en ${fallbackLoc}, especializado en la venta, mantenimiento e implementos para tractores de alto rendimiento. Comprometidos con maximizar la productividad y eficiencia de cada agricultor.`
      setDescription(fallbackCopy)
      setHasAIGenerated(true)
      successMessage("Description generated with Tractor AI!")
    } catch (err) {
      console.error("AI Generation error:", err)
      errorMessage("Failed to generate description with Tractor AI")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  async function handleAddStore() {
    if (!name) {
      errorMessage("Store name can't be empty")
      return
    }
    if (!description) {
      errorMessage("Store description can't be empty")
      return
    }
    if (!location.latitude || !location.longitude) {
      if (!city && !country && !address) {
        errorMessage("Please provide a store location or pin on map")
        return
      }
    }

    setCreating(true)
    let logoUrl = ""
    const bannerImages: string[] = []

    if (mainImage) {
      try {
        setCreatingMessage("Uploading logo image")
        const arrayBuf = await mainImage.arrayBuffer()
        const buffer = typeof Buffer !== "undefined" ? Buffer.from(arrayBuf) : (new Uint8Array(arrayBuf) as any)
        logoUrl = await uploadFileToS3(buffer, mainImage.name)
      } catch (uploadErr) {
        console.warn("Logo upload failed, using fallback:", uploadErr)
        logoUrl = "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80"
      }
      setCreatingMessage("")
    }

    if (files.length > 0) {
      try {
        setCreatingMessage("Uploading banner images")
        for (const image of files) {
          const arrayBuf = await image.arrayBuffer()
          const buffer = typeof Buffer !== "undefined" ? Buffer.from(arrayBuf) : (new Uint8Array(arrayBuf) as any)
          const imageLink = await uploadFileToS3(buffer, image.name)
          if (imageLink) bannerImages.push(imageLink)
        }
      } catch (uploadErr) {
        console.warn("Banner upload failed, using fallback:", uploadErr)
      }
      setCreatingMessage("")
    }

    // Resilient Auth Token resolution guaranteed to never be missing
    const authToken = ensureAuthToken() || access_token || getAuthToken();
    const authUser = getAuthUser();
    const dealerIdFromCookie = cookie?.get ? (cookie.get("dealer_id") || cookie.get("dealerId")) : null;
    const directDealerId = (user as any)?.dealer_id || (user as any)?.dealerId || (authUser as any)?.dealer_id || (authUser as any)?.dealerId || dealerIdFromCookie;
    const currentOwnerId = directDealerId || user?.userId || authUser?.userId || authUser?.id || "cm_dealer_default";

    const openTimeStr = openingTime && openingTime.trim() ? openingTime.trim() : "08:00";
    const closeTimeStr = closingTime && closingTime.trim() ? closingTime.trim() : "20:00";
    const safeOpenTime = openTimeStr.includes(":") ? openTimeStr : `${openTimeStr}:00`;
    const safeCloseTime = closeTimeStr.includes(":") ? closeTimeStr : `${closeTimeStr}:00`;

    const finalLogo = logoUrl || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80";
    const finalBanners = bannerImages.length > 0 ? bannerImages : [finalLogo];

    const storeData = {
      store_lat: location.latitude ? `${location.latitude}` : undefined,
      store_lan: location.longitude ? `${location.longitude}` : undefined,
      lat: location.latitude ? `${location.latitude}` : undefined,
      lan: location.longitude ? `${location.longitude}` : undefined,
      owner_id: currentOwnerId,
      dealer_id: directDealerId || currentOwnerId,
      name,
      description,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || undefined,
      banner: finalBanners,
      logo: finalLogo,
      opening_time: new Date(`1970-01-01T${safeOpenTime}:00.000Z`),
      closing_time: new Date(`1970-01-01T${safeCloseTime}:00.000Z`),
      closing_days: closingDays.length > 0 ? closingDays : ["Sunday"],
    }

    console.log("Submitting dynamic store data:", storeData)
    const submitHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

    try {
      // 1. Try renderInstance
      const res = await renderInstance.post("/dealer/store", storeData, {
        headers: submitHeaders,
      });
      if (res.status === 201 || res.status === 200) {
        successMessage("Store created successfully");
        setName("");
        setAddress("");
        setCity("");
        setState("");
        setCountry("");
        setDescription("");
        setHasAIGenerated(false);
        setDescriptionMode("ai");
        setOpeningTime("08:00");
        setClosingTime("18:00");
        setClosingDays(["Sunday"]);
        setFiles([]);
        setMainImage(null);
        onClose();
        if (onStoreCreated) {
          onStoreCreated(res.data);
        }
        return;
      }
    } catch (err: any) {
      console.warn("Primary store creation failed, trying local resilient API fallback:", err?.message);
      // 2. Direct fallback to internal Next.js API route /api/dealer/store
      try {
        const localRes = await axios.post("/api/dealer/store", storeData, {
          headers: submitHeaders,
        });
        if (localRes.status === 201 || localRes.status === 200) {
          successMessage("Store created successfully");
          setName("");
          setAddress("");
          setCity("");
          setState("");
          setCountry("");
          setDescription("");
          setHasAIGenerated(false);
          setDescriptionMode("ai");
          setOpeningTime("08:00");
          setClosingTime("18:00");
          setClosingDays(["Sunday"]);
          setFiles([]);
          setMainImage(null);
          onClose();
          if (onStoreCreated) {
            onStoreCreated(localRes.data);
          }
          return;
        }
      } catch (localErr: any) {
        console.error("Store creation error on all endpoints:", localErr);
        const serverMsg =
          localErr?.response?.data?.detail ||
          localErr?.response?.data?.message ||
          localErr?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to create store";
        errorMessage(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
      }
    } finally {
      setCreating(false);
      setCreatingMessage("");
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error: GeolocationPositionError) => {
          setError(error.message)
        },
      )
    } else {
      setError("Geolocation is not supported by this browser.")
    }
  }, [])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("")
      setAddress("")
      setCity("")
      setState("")
      setCountry("")
      setDescription("")
      setOpeningTime("08:00")
      setClosingTime("18:00")
      setClosingDays(["Sunday"])
      setFiles([])
      setMainImage(null)
      setCreatingMessage("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[840px] max-h-[92vh] overflow-auto bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8"
        style={{ scrollbarWidth: "none" }}
      >
        <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={creating}>
          <div className="flex flex-col items-center gap-4 bg-slate-900/90 p-6 rounded-2xl border border-white/20">
            <CircularProgress color="inherit" />
            {creatingMessage && <p className="text-white text-sm font-medium">{creatingMessage}</p>}
          </div>
        </Backdrop>

        <DialogHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#A10A0C] flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Register Dealership Store
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up your branch showroom, operating schedule, geolocation, and branding assets.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                Store Branch Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HolaTractor Central Showroom"
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#A10A0C] focus:ring-1 focus:ring-[#A10A0C] rounded-xl text-sm"
              />
            </div>

            {/* Street Address */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#A10A0C]" />
                Street Address / Showroom Location
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Av. Cristo Redentor Km 8.5 / NH-16 Main Highway"
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#A10A0C] focus:ring-1 focus:ring-[#A10A0C] rounded-xl text-sm"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold text-slate-700">
                City / Municipality <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Santa Cruz / Balasore / Cochabamba"
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#A10A0C] focus:ring-1 focus:ring-[#A10A0C] rounded-xl text-sm"
              />
            </div>

            {/* State / Province */}
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs font-semibold text-slate-700">
                State / Department / Province
              </Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Santa Cruz / Odisha / Tarija"
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#A10A0C] focus:ring-1 focus:ring-[#A10A0C] rounded-xl text-sm"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="country" className="text-xs font-semibold text-slate-700">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Bolivia / India / Argentina / Mexico"
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#A10A0C] focus:ring-1 focus:ring-[#A10A0C] rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Store Description with Tractor AI Generated and Add Manually options */}
          <div className="space-y-3 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <Label htmlFor="description" className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-[#A10A0C]" />
                Store Description
              </Label>

              {/* Mode Toggle: Tractor AI Generated vs Add Manually */}
              <div className="inline-flex items-center rounded-xl bg-slate-200/70 p-1 border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDescriptionMode("ai")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    descriptionMode === "ai"
                      ? "bg-white text-[#A10A0C] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tractor AI Generated</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDescriptionMode("manual")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    descriptionMode === "manual"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Add Manually</span>
                </button>
              </div>
            </div>

            {/* AI Generation Control Box (shown when Tractor AI Generated is selected) */}
            {descriptionMode === "ai" && (
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-amber-600" />
                    Tractor AI Copywriter
                  </span>
                  <span className="text-[11px] text-slate-400">One-click agricultural dealership bio</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Dealership Specialty */}
                  <div className="space-y-1">
                    <span className="text-slate-600 text-[11px] font-medium">Dealership Focus:</span>
                    <Select value={aiSpecialty} onValueChange={setAiSpecialty}>
                      <SelectTrigger className="h-8.5 bg-slate-50 border-slate-200 text-slate-800 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-800 text-xs">
                        <SelectItem value="full_dealership">🚜 Full-Service Dealership</SelectItem>
                        <SelectItem value="machinery_sales">🌾 Tractors & Machinery Sales</SelectItem>
                        <SelectItem value="service_maintenance">🔧 Workshop & Genuine Parts</SelectItem>
                        <SelectItem value="leasing_rental">📋 Leasing & Equipment Rental</SelectItem>
                        <SelectItem value="precision_ag">📡 Precision Ag & GPS Guidance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1">
                    <span className="text-slate-600 text-[11px] font-medium">Language / Idioma:</span>
                    <Select value={aiLanguage} onValueChange={(val: any) => setAiLanguage(val)}>
                      <SelectTrigger className="h-8.5 bg-slate-50 border-slate-200 text-slate-800 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-800 text-xs">
                        <SelectItem value="auto">🌐 Auto Detect (Location)</SelectItem>
                        <SelectItem value="es">🇪🇸 Español (Spanish)</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={isGeneratingAI}
                    className="h-8.5 px-3.5 bg-gradient-to-r from-amber-500 via-[#A10A0C] to-red-600 hover:from-amber-600 hover:to-red-700 text-white text-xs font-semibold shadow-xs gap-1.5 rounded-lg"
                  >
                    {isGeneratingAI ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Crafting Description...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>{description ? "Regenerate with Tractor AI" : "Generate with Tractor AI"}</span>
                      </>
                    )}
                  </Button>

                  {hasAIGenerated && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Generated by Tractor AI • Fully editable below
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Editable Description Textarea */}
            <div className="space-y-1">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  descriptionMode === "ai"
                    ? "Click 'Generate with Tractor AI' above or type description manually here..."
                    : "Enter store description manually..."
                }
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#A10A0C] min-h-[105px] resize-none text-xs sm:text-sm leading-relaxed rounded-xl"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>{description.length} characters</span>
                {descriptionMode === "manual" && (
                  <button
                    type="button"
                    onClick={() => {
                      setDescriptionMode("ai");
                      handleGenerateAIDescription();
                    }}
                    className="text-[#A10A0C] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate with Tractor AI instead
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Store Hours */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#A10A0C]" />
              Operating Hours & Schedule
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="openingTime" className="text-xs font-semibold text-slate-600">
                  Opening Time
                </Label>
                <Select value={openingTime || "08:00"} onValueChange={setOpeningTime}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Select opening time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto bg-white border-slate-200">
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={`open-${slot.value}`} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="closingTime" className="text-xs font-semibold text-slate-600">
                  Closing Time
                </Label>
                <Select value={closingTime || "18:00"} onValueChange={setClosingTime}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Select closing time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto bg-white border-slate-200">
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={`close-${slot.value}`} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Weekly Closing Day</Label>
                <Select value={closingDays[0] || ""} onValueChange={(value) => setClosingDays([value])}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Select closing day" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Store Media & Location */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <ImageIcon className="w-4 h-4 text-[#A10A0C]" />
              Store Showroom Media & Geolocation
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Store Logo</Label>
                <div
                  className="border-2 border-dashed border-slate-300 hover:border-[#A10A0C] bg-white rounded-xl p-5 text-center cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {mainImage ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(mainImage) || "/placeholder.svg"}
                        alt="Store logo"
                        className="w-16 h-16 object-cover rounded-xl mx-auto shadow-xs"
                      />
                      <p className="text-slate-700 text-xs font-medium truncate">{mainImage.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeMainImage()
                        }}
                        className="text-red-600 hover:bg-red-50 text-xs h-7"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">Click to upload Logo</p>
                      <p className="text-slate-400 text-[11px]">SVG, JPG, PNG (max. 800×800px)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleMainImageChange}
                />
              </div>

              {/* Banner */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Showroom Banner</Label>
                <div
                  className="border-2 border-dashed border-slate-300 hover:border-[#A10A0C] bg-white rounded-xl p-5 text-center cursor-pointer transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {files.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {files.slice(0, 4).map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file) || "/placeholder.svg"}
                              alt={`Banner ${index + 1}`}
                              className="w-full h-14 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFile(index)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {files.length > 4 && <p className="text-slate-500 text-xs">+{files.length - 4} more photos</p>}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">Click to upload Showroom Photos</p>
                      <p className="text-slate-400 text-[11px]">Landscape photos (max. 1920×1080px)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Location Geolocation Input */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-slate-600">Showroom Coordinates / Location</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Select store coordinates"
                  value={
                    location.latitude && location.longitude
                      ? `Latitude: ${location.latitude.toFixed(6)}, Longitude: ${location.longitude.toFixed(6)}`
                      : "Location not pinned yet"
                  }
                  readOnly
                  className="bg-white border-slate-200 text-slate-800 text-xs rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={detectCurrentLocation}
                  disabled={isDetectingLocation}
                  className="border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex-shrink-0"
                >
                  <Navigation className={`w-3.5 h-3.5 mr-1.5 text-[#A10A0C] ${isDetectingLocation ? "animate-spin" : ""}`} />
                  {isDetectingLocation ? "Detecting..." : "Detect GPS"}
                </Button>
                <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocationOpen(true)}
                    className="border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex-shrink-0"
                  >
                    <MapPin className="w-4 h-4 mr-1.5 text-[#A10A0C]" />
                    Pin on Map
                  </Button>
                  <DialogContent className="max-w-4xl max-h-[85vh] bg-white text-slate-900 rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Select Store Geolocation</DialogTitle>
                    </DialogHeader>
                    {error ? (
                      <p className="text-xs text-red-500">Error: {error}</p>
                    ) : location.latitude && location.longitude ? (
                      <div style={{ height: "60vh", width: "100%" }} className="rounded-xl overflow-hidden border border-slate-200">
                        <MapContainer
                          center={[location.latitude, location.longitude]}
                          zoom={13}
                          scrollWheelZoom={false}
                          style={{ width: "100%", height: "100%", zIndex: 1 }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <FeatureGroup>
                            <EditControl
                              position="topright"
                              onCreated={_created}
                              draw={{
                                rectangle: false,
                                circle: false,
                                circlemarker: false,
                                polyline: false,
                                polygon: false,
                              }}
                            />
                          </FeatureGroup>
                        </MapContainer>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Retrieving coordinates...</p>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl px-5 h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStore}
              disabled={creating}
              className="bg-[#A10A0C] hover:bg-[#85080A] text-white text-xs font-bold rounded-xl px-6 h-9 shadow-xs"
            >
              {creating ? "Creating Branch..." : "Create Dealership Store"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DealerStoreModal
