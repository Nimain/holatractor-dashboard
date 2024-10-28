import axios from "axios";

export const renderInstance = axios.create({
    // baseURL: "http://localhost:5000",
    baseURL: "http://20.108.32.36/api",
    headers: {
        "Content-Type": "application/json",
    }
})