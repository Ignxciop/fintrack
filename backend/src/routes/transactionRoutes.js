import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from "../controllers/transactionController.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getAllTransactions);
router.get("/:id", getTransactionById);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
