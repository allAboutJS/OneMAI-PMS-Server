import express from "express";
import {
	acceptInvite,
	getAllUsers,
	getCurrentUser,
	initiatePasswordRecovery,
	inviteUser,
	login,
	register,
	updateUserProfile,
	verifyToken,
} from "../controllers/auth.js";
import { authenticate } from "../middleware/auth.js";
import { isAdminOrSelf, requireAdmin } from "../middleware/rbac.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/invite", authenticate, requireAdmin, inviteUser);
router.post("/accept-invite", acceptInvite);
router.get("/me", authenticate, getCurrentUser);
router.get("/all", authenticate, getAllUsers);
router.get("/verify", authenticate, verifyToken);
router.patch("/:id", authenticate, isAdminOrSelf, updateUserProfile);
router.post("/forgot-password", initiatePasswordRecovery);

export default router;
