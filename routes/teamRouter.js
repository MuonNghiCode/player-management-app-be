const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");

// Public routes - anyone can view teams
router.get("/", teamController.getAllTeams);
router.get("/:teamId", teamController.getTeamById);

// Admin only routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.post("/", teamController.createTeam);
router.put("/:teamId", teamController.updateTeam);
router.delete("/:teamId", teamController.deleteTeam);

module.exports = router;