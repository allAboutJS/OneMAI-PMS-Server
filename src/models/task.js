import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
	{
		// Basic information
		title: {
			type: String,
			required: [true, "Task title is required"],
			trim: true,
			maxlength: [255, "Title cannot exceed 255 characters"],
		},

		description: {
			type: String,
			default: "",
			trim: true,
			maxlength: [2000, "Description cannot exceed 2000 characters"],
		},

		// Bucket classification (fixed categories)
		bucket: {
			type: String,
			enum: [
				"Feature Development",
				"Bug Fixes",
				"Improvements / Enhancements",
				"Technical Infrastructure",
				"QA / Testing & Release",
			],
			required: [true, "Task must be assigned to a bucket"],
			description: "Predefined category for organizing tasks",
		},

		// Status (workflow states)
		status: {
			type: String,
			enum: ["Not Started", "In Progress", "Completed"],
			default: "Not Started",
			required: true,
			description: "Current workflow state of the task",
		},

		// Assignment management
		assignedTo: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			default: [],
			description:
				"Array of user IDs assigned to this task. Empty array = unassigned.",
		},

		assignedToAll: {
			type: Boolean,
			default: false,
			description:
				"If true, task is visible/assigned to all users (overrides assignedTo)",
		},

		// Dates
		dueDate: {
			type: Date,
			default: null,
			description: "Optional due date for the task",
		},

		completedAt: {
			type: Date,
			default: null,
			description: "Timestamp when task was marked as Completed",
		},

		// Drag & drop support
		position: {
			type: Number,
			default: 0,
			description: "Numeric order for display in bucket (supports drag & drop)",
		},

		bucketPosition: {
			type: Number,
			default: 0,
			description: "Position within specific bucket (for better organization)",
		},

		// Audit trail
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Task creator is required"],
		},

		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
			description: "User who last modified the task",
		},

		// Metadata
		priority: {
			type: String,
			enum: ["Low", "Medium", "High", "Critical"],
			default: "Medium",
			description: "Task priority level",
		},

		tags: {
			type: [String],
			default: [],
			description: "Flexible tags for additional categorization",
		},

		attachments: {
			type: [String],
			default: [],
			description: "URLs or references to attached files (future enhancement)",
		},
	},
	{
		timestamps: true, // Automatically add createdAt and updatedAt
		collection: "tasks",
	},
);

taskSchema.index({ bucket: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ createdBy: 1 });

taskSchema.pre("save", function (next) {
	if (this.isModified("status") && this.status === "Completed") {
		this.completedAt = new Date();
	}

	// If status changes away from Completed, clear completedAt
	if (this.isModified("status") && this.status !== "Completed") {
		this.completedAt = null;
	}

	next();
});

taskSchema.virtual("isOverdue").get(function () {
	if (!this.dueDate || this.status === "Completed") {
		return false;
	}
	return this.dueDate < new Date();
});

taskSchema.virtual("isDueToday").get(function () {
	if (!this.dueDate || this.status === "Completed") {
		return false;
	}

	const today = new Date();
	const dueDate = this.dueDate;

	return (
		dueDate.getFullYear() === today.getFullYear() &&
		dueDate.getMonth() === today.getMonth() &&
		dueDate.getDate() === today.getDate()
	);
});

taskSchema.virtual("isFutureDated").get(function () {
	if (!this.dueDate) {
		return false;
	}
	return this.dueDate > new Date();
});

taskSchema.methods.isAssignedTo = function (userId) {
	if (this.assignedToAll) return true;
	return this.assignedTo.some((id) => id.toString() === userId.toString());
};

taskSchema.methods.addAssignee = function (userId) {
	const userIdStr = userId.toString();
	if (!this.assignedTo.some((id) => id.toString() === userIdStr)) {
		this.assignedTo.push(userId);
	}
};

taskSchema.methods.removeAssignee = function (userId) {
	const userIdStr = userId.toString();
	this.assignedTo = this.assignedTo.filter((id) => id.toString() !== userIdStr);
};

taskSchema.statics.findOverdue = function () {
	return this.find({
		dueDate: { $lt: new Date() },
		status: { $ne: "Completed" },
	}).populate("assignedTo createdBy updatedBy");
};

taskSchema.statics.findDueToday = function () {
	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date();
	endOfDay.setHours(23, 59, 59, 999);

	return this.find({
		dueDate: { $gte: startOfDay, $lte: endOfDay },
		status: { $ne: "Completed" },
	}).populate("assignedTo createdBy updatedBy");
};

taskSchema.statics.findFutureDated = function () {
	return this.find({
		dueDate: { $gt: new Date() },
		status: { $ne: "Completed" },
	}).populate("assignedTo createdBy updatedBy");
};

taskSchema.statics.findByBucketAndStatus = function (bucket, status) {
	return this.find({ bucket, status })
		.sort({ position: 1 })
		.populate("assignedTo createdBy updatedBy");
};

taskSchema.statics.findAssignedToUser = function (userId) {
	return this.find({
		$or: [{ assignedTo: userId }, { assignedToAll: true }],
	}).populate("assignedTo createdBy updatedBy");
};

export const Task = mongoose.model("Task", taskSchema);
