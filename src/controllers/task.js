import { Task } from "../models/task.js";
import { User } from "../models/user.js";
import { sendTaskStatusChangeEmail } from "../utils/email-service.js";
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from "../utils/error-handler.js";
import {
	sanitizeInput,
	validateComment,
	validateDate,
	validateRequiredFields,
	validateTaskBucket,
	validateTaskPriority,
	validateTaskStatus,
	validateUserIds,
} from "../utils/validators.js";

export function getCompletedCutoffDate(timeframe = "2weeks") {
	const now = Date.now();
	const timeframeMap = {
		"2weeks": 14 * 24 * 60 * 60 * 1000,
		"1month": 30 * 24 * 60 * 60 * 1000,
		"2months": 60 * 24 * 60 * 60 * 1000,
		"3months": 90 * 24 * 60 * 60 * 1000,
	};
	const duration = timeframeMap[timeframe] || timeframeMap["2weeks"];
	return new Date(now - duration);
}

// Background cleanup: tasks completed older than 3 months (90 days) deleted asynchronously
export function triggerOldTasksCleanup() {
	setImmediate(async () => {
		try {
			const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
			const result = await Task.deleteMany({
				status: "Completed",
				$or: [
					{ completedAt: { $lt: threeMonthsAgo } },
					{ completedAt: null, updatedAt: { $lt: threeMonthsAgo } },
				],
			});
			if (result.deletedCount > 0) {
				console.log(
					`[Task Cleanup] Purged ${result.deletedCount} completed tasks older than 3 months`,
				);
			}
		} catch (err) {
			console.error("[Task Cleanup Error]", err.message);
		}
	});
}

export async function createTask(req, res, next) {
	try {
		const {
			title,
			description = "",
			bucket,
			status = "Not Started",
			dueDate = null,
			priority = "Medium",
			assignedTo = [],
			tags = [],
		} = req.body;

		if (
			!req.user.isAdmin() &&
			assignedTo.length > 0 &&
			!assignedTo.every((id) => id.toString() === req.user._id.toString())
		) {
			throw new BadRequestError("Only Admins can assign tasks to others");
		}

		validateRequiredFields(req.body, ["title", "bucket"]);
		validateTaskBucket(bucket);

		if (status) {
			validateTaskStatus(status);
		}

		if (priority) {
			validateTaskPriority(priority);
		}

		if (dueDate) {
			validateDate(dueDate);
		}

		// Handle "assign to all" scenario
		let assignedToArray = [];
		let assignToAll = false;

		if (Array.isArray(assignedTo)) {
			assignedToArray = assignedTo;
		} else if (assignedTo === "all" || assignedTo === true) {
			assignToAll = true;
		}

		if (!assignToAll && !assignedToArray.length) {
			throw new BadRequestError("Tasks must be assigned to someone");
		}

		// Validate assigned user IDs exist
		if (assignedToArray.length > 0) {
			const users = await User.find({ _id: { $in: assignedToArray } });
			if (users.length !== assignedToArray.length) {
				throw new BadRequestError("One or more assigned user IDs are invalid");
			}
		}

		// Get highest position in bucket for new task
		const lastTask = await Task.findOne({ bucket }).sort({ position: -1 });
		const newPosition = lastTask ? lastTask.position + 1 : 0;

		// Create task
		const task = new Task({
			title: sanitizeInput(title),
			description: sanitizeInput(description),
			bucket,
			status,
			priority,
			dueDate: dueDate ? new Date(dueDate) : null,
			assignedTo: assignedToArray,
			assignedToAll: assignToAll,
			position: newPosition,
			bucketPosition: newPosition,
			createdBy: req.user._id,
			tags: tags
				.filter((tag) => typeof tag === "string")
				.map((tag) => tag.trim()),
		});

		await task.save();
		await task.populate(["assignedTo", "createdBy", "comments.author"]);

		res.status(201).json({
			success: true,
			message: "Task created successfully",
			task,
		});
	} catch (error) {
		next(error);
	}
}

