import axios from "axios";

export const NestJsBaseURL = "https://holatractor-backend-render.onrender.com/"

export const renderInstance = axios.create({
    baseURL: NestJsBaseURL,
    headers: {
        "Content-Type": "application/json",
    }
}) 
