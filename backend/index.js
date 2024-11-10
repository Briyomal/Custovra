//const express =  require('express');
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.get("/", (req, res) => {
	res.send("hello World!");
});

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
	connectDB();
	console.log("server is running on port: ", PORT);
});

