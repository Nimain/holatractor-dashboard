import axios from "axios";

export const renderInstance = axios.create({
    baseURL: "https://holatractor-bookingapp.onrender.com",
    // baseURL: "http://localhost:5000",
    headers: {
        "Content-Type": "application/json",
    }
})