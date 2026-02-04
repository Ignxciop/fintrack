import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const config = {
    port: process.env.PORT || 4005,
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
    jwtRefreshSecret:
        process.env.JWT_REFRESH_SECRET ||
        "your-refresh-secret-key-change-in-production",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    nodeEnv: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
