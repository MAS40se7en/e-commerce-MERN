import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.mode === "development" ? process.env.BASE_URL : "/api",
    withCredentials: true
});

export default axiosInstance;