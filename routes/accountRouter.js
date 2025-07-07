const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");

// Admin only - get all members
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", memberController.getAllMembers);

// Get specific member by ID (admin only)
router.get("/:memberId", memberController.getMemberById);

// Update member (admin only)
router.put("/:memberId", memberController.updateMember);

// Change member password (admin only)
router.put("/:memberId/password", memberController.changePassword);

module.exports = router;
