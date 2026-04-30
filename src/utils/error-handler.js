export class AppError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true; // Flag to distinguish operational errors from programming errors

		Error.captureStackTrace(this, this.constructor);
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad Request") {
		super(message, 400);
		this.name = "BadRequestError";
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized - No valid token provided") {
		super(message, 401);
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends AppError {
	constructor(
		message = "Forbidden - You do not have permission to access this resource",
	) {
		super(message, 403);
		this.name = "ForbiddenError";
	}
}

export class NotFoundError extends AppError {
	constructor(resource = "Resource") {
		super(`${resource} not found`, 404);
		this.name = "NotFoundError";
	}
}

export class ConflictError extends AppError {
	constructor(message = "Conflict - Resource already exists") {
		super(message, 409);
		this.name = "ConflictError";
	}
}

export class ValidationError extends AppError {
	constructor(message = "Validation Error", errors = []) {
		super(message, 422);
		this.name = "ValidationError";
		this.errors = errors;
	}
}

export class InternalServerError extends AppError {
	constructor(message = "Internal Server Error") {
		super(message, 500);
		this.name = "InternalServerError";
	}
}
