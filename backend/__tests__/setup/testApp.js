import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "../../src/routes/authRoutes.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";

dotenv.config({ quiet: true });

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use(errorHandler);

export default app;
