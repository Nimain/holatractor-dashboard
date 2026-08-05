import axios from "axios";

export const NestJsBaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/"
export const DeviceBaseURL = "https://device.holatractor.com/"

// export const NestJsBaseURL = "http://localhost:5000/"

export const renderInstance = axios.create({
  baseURL: NestJsBaseURL,
  headers: {
    "Content-Type": "application/json",
  }
}) 
