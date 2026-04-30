import "dotenv/config";

export const config = {
	port: process.env.PORT || 5000,
	nodeEnv: process.env.NODE_ENV || "development",

	mongodbUri:
		process.env.MONGODB_URI || "mongodb://localhost:27017/project-management",

	jwtSecret: process.env.JWT_SECRET || "dev_secret_key",
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

	emailFrom: process.env.EMAIL_FROM || "noreply@projectmanagement.com",
	appUrl: process.env.APP_URL || "http://localhost:3000",
};

export function validateConfig() {
	const required = ["MONGODB_URI", "JWT_SECRET"];
	const missing = required.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(", ")}\n` +
				`Please create a .env file using .env.example as a template.`,
		);
	}
}
