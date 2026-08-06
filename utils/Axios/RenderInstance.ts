import axios from "axios";

export const NestJsBaseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://holatractor-backend-render.onrender.com/";
export const DeviceBaseURL = "https://device.holatractor.com/";

export const renderInstance = axios.create({
  baseURL: NestJsBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});
