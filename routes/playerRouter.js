const express = require("express");
const router = express.Router();
const playerController = require("../controllers/playerController");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");

// Admin routes - require authentication and admin privileges (ĐẶT TRƯỚC)
router.get(
  "/new",
  authMiddleware,
  adminMiddleware,
  playerController.showCreateForm
);

// Public routes - anyone can access
router.get("/", playerController.getAllPlayers);

// Routes với tham số động (ĐẶT SAU)
router.get(
  "/:playerId/edit",
  authMiddleware,
  adminMiddleware,
  playerController.showEditForm
);
router.get("/:playerId", playerController.getPlayerById);

// Protected routes - require authentication for comments
router.use(authMiddleware);

// Comment routes - authenticated members only
router.post("/:playerId/comments", playerController.addComment);
router.put("/:playerId/comments/:commentId", playerController.updateComment);
router.delete("/:playerId/comments/:commentId", playerController.deleteComment);

// Admin only routes
router.use(adminMiddleware);
router.post("/", playerController.createPlayer);
router.put("/:playerId", playerController.updatePlayer);
router.delete("/:playerId", playerController.deletePlayer);

module.exports = router;
