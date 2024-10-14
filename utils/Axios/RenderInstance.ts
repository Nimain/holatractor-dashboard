import axios from "axios";

export const renderInstance = axios.create({
    // baseURL: "https://holatractor-bookingapp.onrender.com",
    baseURL: "http://20.108.32.36/api",
    headers: {
        "Content-Type": "application/json",
    }
})