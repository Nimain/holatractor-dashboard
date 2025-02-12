import axios from "axios";

export const NestJsBaseURL = "https://farmmechanize.holatractor.com/api/"

export const renderInstance = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
        "Content-Type": "application/json",
    }
})