import { renderInstance } from "@/utils/Axios/RenderInstance"
import axios from "axios"
import DeviceLocationService from "@/utils/Axios/DeviceLocationService"
import type { DeviceLocationData, LocationHistoryParams } from "@/utils/Axios/DeviceLocationService"

interface Device {
  id: string
  device_imei: string
  device_region?: string
  base_id: string
  tractor_store_id: string
  createdAt: string
  updatedAt: string
  base: {
    id: string
    created_by: string
    status: number
    created: string
    updated: string
  }
  tractorInStore: {
    id: string
    baseTractorId: string
    base_id: string
    hourly_price: number
    store_id: string
    document_id: string
    lat: string | null
    lan: string | null
    createdAt: string
    updatedAt: string
    baseTractor: {
      id: string
      name: string
      description: string
      es_name: string | null
      es_description: string | null
      ay_name: string | null
      ay_description: string | null
      qu_name: string | null
      qu_description: string | null
      gn_name: string | null
      gn_description: string | null
      images: string[]
      model: string
      type: string
      year: string
      base_id: string
      created_by: string
      createdAt: string
      updatedAt: string
    }
  }
}

interface Store {
  id: string
  name: string
  description: string
  image: string
  opening_time: string
  closing_time: string
  closing_days: string[]
  location: {
    lat: string
    lan: string
  }
  TractorInStore: TractorInStore[]
}

interface TractorInStore {
  id: string
  baseTractorId: string
  hourly_price: number
  store_id: string
  baseTractor: {
    id: string
    name: string
    description: string
    model: string
    type: string
    year: string
    images: string[]
  }
}

interface DeviceLocationData {
  id?: string
  _id?: { $oid: string }
  device_imei?: string
  imei?: string
  latitude?: number
  longitude?: number
  lat?: number
  lon?: number
  speed?: number
  heading?: number
  course?: number
  altitude?: number
  accuracy?: number
  timestamp?: string
  created_at?: string
  battery_level?: number
  signal_strength?: number
  satellites?: number
  hdop?: number
  updated_at?: string
}

interface LocationHistoryParams {
  startDate?: string
  endDate?: string
  limit?: number
}

class DeviceApiService {
  private static getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      // Get access_token from cookies (same approach as owner.tsx)
      const cookies = document.cookie.split(";")
      const accessTokenCookie = cookies.find((cookie) => cookie.trim().startsWith("access_token="))
      if (accessTokenCookie) {
        return accessTokenCookie.split("=")[1]
      }
    }
    return null
  }

  static async getAllDevices(): Promise<Device[]> {
    try {
      const access_token = this.getAuthToken()

      const response = await renderInstance.get("/store/getalltractordevices", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      if (Array.isArray(response.data)) {
        return response.data
      }
      if (response.data && Array.isArray((response.data as any).data)) {
        return (response.data as any).data
      }
      if (response.data && Array.isArray((response.data as any).devices)) {
        return (response.data as any).devices
      }
      return []
    } catch (error) {
      console.error("Error fetching devices:", error)
      return []
    }
  }

  static async getAllStores(): Promise<Store[]> {
    try {
      const access_token = this.getAuthToken()

      const response = await renderInstance.get("/store/byowners", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      return response.data || []
    } catch (error) {
      console.error("Error fetching stores:", error)
      throw error
    }
  }

  static async addDeviceToTractor(deviceId: string, tractorId: string): Promise<void> {
    try {
      const access_token = this.getAuthToken()

      const payload = {
        device_id: deviceId,
        tractor_id: tractorId,
      }

      await renderInstance.post("/store/addDevicetoTractor", payload, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    } catch (error) {
      console.error("Error adding device:", error)
      throw error
    }
  }

  static async removeDevice(deviceId: string): Promise<void> {
    try {
      const access_token = this.getAuthToken()

      await renderInstance.delete(`/store/removeDevice/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    } catch (error) {
      console.error("Error removing device:", error)
      throw error
    }
  }

  static async getDeviceLocationHistory(imei: string, params?: LocationHistoryParams): Promise<DeviceLocationData[]> {
    return DeviceLocationService.getDeviceLocationHistory(imei, params || {}, "SW")
  }

  static async getCurrentDeviceLocation(imei: string): Promise<DeviceLocationData | null> {
    return DeviceLocationService.getCurrentDeviceLocation(imei, "SW")
  }
}

export default DeviceApiService
export type { Device, Store, TractorInStore, DeviceLocationData, LocationHistoryParams }
