import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import formRoutes from "./routes/form.route.js";
import formFieldRoutes from "./routes/formField.route.js";
import employeeRoutes from "./routes/employee.route.js";
import responseRoutes from "./routes/response.route.js";
import submissionRoutes from "./routes/submission.route.js";
import reportRoutes from "./routes/report.route.js";
import profileRoutes from "./routes/profile.route.js";
import usageRoutes from "./routes/usage.route.js";
import supportRoutes from "./routes/support.route.js";
import planDowngradeRoutes from "./routes/planDowngrade.route.js";
import manualPlanRoutes from "./routes/manualPlan.route.js";
import manualBillingRoutes from "./routes/manualBilling.route.js";

import genieRoutes from "./routes/genie.route.js";
import { handleGeniePaymentWebhook } from "./controllers/genieController.js";
import { polarWebhook } from "./controllers/polarWebhook.controller.js";


import polarRoutes from "./routes/polar.route.js";

import { fileURLToPath } from "url";
import path from "path";
import "./utils/cronJobs.js";

dotenv.config();
console.log("Using Genie Key:", process.env.GENIE_SECRET_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS CONFIG ---
const allowedOrigins = [
    process.env.CLIENT_URL,        // https://localhost:5173
    process.env.CLIENT_URL_NGROK,  // https://xxxxx.ngrok-free.dev
    "https://custovra.com", 
    "https://www.custovra.com",
];


const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman / server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.error("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.set("trust proxy", 1);


// Static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Webhook routes BEFORE body parser
app.use("/api/genie/webhook", express.raw({ type: "application/json" }), handleGeniePaymentWebhook);
// webhook route ONLY
app.post(
  "/api/polar/webhook",
  express.raw({ type: "application/json" }),
  polarWebhook
);


// Normal JSON parsing
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/form-fields", formFieldRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/responses", responseRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/plan-downgrade", planDowngradeRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/manual-plans", manualPlanRoutes);
app.use("/api/manual-billing", manualBillingRoutes);
app.use("/api/genie", genieRoutes);
app.use("/api/polar", polarRoutes);

// --- START HTTP SERVER ---
app.listen(PORT, () => {
    connectDB();
    console.log(`HTTP Server running on http://localhost:${PORT}`);
});

