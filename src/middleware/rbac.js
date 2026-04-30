import { Task } from "../models/task.js";
import { ForbiddenError } from "../utils/error-handler.js";

export function requireAdmin(req, _, next) {
	if (!req.user) {
		return next(new ForbiddenError("User not authenticated"));
	}

	if (!req.user.isAdmin()) {
		return next(
			new ForbiddenError(`Admin access required. Your role:  ${req.user.role}`),
		);
	}

	next();
}

export function requireMember(req, _, next) {
	if (!req.user) {
		return next(new ForbiddenError("User not authenticated"));
	}

	// Both Admin and Member roles are valid
	if (req.user.role !== "Admin" && req.user.role !== "Member") {
		return next(new ForbiddenError("Invalid user role"));
	}

	next();
}

export async function requireTaskAccess(req, _, next) {
	try {
		if (!req.user) {
			return next(new ForbiddenError("User not authenticated"));
		}

		// Admins can access any task
		if (req.user.isAdmin()) {
			return next();
		}

		// For members: fetch the task and check assignment
		const taskId = req.params.id;
		const task = await Task.findById(taskId);

		if (!task) {
			// Let the controller handle the not-found error
			return next();
		}

		// Check if member is assigned to this task
		const isAssigned = task.isAssignedTo(req.user._id);

		if (!isAssigned) {
			return next(
				new ForbiddenError(
					"You do not have permission to access this task. " +
						"Only assigned members and admins can access it.",
				),
			);
		}

		// Store task in request for use in controller
		req.task = task;

		next();
	} catch (error) {
		next(error);
	}
}

export function requireTaskCreation(req, _, next) {
	if (!req.user) {
		return next(new ForbiddenError("User not authenticated"));
	}

	if (!req.user.isAdmin()) {
		return next(
			new ForbiddenError(
				`Only admins can create tasks. Your role: ${req.user.role}`,
			),
		);
	}

	next();
}

export function requireTaskAssignment(req, _, next) {
	if (!req.user) {
		return next(new ForbiddenError("User not authenticated"));
	}

	if (!req.user.isAdmin()) {
		return next(
			new ForbiddenError(
				`Only admins can assign tasks. Your role: ${req.user.role}`,
			),
		);
	}

	next();
}

export async function allowStatusUpdate(req, _, next) {
	try {
		if (!req.user) {
			return next(new ForbiddenError("User not authenticated"));
		}

		// Admins can always update status
		if (req.user.isAdmin()) {
			return next();
		}

		// For members: check if assigned to task
		const taskId = req.params.id;
		const task = await Task.findById(taskId);

		if (!task) {
			// Let controller handle not-found
			return next();
		}

		const isAssigned = task.isAssignedTo(req.user._id);

		if (!isAssigned) {
			return next(
				new ForbiddenError(
					"You can only update status for tasks assigned to you",
				),
			);
		}

		req.task = task;
		next();
	} catch (error) {
		next(error);
	}
}

export function isAdminOrSelf(req, _, next) {
	if (!req.user) {
		return next(new ForbiddenError("User not authenticated"));
	}

	const targetUserId = req.params.id;
	const currentUserId = req.user._id.toString();

	const isAdmin = req.user.isAdmin();
	const isSelf = targetUserId === currentUserId;

	if (!isAdmin && !isSelf) {
		return next(
			new ForbiddenError(
				"You can only access your own data or you must be an admin",
			),
		);
	}

	next();
}
