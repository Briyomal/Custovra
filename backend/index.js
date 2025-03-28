import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import subscriptionRoutes from "./routes/subscription.route.js";
import paymentRoutes from "./routes/payment.route.js";
import formRoutes from "./routes/form.route.js";
import formFieldRoutes from "./routes/formField.route.js";
import employeeRoutes from "./routes/employee.route.js";
import responseRoutes from "./routes/response.route.js";
import submissionRoutes from "./routes/submission.route.js";
import reportRoutes from "./routes/report.route.js";
import profileRoutes from "./routes/profile.route.js";
import { handleStripeWebhook  } from './controllers/payment.controller.js';

import { fileURLToPath } from 'url';
import './utils/cronJobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
//const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
	res.json({ message: "Hello from server!" });
})


app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use('/public', express.static(path.join(__dirname, 'public')));

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
app.use('/api/submissions', submissionRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/profile", profileRoutes);

/*
// Move one level up from `backend`
const rootDir = path.resolve(__dirname, "..");  


if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(rootDir, "frontend/dist")));
	app.get("*", (req, res) =>
		res.sendFile(path.resolve(rootDir, "frontend", "dist", "index.html"))
	);
}*/
	
/*
	if (process.env.NODE_ENV === "production") {
		app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));
		app.get("*", (req, res) => 
		  res.sendFile(path.resolve(__dirname, "..", "frontend", "dist", "index.html"))
		);
	  }
	  


app.listen(PORT, () => {
	connectDB();
	console.log("server is running on port: ", PORT);
});
*/
connectDB();
export default app;