import axios from "axios";

// export const NestJsBaseURL = "https://holatractor-backend-render.onrender.com/"
  export const NestJsBaseURL = "http://localhost:5000/"

export const renderInstance = axios.create({
    baseURL: NestJsBaseURL,
    headers: {
        "Content-Type": "application/json",
    }
}) 
