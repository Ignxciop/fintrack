import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/authRoutes.js";
import accountRoutes from "./src/routes/accountRoutes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import recurringRoutes from "./src/routes/recurringRoutes.js";
import budgetRoutes from "./src/routes/budgetRoutes.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import logger from "./src/config/logger.js";
import { startRecurringCron } from "./src/jobs/recurringCron.js";

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
app.use("/api/categories", categoryRoutes);
app.use("/api/recurrings", recurringRoutes);
app.use("/api/budgets", budgetRoutes);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);

    // Iniciar cron job para procesar recurrentes
    startRecurringCron();
});