export async function getTasks(req, res, next) {
	try {
		const {
			bucket,
			status,
			assigned,
			sort = "position",
			order = 1,
			completedTimeframe = "2weeks",
		} = req.query;

		// Trigger fire-and-forget purge of completed tasks older than 3 months
		triggerOldTasksCleanup();

		const cutoffDate = getCompletedCutoffDate(completedTimeframe);
		const conditions = [];

		// Build filter based on user role
		if (!req.user.isAdmin()) {
			conditions.push({
				$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
			});
		}

		// Apply bucket filter
		if (bucket) {
			conditions.push({ bucket });
		}

		// Admin can filter by specific assigned user
		if (assigned && req.user.isAdmin()) {
			conditions.push({ assignedTo: assigned });
		}

		// Handle status & completed tasks timeframe
		if (status === "Completed") {
			conditions.push({ status: "Completed" });
			conditions.push({
				$or: [
					{ completedAt: { $gte: cutoffDate } },
					{ completedAt: null, updatedAt: { $gte: cutoffDate } },
				],
			});
		} else if (status) {
			conditions.push({ status });
		} else {
			// By default: all pending tasks fully fetched, completed tasks limited by cutoff date
			conditions.push({
				$or: [
					{
						status: {
							$in: ["Not Started", "In Progress", "In Review"],
						},
					},
					{
						status: "Completed",
						$or: [
							{ completedAt: { $gte: cutoffDate } },
							{ completedAt: null, updatedAt: { $gte: cutoffDate } },
						],
					},
				],
			});
		}

		const query = conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

		// Build sort object
		const sortObj = {};
		sortObj[sort] = parseInt(order, 10);

		const tasks = await Task.find(query)
			.sort(sortObj)
			.populate(["assignedTo", "createdBy", "updatedBy", "comments.author"]);

		res.status(200).json({
			success: true,
			count: tasks.length,
			completedTimeframe,
			tasks,
		});
	} catch (error) {
		next(error);
	}
}

