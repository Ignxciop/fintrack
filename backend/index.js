import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import accountRoutes from "./src/routes/accountRoutes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import logger from "./src/config/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
