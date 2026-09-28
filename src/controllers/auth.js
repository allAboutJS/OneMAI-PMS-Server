import { v4 as uuid } from "uuid";
import { connectDB } from "../config/database.js";
import { config } from "../config/environment.js";
import { generateToken } from "../middleware/auth.js";
import { User } from "../models/user.js";
import {
	sendInviteEmail,
	sendPasswordResetEmail,
} from "../utils/email-service.js";
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "../utils/error-handler.js";
import {
	validateEmail,
	validatePasswordStrength,
	validateRequiredFields,
	validateRole,
} from "../utils/validators.js";

export async function register(req, res, next) {
	try {
		const { email, password, name } = req.body;

		validateRequiredFields(req.body, ["email", "password", "name"]);
		validateEmail(email);
		validatePasswordStrength(password);

		await connectDB();
		const existingUser = await User.findOne({ email: email.toLowerCase() });

		if (existingUser) {
			throw new ConflictError(
				`User with email ${email} already exists. Please log in or use a different email.`,
			);
		}

		const newUser = new User({
			email: email.toLowerCase(),
			password,
			name: name.trim(),
			role: "Member", // New users default to Member role
			inviteAccepted: true, // Self-registered users are auto-accepted
		});

		// Save user (password will be hashed by pre-save middleware)
		await newUser.save();

		// Generate JWT token
		const token = generateToken(newUser._id, newUser.email);
		// Respond with user data (excluding password)
		const userResponse = newUser.toObject();
		delete userResponse.password;

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			user: userResponse,
			token,
		});
	} catch (error) {
		next(error);
	}
}

export async function login(req, res, next) {
	try {
		const { email, password } = req.body;

		validateRequiredFields(req.body, ["email", "password"]);
		validateEmail(email);

		await connectDB();
		const user = await User.findOne({ email: email.toLowerCase() }).select(
			"+password",
		);

		if (!user) {
			throw new UnauthorizedError("Invalid email or password");
		}

		// Check if account is active
		if (!user.isUserActive()) {
			throw new UnauthorizedError(
				"This account has been deactivated. Please contact an administrator.",
			);
		}

		// Compare passwords
		const isPasswordValid = await user.comparePassword(password);

		if (!isPasswordValid) {
			throw new UnauthorizedError("Invalid email or password");
		}

		// Update last login timestamp
		user.lastLogin = new Date();
		await user.save();

		// Generate JWT token
		const token = generateToken(user._id, user.email);

		// Respond with user data (excluding password)
		const userResponse = user.toObject();
		delete userResponse.password;

		res.status(200).json({
			success: true,
			message: "Login successful",
			user: userResponse,
			token,
		});
	} catch (error) {
		next(error);
	}
}

export async function verifyToken(req, res, next) {
	try {
		const userResponse = req.user.toObject();
		delete userResponse.password;

		res.status(200).json({
			success: true,
			user: userResponse,
		});
	} catch (error) {
		next(error);
	}
}

export async function inviteUser(req, res, next) {
	try {
		const { email, name, role = "Member" } = req.body;

		validateRequiredFields(req.body, ["email", "name"]);
		validateEmail(email);
		validateRole(role);

		await connectDB();
		// Check if email already exists
		const existingUser = await User.findOne({ email: email.toLowerCase() });

		if (existingUser?.inviteAccepted) {
			throw new ConflictError(`User with email ${email} already exists`);
		}

		// If user exists but hasn't accepted invite, update and resend
		let user = existingUser;
		if (!user) {
			user = new User({
				email: email.toLowerCase(),
				name: name.trim(),
				role,
				password: "temp_placeholder", // Will be set on invite acceptance
				inviteAccepted: false,
			});
			await user.save();
		}

		const inviteToken = await User.generateInviteToken(user._id);
		const invitedBy = req.user.name || "Admin";

		await sendInviteEmail(user.email, inviteToken, invitedBy);

		res.status(200).json({
			success: true,
			message: `Invitation sent to ${email}`,
			inviteToken: config.nodeEnv !== "PRODUCTION" ? inviteToken : undefined, // Return token for testing (remove in production)
			expiresIn: "7 days",
		});
	} catch (error) {
		next(error);
	}
}

export async function acceptInvite(req, res, next) {
	try {
		const { inviteToken, password } = req.body;

		validateRequiredFields(req.body, ["inviteToken", "password"]);
		validatePasswordStrength(password);

		await connectDB();
		// Find user by invite token
		const user = await User.findOne({
			inviteToken,
			inviteTokenExpires: { $gt: new Date() },
		});

		if (!user) {
			throw new NotFoundError("Invalid or expired invite token");
		}

		// Set password and mark invite as accepted
		user.password = password;
		user.inviteAccepted = true;
		user.inviteToken = null;
		user.inviteTokenExpires = null;

		await user.save();

		const token = generateToken(user._id, user.email);
		const userResponse = user.toObject();

		delete userResponse.password;

		res.status(200).json({
			success: true,
			message: "Invite accepted and account activated",
			user: userResponse,
			token,
		});
	} catch (error) {
		next(error);
	}
}

export async function getCurrentUser(req, res, next) {
	try {
		if (!req.user) {
			throw new UnauthorizedError("No authenticated user");
		}

		const userResponse = req.user.toObject();
		delete userResponse.password;

		res.status(200).json({
			success: true,
			user: userResponse,
		});
	} catch (error) {
		next(error);
	}
}

export async function updateUserProfile(req, res, next) {
	try {
		const { id } = req.params;
		const { name, email } = req.body;

		// Check permission (admin or self)
		if (req.user._id.toString() !== id && !req.user.isAdmin()) {
			throw new ForbiddenError("Unauthorized to update this profile");
		}

		const user = await User.findById(id);

		if (!user) {
			throw new NotFoundError("User");
		}

		// Update allowed fields
		if (name) {
			user.name = name.trim();
		}

		if (email) {
			validateEmail(email);
			const existingEmail = await User.findOne({
				email: email.toLowerCase(),
				_id: { $ne: id },
			});

			if (existingEmail) {
				throw new ConflictError("Email already in use");
			}

			user.email = email.toLowerCase();
		}

		await user.save();

		const userResponse = user.toObject();
		delete userResponse.password;

		res.status(200).json({
			success: true,
			message: "Profile updated successfully",
			user: userResponse,
		});
	} catch (error) {
		next(error);
	}
}

export async function initiatePasswordRecovery(req, res, next) {
	try {
		validateRequiredFields(req.body, ["email"]);
		validateEmail(req.body.email);

		await connectDB();

		const user = await User.findOne({ email: req.body.email });
		if (!user) {
			throw new NotFoundError("No account found for this email.");
		}

		const { email } = req.body;
		const token = uuid();
		const expiresIn = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes

		user.passwordResetToken = token;
		user.passwordResetTokenExpires = expiresIn;

		await user.save();
		await sendPasswordResetEmail(email, user.name, 5);

		res.status(200).json({
			success: true,
			message: `A password recovery email has been sent to ${email}`,
		});
	} catch (error) {
		next(error);
	}
}

export async function getAllUsers(_, res, next) {
	try {
		res.status(200).json({ success: true, users: await User.find() });
	} catch (error) {
		next(error);
	}
}
