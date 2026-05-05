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
	validateDate,
	validateRequiredFields,
	validateTaskBucket,
	validateTaskPriority,
	validateTaskStatus,
	validateUserIds,
} from "../utils/validators.js";

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
			throw new BadRequestError("Tasks must be assined to someone");
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
		await task.populate(["assignedTo", "createdBy"]);

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
		} = req.query;

		let query = {};

		// Build filter based on user role
		if (!req.user.isAdmin()) {
			// Members only see tasks assigned to them
			query = {
				$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
			};
		}

		// Apply additional filters
		if (bucket) {
			query.bucket = bucket;
		}

		if (status) {
			query.status = status;
		}

		// Admin can filter by specific assigned user
		if (assigned && req.user.isAdmin()) {
			query.assignedTo = assigned;
		}

		// Build sort object
		const sortObj = {};
		sortObj[sort] = parseInt(order, 10);

		const tasks = await Task.find(query)
			.sort(sortObj)
			.populate(["assignedTo", "createdBy", "updatedBy"]);

		res.status(200).json({
			success: true,
			count: tasks.length,
			tasks,
		});
	} catch (error) {
		next(error);
	}
}

export async function getTaskById(req, res, next) {
	try {
		const { id } = req.params;

		const task = await Task.findById(id).populate([
			"assignedTo",
			"createdBy",
			"updatedBy",
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
		await task.populate(["assignedTo", "createdBy", "updatedBy"]);

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
		await task.populate(["assignedTo", "createdBy", "updatedBy"]);

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
		await task.populate(["assignedTo", "createdBy", "updatedBy"]);

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
		let query = {};

		if (bucketName !== "All") {
			validateTaskBucket(bucketName);
			query.bucket = bucketName;
		}

		const statuses = ["Not Started", "In Progress", "Completed"];
		const result = {};

		for (const status of statuses) {
			query.status = status;

			// Members only see assigned tasks
			if (!req.user.isAdmin()) {
				query =
					bucketName === "All"
						? {
								$and: [
									{ status },
									{
										$or: [
											{ assignedTo: req.user._id },
											{ assignedToAll: true },
										],
									},
								],
							}
						: {
								$and: [
									{ bucket: bucketName, status },
									{
										$or: [
											{ assignedTo: req.user._id },
											{ assignedToAll: true },
										],
									},
								],
							};
			}

			const tasks = await Task.find(query)
				.sort({ position: 1 })
				.populate(["assignedTo", "createdBy", "updatedBy"]);

			result[status] = tasks;
		}

		res.status(200).json({
			success: true,
			bucket: bucketName,
			statuses: result,
		});
	} catch (error) {
		next(error);
	}
}
