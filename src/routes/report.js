import express from "express";
import {
	getDueToday,
	getFutureDatedTasks,
	getMyTasks,
	getOverdueTasks,
	getTaskSummary,
	getTasksByStatus,
} from "../controllers/report.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/overdue", authenticate, getOverdueTasks);
router.get("/due-today", authenticate, getDueToday);
router.get("/future", authenticate, getFutureDatedTasks);
router.get("/summary", authenticate, getTaskSummary);
router.get("/by-status", authenticate, getTasksByStatus);
router.get("/my-tasks", authenticate, getMyTasks);

export default router;
