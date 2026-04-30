import { AppError } from "../utils/error-handler.js";

export function errorHandler(err, _, res, __) {
	// Log error (in production, use proper logging service)
	console.error("Error:", {
		name: err.name,
		message: err.message,
		statusCode: err.statusCode,
		stack: err.stack,
	});

	// Default error response
	let statusCode = 500;
	let message = "Internal Server Error";
	let error = {};

	// Handle custom AppError instances
	if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		error = {
			message,
			statusCode,
			...(err.errors && { details: err.errors }),
		};
	}

	// Handle MongoDB validation errors
	else if (err.name === "ValidationError") {
		statusCode = 422;
		message = "Validation Error";
		const details = Object.keys(err.errors).map((field) => ({
			field,
			message: err.errors[field].message,
		}));

		error = {
			message,
			statusCode,
			details,
		};
	}

	// Handle MongoDB cast errors (invalid ObjectId)
	else if (err.name === "CastError") {
		statusCode = 400;
		message = `Invalid ${err.kind}: ${err.value}`;
		error = {
			message,
			statusCode,
		};
	}

	// Handle MongoDB duplicate key errors
	else if (err.code === 11000) {
		statusCode = 409;
		const field = Object.keys(err.keyPattern)[0];
		message = `${field} already exists`;
		error = {
			message,
			statusCode,
			field,
		};
	}

	// Handle JWT errors (should be caught by auth middleware, but failsafe)
	else if (err.name === "JsonWebTokenError") {
		statusCode = 401;
		message = "Invalid token";
		error = {
			message,
			statusCode,
		};
	} else if (err.name === "TokenExpiredError") {
		statusCode = 401;
		message = "Token has expired";
		error = {
			message,
			statusCode,
		};
	}

	// Handle generic errors
	else {
		statusCode = 500;
		message = "Internal Server Error";
		error = {
			message,
			statusCode,
			...(process.env.NODE_ENV === "development" && { details: err.message }),
		};
	}

	// Send error response
	res.status(statusCode).json({
		success: false,
		error,
	});
}

export function notFoundHandler(_, __, next) {
	const error = new AppError("Route not found", 404);
	next(error);
}

export function asyncHandler(fn) {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}
