import jwt from "jsonwebtoken";
import { connectDB } from "../config/database.js";
import { config } from "../config/environment.js";
import { User } from "../models/user.js";
import { UnauthorizedError } from "../utils/error-handler.js";

export async function authenticate(req, _, next) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader?.startsWith("Bearer ")) {
			throw new UnauthorizedError("No token provided");
		}

		const token = authHeader.slice(7);

		// Verify and decode the token
		let decoded;
		try {
			decoded = jwt.verify(token, config.jwtSecret);
		} catch (error) {
			if (error.name === "TokenExpiredError") {
				throw new UnauthorizedError("Token has expired");
			}

			if (error.name === "JsonWebTokenError") {
				throw new UnauthorizedError("Invalid token");
			}

			throw error;
		}

		await connectDB();
		const user = await User.findById(decoded.id);

		if (!user) {
			throw new UnauthorizedError("User not found");
		}

		if (!user.isUserActive()) {
			throw new UnauthorizedError("User account is inactive");
		}

		// Attach user to request object for use in controllers
		req.user = user;
		req.token = token;

		next();
	} catch (error) {
		// Pass error to error handling middleware
		if (error instanceof UnauthorizedError) {
			return next(error);
		}
		// Convert unexpected errors to UnauthorizedError
		next(new UnauthorizedError("Authentication failed"));
	}
}

export function generateToken(userId, email) {
	return jwt.sign(
		{
			id: userId,
			email: email,
			iat: Math.floor(Date.now() / 1000), // Issued at
		},
		config.jwtSecret,
		{
			expiresIn: config.jwtExpiresIn,
		},
	);
}

export function decodeToken(token) {
	try {
		return jwt.decode(token);
	} catch {
		return null;
	}
}

export function verifyTokenSync(token) {
	try {
		jwt.verify(token, config.jwtSecret);
		return true;
	} catch {
		return false;
	}
}
