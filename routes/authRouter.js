const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const memberController = require("../controllers/memberController");
const { authMiddleware } = require("../middlewares/auth");

// Public routes
router.post("/signup", memberController.signUp);
router.post("/signin", memberController.signIn);

// GET signin page
router.get("/signin", (req, res) => {
  res.render("auth/signin", {
    title: "Sign In",
    user: req.session.user || null,
  });
});

// GET signup page
router.get("/signup", (req, res) => {
  res.render("auth/signup", {
    title: "Sign Up",
    user: req.session.user || null,
  });
});

// Logout route
router.post("/logout", (req, res) => {
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.status(200).json({
      success: true,
      message: "Successfully logged out",
      data: null,
    });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.redirect("/");
  });
});

// Protected routes - require authentication
router.use(authMiddleware);

// Get current user profile
router.get("/profile", (req, res) => {
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: {
          _id: req.user._id,
          membername: req.user.membername,
          name: req.user.name,
          YOB: req.user.YOB,
          isAdmin: req.user.isAdmin,
        },
      },
    });
  } else {
    res.redirect("/");
  }
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  try {
    const jwtSecret = process.env.SECRET_KEY;
    const accessToken = jwt.sign(
      {
        memberId: req.user._id,
        membername: req.user.membername,
        isAdmin: req.user.isAdmin,
      },
      jwtSecret,
      {
        expiresIn: "1h",
      }
    );

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: accessToken,
        user: {
          _id: req.user._id,
          membername: req.user.membername,
          name: req.user.name,
          YOB: req.user.YOB,
          isAdmin: req.user.isAdmin,
        },
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  }
});

// Update member profile
router.put("/profile/:memberId", memberController.updateMember);
router.post("/profile/:memberId", memberController.updateMember);

// Change password
router.put("/password/:memberId", memberController.changePassword);
router.post("/password/:memberId", memberController.changePassword);

// Get current user's comments (authenticated users only, no admin required)
router.get("/my-comments", memberController.getMyComments);

module.exports = router;
