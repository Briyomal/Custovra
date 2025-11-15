import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Log the configuration for debugging
console.log("🔧 Genie Client Configuration:");
console.log("   GENIE_API_BASE_URL:", process.env.GENIE_API_BASE_URL);
console.log("   GENIE_APP_ID:", process.env.GENIE_APP_ID);
console.log("   GENIE_SECRET_KEY:", process.env.GENIE_SECRET_KEY ? "Present ✅" : "Missing ❌");

const genieClient = axios.create({
  baseURL: process.env.GENIE_API_BASE_URL || "https://api.uat.geniebiz.lk",
  headers: {
    Authorization: process.env.GENIE_SECRET_KEY, // Direct API key as per Genie docs
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Application-Id": process.env.GENIE_APP_ID,
  },
});

// Add request interceptor for debugging
genieClient.interceptors.request.use(request => {
  console.log("📡 Genie API Request:");
  console.log("   URL:", request.baseURL + request.url);
  console.log("   Method:", request.method);
  console.log("   Headers:", {
    Authorization: process.env.GENIE_SECRET_KEY ? "API Key Present ✅" : "Missing ❌",
    "X-Application-Id": request.headers["X-Application-Id"],
    "Content-Type": request.headers["Content-Type"],
    "Accept": request.headers["Accept"]
  });
  console.log("   Data:", request.data);
  return request;
});

// Add response interceptor for debugging
genieClient.interceptors.response.use(
  response => {
    console.log("✅ Genie API Response:", response.status);
    console.log("   Data:", response.data);
    return response;
  },
  error => {
    console.error("❌ Genie API Request Failed:");
    console.error("   Status:", error.response?.status);
    console.error("   Status Text:", error.response?.statusText);
    console.error("   Headers:", error.response?.headers);
    console.error("   Data:", error.response?.data);
    console.error("   Request URL:", error.config?.baseURL + error.config?.url);
    console.error("   Request Method:", error.config?.method);
    return Promise.reject(error);
  }
);

export default genieClient;