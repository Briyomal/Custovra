import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";


import { connectDB } from "./../db/connectDB.js";

import authRoutes from "./../routes/auth.route.js";
import userRoutes from "./../routes/user.route.js";
import subscriptionRoutes from "./../routes/subscription.route.js";
import formRoutes from "./../routes/form.route.js";
import formFieldRoutes from "./../routes/formField.route.js";
import employeeRoutes from "./../routes/employee.route.js";
import responseRoutes from "./../routes/response.route.js";
import submissionRoutes from "./../routes/submission.route.js";
import reportRoutes from "./../routes/report.route.js";
import profileRoutes from "./../routes/profile.route.js";
import supportRoutes from "./../routes/support.route.js";
// Removed Stripe-related imports
import manualPaymentRoutes from "./../routes/manualPayment.route.js";
import manualPlanRoutes from "./../routes/manualPlan.route.js";
import manualSubscriptionRoutes from "./../routes/manualSubscription.route.js";
import manualBillingRoutes from "./../routes/manualBilling.route.js";

import { fileURLToPath } from 'url';
import path from 'path';
import './../utils/cronJobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.get("/", (req, res) => {
	res.send("hello World!");
});

/*
app.use(cors({ 
  origin: "https://review-app-front-iota.vercel.app", 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true 
}));
*/

app.use(cors({
  origin: 'https://www.acdreviewplatform.com', // Replace with your frontend's URL
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  crossDomain: true,
  xhrFields: { withCredentials: true },
  credentials: true,
}));


app.use('/public', express.static(path.join(__dirname, 'public')));

// Removed Stripe webhook handler
// app.use("/api/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

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
// Removed Stripe payment routes
// app.use("/api/payments", paymentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/support", supportRoutes);
app.use('/api/manual-payments', manualPaymentRoutes);
app.use('/api/manual-plans', manualPlanRoutes);
app.use('/api/manual-subscriptions', manualSubscriptionRoutes);
app.use('/api/manual-billing', manualBillingRoutes);

/*
app.listen(PORT, () => {
	connectDB();
	console.log("server is running on port: ", PORT);
});
*/


connectDB();
// Export app instead of listening on a port
export default app;