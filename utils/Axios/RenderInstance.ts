import axios from "axios";

export const renderInstance = axios.create({
    // baseURL: "https://holatractor-bookingapp.onrender.com",
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    }
})