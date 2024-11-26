import axios from "axios";

// export const NestJsBaseURL = "http://localhost:5000"
export const NestJsBaseURL = "http://192.168.1.43:5000"

export const renderInstance = axios.create({
    baseURL: NestJsBaseURL,
    // baseURL: "http://20.108.32.36/api",
    headers: {
        "Content-Type": "application/json",
    }
})