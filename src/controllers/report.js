import { Task } from "../models/task.js";
import { BadRequestError } from "../utils/error-handler.js";

export async function getOverdueTasks(req, res, next) {
	try {
		const { bucket, assigned } = req.query;

		let query = {
			dueDate: { $lt: new Date() },
			status: { $ne: "Completed" },
		};

		// Members only see their own overdue tasks
		if (!req.user.isAdmin()) {
			query = {
				...query,
				$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
			};
		}

		// Admin can filter by specific user
		if (assigned && req.user.isAdmin()) {
			query.assignedTo = assigned;
		}

		// Filter by bucket if provided
		if (bucket) {
			query.bucket = bucket;
		}

		const tasks = await Task.find(query)
			.sort({ dueDate: 1 }) // Sort by due date ascending (earliest overdue first)
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

export async function getDueToday(req, res, next) {
	try {
		const { bucket, assigned } = req.query;

		// Define today's date range
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date();
		endOfDay.setHours(23, 59, 59, 999);

		let query = {
			dueDate: {
				$gte: startOfDay,
				$lte: endOfDay,
			},
			status: { $ne: "Completed" },
		};

		// Members only see their own due-today tasks
		if (!req.user.isAdmin()) {
			query = {
				...query,
				$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
			};
		}

		// Admin can filter by specific user
		if (assigned && req.user.isAdmin()) {
			query.assignedTo = assigned;
		}

		// Filter by bucket if provided
		if (bucket) {
			query.bucket = bucket;
		}

		const tasks = await Task.find(query)
			.sort({ priority: -1, dueDate: 1 }) // Sort by priority and due time
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

export async function getFutureDatedTasks(req, res, next) {
	try {
		const { bucket, assigned, days } = req.query;

		let query = {
			dueDate: { $gt: new Date() },
			status: { $ne: "Completed" },
		};

		// If days parameter provided, limit to that range
		if (days && !Number.isNaN(parseInt(days, 10))) {
			const daysInt = parseInt(days, 10);

			if (daysInt < 0) {
				throw new BadRequestError("Days parameter must be a positive number");
			}

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + daysInt);

			query.dueDate = {
				$gt: new Date(),
				$lte: futureDate,
			};
		}

		// Members only see their own future tasks
		if (!req.user.isAdmin()) {
			query = {
				...query,
				$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
			};
		}

		// Admin can filter by specific user
		if (assigned && req.user.isAdmin()) {
			query.assignedTo = assigned;
		}

		// Filter by bucket if provided
		if (bucket) {
			query.bucket = bucket;
		}

		const tasks = await Task.find(query)
			.sort({ dueDate: 1 }) // Sort by due date ascending
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

export async function getTaskSummary(req, res, next) {
	try {
		// Define today's date range
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date();
		endOfDay.setHours(23, 59, 59, 999);

		let baseQuery = {
			status: { $ne: "Completed" },
		};

		// Members only see their assigned tasks
		if (!req.user.isAdmin()) {
			baseQuery = {
				...baseQuery,
				$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
			};
		}

		// Fetch overdue tasks
		const overdue = await Task.find({
			...baseQuery,
			dueDate: { $lt: new Date() },
		})
			.sort({ dueDate: 1 })
			.populate(["assignedTo", "createdBy"]);

		// Fetch due today
		const dueToday = await Task.find({
			...baseQuery,
			dueDate: {
				$gte: startOfDay,
				$lte: endOfDay,
			},
		})
			.sort({ dueDate: 1 })
			.populate(["assignedTo", "createdBy"]);

		// Fetch future-dated
		const future = await Task.find({
			...baseQuery,
			dueDate: { $gt: endOfDay },
		})
			.sort({ dueDate: 1 })
			.populate(["assignedTo", "createdBy"]);

		const completed = await Task.find({ status: "Completed" })
			.sort({ completedAt: 1 })
			.populate(["assignedTo", "createdBy"]);

		res.status(200).json({
			success: true,
			overdue: {
				count: overdue.length,
				tasks: overdue,
			},
			dueToday: {
				count: dueToday.length,
				tasks: dueToday,
			},
			future: {
				count: future.length,
				tasks: future,
			},
			completed: {
				count: completed.length,
				tasks: completed,
			},
			total:
				overdue.length + dueToday.length + future.length + completed.length,
		});
	} catch (error) {
		next(error);
	}
}

export async function getTasksByStatus(req, res, next) {
	try {
		const { bucket } = req.query;

		let baseQuery = {};

		// Members only see their assigned tasks
		if (!req.user.isAdmin()) {
			baseQuery = {
				$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
			};
		}

		if (bucket) {
			baseQuery.bucket = bucket;
		}

		const notStarted = await Task.find({
			...baseQuery,
			status: "Not Started",
		}).populate(["assignedTo", "createdBy"]);

		const inProgress = await Task.find({
			...baseQuery,
			status: "In Progress",
		}).populate(["assignedTo", "createdBy"]);

		const inReview = await Task.find({
			...baseQuery,
			status: "In Review",
		}).populate(["assignedTo", "createdBy"]);

		const completed = await Task.find({
			...baseQuery,
			status: "Completed",
		}).populate(["assignedTo", "createdBy"]);

		res.status(200).json({
			success: true,
			notStarted: {
				count: notStarted.length,
				tasks: notStarted,
			},
			inProgress: {
				count: inProgress.length,
				tasks: inProgress,
			},
			inReview: {
				count: inReview.length,
				tasks: inReview,
			},
			completed: {
				count: completed.length,
				tasks: completed,
			},
			total:
				notStarted.length +
				inProgress.length +
				inReview.length +
				completed.length,
		});
	} catch (error) {
		next(error);
	}
}

export async function getMyTasks(req, res, next) {
	try {
		const { status, bucket, sort = "dueDate" } = req.query;

		const query = {
			$or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
		};

		// Filter by status if provided
		if (status) {
			query.status = status;
		}

		// Filter by bucket if provided
		if (bucket) {
			query.bucket = bucket;
		}

		// Build sort object
		const sortObj = {};
		sortObj[sort] = 1;

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
