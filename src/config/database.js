import mongoose from "mongoose";
import { config } from "./environment.js";

export async function connectDB() {
	try {
		if (mongoose.connection.readyState === 1) {
			return;
		}

		await mongoose.connect(config.mongodbUri, {
			dbName: "OneMAI_PMS",
		});

		console.log("✓ MongoDB connected successfully");
		console.log(`  URI: ${config.mongodbUri}`);
	} catch (error) {
		console.error("✗ MongoDB connection failed:", error.message);
		process.exit(1);
	}
}

export async function disconnectDB() {
	try {
		await mongoose.disconnect();
		console.log("✓ MongoDB disconnected");
	} catch (error) {
		console.error("✗ MongoDB disconnection failed:", error.message);
		throw error;
	}
}

export default mongoose;
