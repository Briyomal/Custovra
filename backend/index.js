//const express =  require('express');
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import subscriptionRoutes from "./routes/subscription.route.js";
import paymentRoutes from "./routes/payment.route.js";
import formRoutes from "./routes/form.route.js";
import formFieldRoutes from "./routes/formField.route.js";
import employeeRoutes from "./routes/employee.route.js";
import responseRoutes from "./routes/response.route.js";
import reportRoutes from "./routes/report.route.js";
import { handleStripeWebhook  } from './controllers/payment.controller.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.get("/", (req, res) => {
	res.send("hello World!");
});


app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// app.use("/api/payments", paymentRoutes);
app.use("/api/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/form-fields', formFieldRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/payments", paymentRoutes);

app.listen(PORT, () => {
	connectDB();
	console.log("server is running on port: ", PORT);
});

