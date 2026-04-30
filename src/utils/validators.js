import { BadRequestError, ValidationError } from "./error-handler.js";

export function validateEmail(email) {
	const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
	if (!emailRegex.test(email)) {
		throw new BadRequestError("Invalid email format");
	}
}

export function validateObjectId(id) {
	const objectIdRegex = /^[0-9a-fA-F]{24}$/;
	if (!objectIdRegex.test(id)) {
		throw new BadRequestError("Invalid ID format");
	}
}

export function validateRole(role) {
	const validRoles = ["Admin", "Member"];
	if (!validRoles.includes(role)) {
		throw new BadRequestError(`Role must be one of: ${validRoles.join(", ")}`);
	}
}

export function validateTaskStatus(status) {
	const validStatuses = ["Not Started", "In Progress", "Completed"];
	if (!validStatuses.includes(status)) {
		throw new BadRequestError(
			`Status must be one of: ${validStatuses.join(", ")}`,
		);
	}
}

export function validateTaskBucket(bucket) {
	const validBuckets = [
		"Feature Development",
		"Bug Fixes",
		"Improvements / Enhancements",
		"Technical Infrastructure",
		"QA / Testing & Release",
	];

	if (!validBuckets.includes(bucket)) {
		throw new BadRequestError(
			`Bucket must be one of: ${validBuckets.join(", ")}`,
		);
	}
}

export function validateTaskPriority(priority) {
	const validPriorities = ["Low", "Medium", "High", "Critical"];
	if (!validPriorities.includes(priority)) {
		throw new BadRequestError(
			`Priority must be one of: ${validPriorities.join(", ")}`,
		);
	}
}

export function validateUserIds(userIds) {
	if (!Array.isArray(userIds)) {
		throw new BadRequestError("assignedTo must be an array of user IDs");
	}

	userIds.forEach((id, index) => {
		if (!id || typeof id !== "string") {
			throw new BadRequestError(`Invalid user ID at index ${index}`);
		}
		validateObjectId(id);
	});
}

export function validatePasswordStrength(password) {
	if (!password || password.length < 6) {
		throw new BadRequestError("Password must be at least 6 characters long");
	}
}

export function validateRequiredFields(obj, requiredFields) {
	const missingFields = requiredFields.filter(
		(field) => !obj[field] || obj[field].toString().trim() === "",
	);

	if (missingFields.length > 0) {
		throw new ValidationError("Missing required fields", missingFields);
	}
}

export function validateDate(date, mustBeFuture = false) {
	const parsedDate = new Date(date);

	if (Number.isNaN(parsedDate.getTime())) {
		throw new BadRequestError("Invalid date format");
	}

	if (mustBeFuture && parsedDate < new Date()) {
		throw new BadRequestError("Date must be in the future");
	}
}

export function sanitizeInput(text) {
	if (typeof text !== "string") return text;

	return text
		.trim()
		.replace(/[<>]/g, "") // Remove angle brackets
		.substring(0, 2000); // Limit length
}
