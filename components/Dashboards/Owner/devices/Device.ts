import { renderInstance } from "@/utils/Axios/RenderInstance"
import axios from "axios"
import DeviceLocationService from "@/utils/Axios/DeviceLocationService"
import type { DeviceLocationData, LocationHistoryParams } from "@/utils/Axios/DeviceLocationService"
import { getAuthToken, getAuthUser, getAuthUserId } from "@/utils/auth/clientAuth"

interface Device {
  id: string
  device_imei: string
  device_region?: string
  base_id: string
  tractor_store_id: string
  createdAt: string
  updatedAt: string
  store?: {
    id: string
    name: string
    owner_user_id?: string
    created_by?: string
  }
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
class DeviceApiService {
  private static getAuthToken(): string | null {
    const clientToken = getAuthToken()
    if (clientToken) return clientToken

    if (typeof window !== "undefined") {
      const cookies = document.cookie.split(";")
      const accessTokenCookie = cookies.find((cookie) => cookie.trim().startsWith("access_token="))
      if (accessTokenCookie) {
        return accessTokenCookie.split("=")[1]
      }
    }
    return null
  }

  static async getAllDevices(ownerId?: string): Promise<Device[]> {
    try {
      const access_token = this.getAuthToken()
      const targetId = ownerId || getAuthUserId() || getAuthUser()?.id || getAuthUser()?.userId

      const url = targetId
        ? `/store/getalltractordevices/${encodeURIComponent(targetId)}`
        : "/store/getalltractordevices"

      const response = await renderInstance.get(url, {
        headers: access_token
          ? {
              Authorization: `Bearer ${access_token}`,
            }
          : undefined,
        params: targetId ? { owner_id: targetId, user_id: targetId } : undefined,
      })

      let list: Device[] = []
      if (Array.isArray(response.data)) {
        list = response.data
      } else if (response.data && Array.isArray((response.data as any).data)) {
        list = (response.data as any).data
      } else if (response.data && Array.isArray((response.data as any).devices)) {
        list = (response.data as any).devices
      }

      return list
    } catch (error) {
      console.error("Error fetching devices:", error)
      return []
    }
  }

  static async getAllStores(ownerId?: string): Promise<Store[]> {
    try {
      const access_token = this.getAuthToken()
      const targetId = ownerId || getAuthUserId() || getAuthUser()?.id || getAuthUser()?.userId

      const url = targetId
        ? `/store/byowners/${encodeURIComponent(targetId)}`
        : "/store/byowners"

      const response = await renderInstance.get(url, {
        headers: access_token
          ? {
              Authorization: `Bearer ${access_token}`,
            }
          : undefined,
        params: targetId ? { owner_id: targetId, user_id: targetId } : undefined,
      })
      return response.data || []
    } catch (error) {
      console.error("Error fetching stores:", error)
      throw error
    }
  }

  static async addDeviceToTractor(
    deviceId: string,
    tractorId: string,
    storeId?: string,
    deviceRegion: string = "SW"
  ): Promise<void> {
    try {
      const access_token = this.getAuthToken()

      const payload = {
        device_id: deviceId,
        tractor_id: tractorId,
        tractor_store_id: tractorId,
        store_id: storeId,
        device_region: deviceRegion,
      }

      await renderInstance.post("/store/addDevicetoTractor", payload, {
        headers: access_token
          ? {
              Authorization: `Bearer ${access_token}`,
            }
          : undefined,
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
        headers: access_token
          ? {
              Authorization: `Bearer ${access_token}`,
            }
          : undefined,
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

