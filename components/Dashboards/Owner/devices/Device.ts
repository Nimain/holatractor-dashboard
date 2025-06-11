import { renderInstance } from "@/utils/Axios/RenderInstance" // Update with correct path

interface Device {
  id: string
  device_imei: string
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
      return response.data || []
    } catch (error) {
      console.error("Error fetching devices:", error)
      throw error
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
}

export default DeviceApiService
export type { Device, Store, TractorInStore }
