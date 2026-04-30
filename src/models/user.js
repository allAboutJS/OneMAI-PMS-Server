import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

const userSchema = new mongoose.Schema(
	{
		// Basic information
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Invalid email format",
			],
		},

		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
		},

		// Authentication
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: 6,
			select: false,
		},

		// Authorization
		role: {
			type: String,
			enum: ["Admin", "Member"],
			default: "Member",
			description: "Admin: Full access. Member: Limited to assigned tasks",
		},

		// Account status
		isActive: {
			type: Boolean,
			default: true,
			description: "Soft delete support - inactive users cannot login",
		},

		// Tracking
		createdAt: {
			type: Date,
			default: Date.now,
		},

		lastLogin: {
			type: Date,
			default: null,
		},

		// Invitation tracking
		inviteToken: {
			type: String,
			default: null,
			description: "Token for email-based invite acceptance (future feature)",
		},

		inviteTokenExpires: {
			type: Date,
			default: null,
			description: "Expiration timestamp for invite token",
		},

		inviteAccepted: {
			type: Boolean,
			default: false,
			description: "Whether the user has accepted their invite",
		},

		// Acount recovery
		passwordResetToken: {
			type: String,
			default: null,
			description: "Token for validating password reset",
			select: false,
		},

		passwordResetTokenExpires: {
			type: Date,
			default: null,
			description: "Expiry date for the password reset token",
			select: false,
		},
	},
	{
		timestamps: true,
		collection: "users",
	},
);

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	try {
		const salt = await bcryptjs.genSalt(10);
		this.password = await bcryptjs.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcryptjs.compare(candidatePassword, this.password);
};

userSchema.methods.isAdmin = function () {
	return this.role === "Admin";
};

userSchema.methods.isUserActive = function () {
	return this.isActive === true;
};

userSchema.statics.updateLastLogin = async function (userId) {
	return await this.findByIdAndUpdate(
		userId,
		{ lastLogin: new Date() },
		{ new: true },
	);
};

userSchema.statics.generateInviteToken = async function (userId) {
	const token = uuid();
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

	await this.findByIdAndUpdate(userId, {
		inviteToken: token,
		inviteTokenExpires: expiresAt,
	});

	return token;
};

export const User = mongoose.model("User", userSchema);
