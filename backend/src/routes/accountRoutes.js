import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
    getAllAccounts,
    getAccountSummary,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
} from "../controllers/accountController.js";

const router = express.Router();

router.get("/", authenticate, getAllAccounts);
router.get("/summary", authenticate, getAccountSummary);
router.get("/:id", authenticate, getAccountById);
router.post("/", authenticate, createAccount);
router.put("/:id", authenticate, updateAccount);
router.delete("/:id", authenticate, deleteAccount);

export default router;
