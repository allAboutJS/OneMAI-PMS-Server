import cors from "cors";
import express from "express";
import { connectDB } from "./config/database.js";
import { config, validateConfig } from "./config/environment.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.js";
import reportRoutes from "./routes/report.js";
import taskRoutes from "./routes/task.js";
import { backfillTicketIds } from "./models/task.js";

const app = express();
const port = config.port;

app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
		methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
	app.use((req, _, next) => {
		console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
		next();
	});
}

app.get("/health", (_, res) => {
	res.status(200).json({
		success: true,
		message: "Server is running",
		timestamp: new Date().toISOString(),
	});
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

app.get("/api/docs", (_, res) => {
	res.status(200).json({
		success: true,
		message: "Project Management System API",
		version: "1.0.0",
		baseUrl: process.env.FRONTEND_URL || "http://localhost:3000",
		endpoints: {
			auth: "/api/auth",
			tasks: "/api/tasks",
			reports: "/api/reports",
		},
		documentation: "See API_DOCUMENTATION.md for full API details",
	});
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, async () => {
	validateConfig();
	await connectDB();
	await backfillTicketIds();

	console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║   Project Management System - Backend Server           ║
  ╚════════════════════════════════════════════════════════╝

  Status:      ✓ Running
  Port:        ${port.toString().padEnd(41, " ")}
  Environment: ${config.nodeEnv.padEnd(41, " ")}
  Database:    MongoDB

  Available endpoints:
    - Health Check:   GET  http://localhost:${port}/health
    - API Docs:       GET  http://localhost:${port}/api/docs
    - Auth:           POST http://localhost:${port}/api/auth/login
    - Tasks:          GET  http://localhost:${port}/api/tasks
    - Reports:        GET  http://localhost:${port}/api/reports/summary

  Documentation: See API_DOCUMENTATION.md for full API reference
`);
});
