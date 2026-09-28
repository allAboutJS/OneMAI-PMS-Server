import express from "express";
import {
	addAssignee,
	assignTask,
	bulkAssign,
	clearAssignments,
	getTaskAssignees,
	removeAssignee,
} from "../controllers/assignment.js";
import {
	getDueToday,
	getFutureDatedTasks,
	getMyTasks,
	getOverdueTasks,
	getTaskSummary,
	getTasksByStatus,
} from "../controllers/report.js";
import {
	addComment,
	createTask,
	deleteComment,
	deleteTask,
	getTaskById,
	getTasks,
	getTasksByBucket,
	updateTask,
	updateTaskPosition,
	updateTaskStatus,
} from "../controllers/task.js";
import { authenticate } from "../middleware/auth.js";
import {
	allowStatusUpdate,
	requireAdmin,
	requireMember,
	requireTaskAssignment,
} from "../middleware/rbac.js";

const router = express.Router();

// General task collection routes
router.post("/", authenticate, requireMember, createTask);
router.get("/", authenticate, requireMember, getTasks);

// Specific bucket and report routes (MUST be before /:id wildcard)
router.get(
	"/bucket/:bucketName",
	authenticate,
	requireMember,
	getTasksByBucket,
);

router.get("/reports/overdue", authenticate, getOverdueTasks);
router.get("/reports/due-today", authenticate, getDueToday);
router.get("/reports/future", authenticate, getFutureDatedTasks);
router.get("/reports/summary", authenticate, getTaskSummary);
router.get("/reports/by-status", authenticate, getTasksByStatus);
router.get("/reports/my-tasks", authenticate, getMyTasks);

// Comments routes
router.post("/:id/comments", authenticate, requireMember, addComment);
router.delete(
	"/:id/comments/:commentId",
	authenticate,
	requireMember,
	deleteComment,
);

// Task status & position updates
router.patch("/:id/status", authenticate, allowStatusUpdate, updateTaskStatus);
router.patch("/:id/position", authenticate, requireMember, updateTaskPosition);

// Assignment routes
router.post("/:id/assign", authenticate, requireTaskAssignment, assignTask);
router.post(
	"/:id/assign/add/:userId",
	authenticate,
	requireTaskAssignment,
	addAssignee,
);
router.delete(
	"/:id/assign/:userId",
	authenticate,
	requireTaskAssignment,
	removeAssignee,
);
router.post(
	"/:id/assign/bulk",
	authenticate,
	requireTaskAssignment,
	bulkAssign,
);
router.delete(
	"/:id/assign",
	authenticate,
	requireTaskAssignment,
	clearAssignments,
);
router.get("/:id/assignees", authenticate, requireMember, getTaskAssignees);

// Single task CRUD by ID (wildcard)
router.get("/:id", authenticate, requireMember, getTaskById);
router.patch("/:id", authenticate, requireMember, updateTask);
router.delete("/:id", authenticate, requireAdmin, deleteTask);

export default router;
