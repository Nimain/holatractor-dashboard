import axios from "axios";

export const NestJsBaseURL = "https://farmmechanize.holatractor.com/api/"

export const renderInstance = axios.create({
    baseURL: NestJsBaseURL,
    headers: {
        "Content-Type": "application/json",
    }
}) 