export async function getTaskById(req, res, next) {
	try {
		const { id } = req.params;

		const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
		const query = isObjectId ? { _id: id } : { ticketId: id.toUpperCase() };

		const task = await Task.findOne(query).populate([
			"assignedTo",
			"createdBy",
			"updatedBy",
			"comments.author",
		]);

		if (!task) {
			throw new NotFoundError("Task");
		}

		// Check access permission
		if (!req.user.isAdmin() && !task.isAssignedTo(req.user._id)) {
			throw new ForbiddenError("You do not have access to this task");
		}

		res.status(200).json({
			success: true,
			task,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateTask(req, res, next) {
	try {
		const { id } = req.params;
		const { title, description, bucket, priority, dueDate, tags, assignedTo } =
			req.body;

		const task = await Task.findById(id);

		if (!task) {
			throw new NotFoundError("Task");
		}

		if (
			task.createdBy._id.toString() !== req.user._id.toString() &&
			req.user.role !== "Admin"
		) {
			throw new BadRequestError(
				"You can only update tasks created by yourself.",
			);
		}

		// Update allowed fields
		if (title !== undefined) {
			task.title = sanitizeInput(title);
		}

		if (description !== undefined) {
			task.description = sanitizeInput(description);
		}

		if (bucket !== undefined) {
			validateTaskBucket(bucket);
			task.bucket = bucket;
		}

		if (priority !== undefined) {
			validateTaskPriority(priority);
			task.priority = priority;
		}

		if (dueDate !== undefined) {
			if (dueDate) {
				validateDate(dueDate);
				task.dueDate = new Date(dueDate);
			} else {
				task.dueDate = null;
			}
		}

		if (tags !== undefined) {
			task.tags = tags
				.filter((tag) => typeof tag === "string")
				.map((tag) => tag.trim());
		}

		if (assignedTo?.length) {
			validateUserIds(assignedTo);
			task.assignedTo = assignedTo;
		}

		task.updatedBy = req.user._id;
		await task.save();
		await task.populate(["assignedTo", "createdBy", "updatedBy", "comments.author"]);

		res.status(200).json({
			success: true,
			message: "Task updated successfully",
			task,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateTaskStatus(req, res, next) {
	try {
		const { id } = req.params;
		const { status } = req.body;

		// Validate status
		if (!status) {
			throw new BadRequestError("Status is required");
		}

		validateTaskStatus(status);

		const task = await Task.findById(id);

		if (!task) {
			throw new NotFoundError("Task");
		}

		// Check permission (already handled by middleware, but double-check)
		if (!req.user.isAdmin() && !task.isAssignedTo(req.user._id)) {
			throw new ForbiddenError(
				"You can only update status for your assigned tasks",
			);
		}

		const oldStatus = task.status;
		task.status = status;
		task.updatedBy = req.user._id;

		// completedAt is set automatically by pre-save middleware
		await task.save();
		await task.populate(["assignedTo", "createdBy", "updatedBy", "comments.author"]);

		// Send status change notification to all assignees
		if (oldStatus !== status) {
			const assignees = task.assignedToAll
				? await User.find({ isActive: true })
				: await User.find({ _id: { $in: task.assignedTo } });

			for (const assignee of assignees) {
				await sendTaskStatusChangeEmail(
					assignee.email,
					task.title,
					status,
					task._id,
				);
			}
		}

		res.status(200).json({
			success: true,
			message: `Task status updated from '${oldStatus}' to '${status}'`,
			task,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateTaskPosition(req, res, next) {
	try {
		const { id } = req.params;
		const { position, bucket } = req.body;

		if (position === undefined) {
			throw new BadRequestError("Position is required");
		}

		if (typeof position !== "number" || position < 0) {
			throw new BadRequestError("Position must be a non-negative number");
		}

		const task = await Task.findById(id);

		if (!task) {
			throw new NotFoundError("Task");
		}

		// If bucket is changing, validate it
		if (bucket !== undefined) {
			validateTaskBucket(bucket);
			task.bucket = bucket;
		}

		task.position = position;
		task.bucketPosition = position;
		task.updatedBy = req.user._id;

		await task.save();
		await task.populate(["assignedTo", "createdBy", "updatedBy", "comments.author"]);

		res.status(200).json({
			success: true,
			message: "Task position updated",
			task,
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteTask(req, res, next) {
	try {
		const { id } = req.params;

		const task = await Task.findByIdAndDelete(id);

		if (!task) {
			throw new NotFoundError("Task");
		}

		res.status(200).json({
			success: true,
			message: "Task deleted successfully",
		});
	} catch (error) {
		next(error);
	}
}

export async function getTasksByBucket(req, res, next) {
	try {
		const { bucketName } = req.params;
		const { completedTimeframe = "2weeks" } = req.query;

		// Trigger fire-and-forget purge of completed tasks older than 3 months
		triggerOldTasksCleanup();

		if (bucketName !== "All") {
			validateTaskBucket(bucketName);
		}

		const cutoffDate = getCompletedCutoffDate(completedTimeframe);
		const statuses = [
			"Not Started",
			"In Progress",
			"In Review",
			"Completed",
		];
		const result = {};

		for (const status of statuses) {
			const conditions = [{ status }];

			if (bucketName !== "All") {
				conditions.push({ bucket: bucketName });
			}

			// Members only see assigned tasks
			if (!req.user.isAdmin()) {
				conditions.push({
					$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
				});
			}

			// Completed tasks filtered by cutoff date (2 weeks default, up to 3 months)
			if (status === "Completed") {
				conditions.push({
					$or: [
						{ completedAt: { $gte: cutoffDate } },
						{ completedAt: null, updatedAt: { $gte: cutoffDate } },
					],
				});
			}

			const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

			const tasks = await Task.find(query)
				.sort({ position: 1 })
				.populate(["assignedTo", "createdBy", "updatedBy", "comments.author"]);

			result[status] = tasks;
		}

		res.status(200).json({
			success: true,
			bucket: bucketName,
			completedTimeframe,
			statuses: result,
		});
	} catch (error) {
		next(error);
	}
}

export async function addComment(req, res, next) {
	try {
		const { id } = req.params;
		const { text = "", image = null } = req.body;

		validateComment(text, image);

		const task = await Task.findById(id);

		if (!task) {
			throw new NotFoundError("Task");
		}

		// RBAC: Admin or assigned member can comment
		if (!req.user.isAdmin() && !task.isAssignedTo(req.user._id)) {
			throw new ForbiddenError(
				"You do not have permission to comment on this task",
			);
		}

		const newComment = {
			author: req.user._id,
			text: typeof text === "string" ? text.trim() : "",
			image: image || null,
			createdAt: new Date(),
		};

		task.comments.push(newComment);
		task.updatedBy = req.user._id;

		await task.save();
		await task.populate([
			"assignedTo",
			"createdBy",
			"updatedBy",
			"comments.author",
		]);

		const createdComment = task.comments[task.comments.length - 1];

		res.status(201).json({
			success: true,
			message: "Comment added successfully",
			task,
			comment: createdComment,
		});
	} catch (error) {
		next(error);
	}
}

export async function deleteComment(req, res, next) {
	try {
		const { id, commentId } = req.params;

		const task = await Task.findById(id);

		if (!task) {
			throw new NotFoundError("Task");
		}

		const comment = task.comments.id(commentId);

		if (!comment) {
			throw new NotFoundError("Comment");
		}

		// RBAC: Admin or comment author can delete
		if (
			!req.user.isAdmin() &&
			comment.author.toString() !== req.user._id.toString()
		) {
			throw new ForbiddenError(
				"You do not have permission to delete this comment",
			);
		}

		task.comments.pull(commentId);
		task.updatedBy = req.user._id;

		await task.save();
		await task.populate([
			"assignedTo",
			"createdBy",
			"updatedBy",
			"comments.author",
		]);

		res.status(200).json({
			success: true,
			message: "Comment deleted successfully",
			task,
		});
	} catch (error) {
		next(error);
	}
}

