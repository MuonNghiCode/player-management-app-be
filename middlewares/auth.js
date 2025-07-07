const jwt = require("jsonwebtoken");
const Member = require("../models/member");

const SECRET_KEY = process.env.SECRET_KEY;

const authMiddleware = async (req, res, next) => {
  try {
    // Check for JWT token first (for API requests)
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      console.log("🔍 Token found:", token.substring(0, 50) + "...");
      const decoded = jwt.verify(token, SECRET_KEY);
      console.log("✅ Token decoded:", decoded);
      const member = await Member.findById(decoded.memberId);
      if (!member) {
        console.log("❌ Member not found for ID:", decoded.memberId);
        return res
          .status(401)
          .json({ success: false, message: "Member not found" });
      }
      console.log("✅ Member found:", member.membername);
      req.user = member;
      return next();
    }

    // Check for session (for web requests)
    if (req.session && req.session.user) {
      const member = await Member.findById(req.session.user._id);
      if (!member) {
        req.session.destroy();
        return res
          .status(401)
          .json({ success: false, message: "Member not found" });
      }
      req.user = member;
      return next();
    }

    // No authentication found
    console.log("❌ No authentication found");
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
