import { Task } from "../models/task.js";
import { User } from "../models/user.js";
import { sendTaskAssignmentEmail } from "../utils/email-service.js";
import { BadRequestError, NotFoundError } from "../utils/error-handler.js";
import { validateObjectId, validateUserIds } from "../utils/validators.js";

export async function assignTask(req, res) {
	const { id } = req.params;
	const { userIds = [], assignToAll = false } = req.body;
	const task = await Task.findById(id);

	if (!task) {
		throw new NotFoundError("Task");
	}

	// Handle assign to all
	if (assignToAll === true) {
		task.assignedToAll = true;
		task.assignedTo = [];
		task.updatedBy = req.user._id;
		await task.save();
		await task.populate(["assignedTo", "createdBy", "updatedBy"]);

		res.status(200).json({
			success: true,
			message: "Task assigned to all users",
			task,
		});
		return;
	}

	// Handle assign to specific users
	if (Array.isArray(userIds) && userIds.length > 0) {
		validateUserIds(userIds);

		const users = await User.find({ _id: { $in: userIds } });

		if (users.length !== userIds.length) {
			throw new BadRequestError(
				"One or more user IDs are invalid or users do not exist",
			);
		}

		// Update task assignments (avoid duplicates)
		task.assignedTo = [...new Set(userIds)];
		task.assignedToAll = false;
		task.updatedBy = req.user._id;

		await task.save();
		await task.populate(["assignedTo", "createdBy", "updatedBy"]);

		// Send assignment notification emails
		for (const user of users) {
			await sendTaskAssignmentEmail(user.email, task.title, task._id);
		}

		res.status(200).json({
			success: true,
			message: `Task assigned to ${users.length} user(s)`,
			task,
		});
		return;
	}

	throw new BadRequestError(
		"Either userIds array or assignToAll flag must be provided",
	);
}

export async function addAssignee(req, res) {
	const { id, userId } = req.params;

	validateObjectId(userId);

	const task = await Task.findById(id);

	if (!task) {
		throw new NotFoundError("Task");
	}

	const user = await User.findById(userId);

	if (!user) {
		throw new NotFoundError("User");
	}

	// Add user to assignment (prevent duplicates)
	if (!task.assignedTo.some((id) => id.toString() === userId)) {
		task.assignedTo.push(userId);
		task.assignedToAll = false;
		task.updatedBy = req.user._id;
		await task.save();
	}

	await task.populate(["assignedTo", "createdBy", "updatedBy"]);
	await sendTaskAssignmentEmail(user.email, task.title, task._id);

	res.status(200).json({
		success: true,
		message: `User ${user.name} assigned to task`,
		task,
	});
}

export async function removeAssignee(req, res) {
	const { id, userId } = req.params;

	validateObjectId(userId);

	const task = await Task.findById(id);

	if (!task) {
		throw new NotFoundError("Task");
	}

	const user = await User.findById(userId);

	if (!user) {
		throw new NotFoundError("User");
	}

	// Remove user from assignment
	const initialLength = task.assignedTo.length;
	task.assignedTo = task.assignedTo.filter(
		(assignedId) => assignedId.toString() !== userId,
	);

	if (task.assignedTo.length === initialLength) {
		throw new BadRequestError("User is not assigned to this task");
	}

	// If no one is assigned and assignedToAll is false, keep it unassigned
	task.updatedBy = req.user._id;
	await task.save();
	await task.populate(["assignedTo", "createdBy", "updatedBy"]);

	res.status(200).json({
		success: true,
		message: `User ${user.name} removed from task assignment`,
		task,
	});
}

export async function bulkAssign(req, res) {
	const { id } = req.params;
	const { userIds = [] } = req.body;

	if (!Array.isArray(userIds) || userIds.length === 0) {
		throw new BadRequestError("userIds must be a non-empty array");
	}

	validateUserIds(userIds);

	const task = await Task.findById(id);

	if (!task) {
		throw new NotFoundError("Task");
	}

	// Verify all users exist
	const users = await User.find({ _id: { $in: userIds } });

	if (users.length !== userIds.length) {
		throw new BadRequestError("One or more user IDs are invalid");
	}

	// Add new users (avoid duplicates)
	const currentAssignedIds = task.assignedTo.map((id) => id.toString());

	for (const userId of userIds) {
		if (!currentAssignedIds.includes(userId)) {
			task.assignedTo.push(userId);
		}
	}

	// Turn off "assign to all" if specific users are being assigned
	task.assignedToAll = false;
	task.updatedBy = req.user._id;

	await task.save();
	await task.populate(["assignedTo", "createdBy", "updatedBy"]);

	// Send assignment emails to new assignees only
	const newlyAssigned = users.filter(
		(u) =>
			userIds.includes(u._id.toString()) &&
			!currentAssignedIds.includes(u._id.toString()),
	);

	for (const user of newlyAssigned) {
		await sendTaskAssignmentEmail(user.email, task.title, task._id);
	}

	res.status(200).json({
		success: true,
		message: `Task assigned to ${users.length} user(s)`,
		assignedCount: task.assignedTo.length,
		task,
	});
}

export async function clearAssignments(req, res) {
	const { id } = req.params;
	const task = await Task.findById(id);

	if (!task) {
		throw new NotFoundError("Task");
	}

	task.assignedTo = [];
	task.assignedToAll = false;
	task.updatedBy = req.user._id;

	await task.save();
	await task.populate(["assignedTo", "createdBy", "updatedBy"]);

	res.status(200).json({
		success: true,
		message: "All assignments cleared from task",
		task,
	});
}

export async function getTaskAssignees(req, res) {
	const { id } = req.params;
	const task = await Task.findById(id).populate("assignedTo");

	if (!task) {
		throw new NotFoundError("Task");
	}

	// If assigned to all, fetch all active users
	if (task.assignedToAll) {
		const allUsers = await User.find({ isActive: true }).select("-password");

		return res.status(200).json({
			success: true,
			assignedToAll: true,
			count: allUsers.length,
			assignees: allUsers,
		});
	}

	// Otherwise return only assigned users
	const assignees = task.assignedTo;

	res.status(200).json({
		success: true,
		assignedToAll: false,
		count: assignees.length,
		assignees,
	});
}
