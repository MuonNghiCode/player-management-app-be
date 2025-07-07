const Member = require("../models/member");
const Player = require("../models/player");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// Helper function to check if request is AJAX
const isAjaxRequest = (req) => {
  return (
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.headers["x-requested-with"] === "XMLHttpRequest"
  );
};

exports.signIn = async (req, res) => {
  try {
    const { membername, password } = req.body;
    const jwtSecret = process.env.SECRET_KEY;
    const member = await Member.findOne({ membername });
    if (!member) {
      throw new Error("Member not found");
    }
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    // For API requests, return JWT token
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      const accessToken = jwt.sign(
        {
          memberId: member._id,
          membername: member.membername,
          isAdmin: member.isAdmin,
        },
        jwtSecret,
        {
          expiresIn: "1h",
        }
      );
      return res.status(200).json({
        success: true,
        message: "Successfully signed in!",
        data: {
          token: accessToken,
          user: {
            _id: member._id,
            membername: member.membername,
            name: member.name,
            YOB: member.YOB,
            isAdmin: member.isAdmin,
          },
        },
      });
    }

    // For web requests, create session
    req.session.user = {
      _id: member._id,
      membername: member.membername,
      name: member.name,
      YOB: member.YOB,
      isAdmin: member.isAdmin,
    };

    req.session.success = "Successfully signed in!";
    res.redirect("/");
  } catch (err) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: err.message,
      });
    }

    req.session.error = err.message;
    res.redirect("/auth/signin");
  }
};

exports.signUp = async (req, res) => {
  try {
    const { membername, password, name, YOB } = req.body;
    const member = await Member.findOne({ membername });
    if (member) {
      throw new Error("Member already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newMember = new Member({
      membername,
      password: hashedPassword,
      name,
      YOB,
    });
    await newMember.save();

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(201).json({
        success: true,
        message: "Account created successfully!",
        data: {
          newMember: {
            _id: newMember._id,
            membername: newMember.membername,
            name: newMember.name,
            YOB: newMember.YOB,
            isAdmin: newMember.isAdmin,
          },
        },
      });
    }

    req.session.success = "Account created successfully! Please sign in.";
    res.redirect("/auth/signin");
  } catch (err) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: err.message,
      });
    }

    req.session.error = err.message;
    res.redirect("/auth/signup");
  }
};

exports.getAllMembers = async (req, res) => {
  try {
    // Get search and filter parameters
    const { search, role, sort = "name" } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { membername: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      if (role === "admin") {
        query.isAdmin = true;
      } else if (role === "member") {
        query.isAdmin = false;
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "username":
        sortOptions = { membername: 1 };
        break;
      case "age_asc":
        sortOptions = { YOB: -1 };
        break;
      case "age_desc":
        sortOptions = { YOB: 1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      default:
        sortOptions = { name: 1 };
    }

    const members = await Member.find(query, { password: 0 }).sort(sortOptions);

    // Get additional stats for each member
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        // Count comments by this member
        const commentCount = await Player.aggregate([
          { $unwind: "$comments" },
          { $match: { "comments.author": member._id } },
          { $count: "count" },
        ]);

        // Calculate age
        const currentYear = new Date().getFullYear();
        const age = currentYear - member.YOB;

        return {
          ...member.toObject(),
          commentCount: commentCount.length > 0 ? commentCount[0].count : 0,
          age: age,
        };
      })
    );

    // Get summary statistics
    const totalMembers = await Member.countDocuments();
    const adminCount = await Member.countDocuments({ isAdmin: true });
    const memberCount = totalMembers - adminCount;
    const recentMembers = await Member.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    // Calculate age distribution
    const currentYear = new Date().getFullYear();
    const ageRanges = {
      young: 0, // < 25
      middle: 0, // 25-35
      mature: 0, // > 35
    };

    membersWithStats.forEach((member) => {
      if (member.YOB) {
        const age = currentYear - member.YOB;
        if (age < 25) ageRanges.young++;
        else if (age <= 35) ageRanges.middle++;
        else ageRanges.mature++;
      }
    });

    const stats = {
      totalMembers,
      adminCount,
      memberCount,
      recentMembers,
      ageRanges,
    };

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({
        success: true,
        message: "Members retrieved successfully",
        data: {
          members: membersWithStats,
          stats,
        },
      });
    }

    res.render("accounts/index", {
      title: "Members Management",
      members: membersWithStats,
      stats,
      search: search || "",
      selectedRole: role || "",
      selectedSort: sort,
      user: req.session.user,
    });
  } catch (err) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: err.message,
      });
    }

    req.session.error = err.message;
    res.redirect("/");
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
        error: "Invalid member ID",
      });
    }

    const member = await Member.findById(memberId, { password: 0 });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
        error: "Member not found",
      });
    }

    // Calculate age
    const currentYear = new Date().getFullYear();
    const age = currentYear - member.YOB;

    // Count comments by this member
    const commentCount = await Player.aggregate([
      { $unwind: "$comments" },
      { $match: { "comments.author": member._id } },
      { $count: "count" },
    ]);

    const memberWithStats = {
      ...member.toObject(),
      age: age,
      commentCount: commentCount.length > 0 ? commentCount[0].count : 0,
    };

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({
        success: true,
        message: "Member retrieved successfully",
        data: memberWithStats,
      });
    }

    res.render("accounts/detail", {
      title: "Member Details",
      member: memberWithStats,
      user: req.session.user,
    });
  } catch (err) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: err.message,
      });
    }

    req.session.error = err.message;
    res.redirect("/accounts");
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { name, YOB } = req.body;

    if (req.user._id.toString() !== memberId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this member",
        error: "You are not authorized to update this member",
      });
    }

    const updateMember = await Member.findByIdAndUpdate(
      memberId,
      { name, YOB },
      { new: true, select: { password: 0 } }
    );

    if (!updateMember) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
        error: "Member not found",
      });
    }

    // Update session if web request and it's the current user
    if (req.session && req.session.user && req.session.user._id === memberId) {
      req.session.user.name = updateMember.name;
    }

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({
        success: true,
        message: "Member updated successfully",
        data: updateMember,
      });
    }

    req.session.success = "Profile updated successfully!";
    res.redirect("/");
  } catch (err) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: err.message,
      });
    }

    req.session.error = err.message;
    res.redirect("/");
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user._id.toString() !== memberId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to change this member's password",
        error: "You are not authorized to change this member's password",
      });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
        error: "Member not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, member.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        error: "Current password is incorrect",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    member.password = hashedNewPassword;
    await member.save();

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(200).json({
        success: true,
        message: "Password updated successfully",
        data: null,
      });
    }

    req.session.success = "Password changed successfully!";
    res.redirect("/");
  } catch (err) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: err.message,
      });
    }

    req.session.error = err.message;
    res.redirect("/");
  }
};

// Get current user's comments
exports.getMyComments = async (req, res) => {
  try {
    const memberId = req.user._id;

    // Find all players that have comments from this member
    const playersWithMyComments = await Player.aggregate([
      { $unwind: "$comments" },
      { $match: { "comments.author": new mongoose.Types.ObjectId(memberId) } },
      {
        $lookup: {
          from: "teams",
          localField: "team",
          foreignField: "_id",
          as: "teamInfo",
        },
      },
      {
        $project: {
          _id: "$comments._id",
          content: "$comments.content",
          rating: "$comments.rating",
          createdAt: "$comments.createdAt",
          updatedAt: "$comments.updatedAt",
          player: {
            _id: "$_id",
            playerName: "$playerName",
            image: "$image",
            team: {
              $cond: {
                if: { $gt: [{ $size: "$teamInfo" }, 0] },
                then: {
                  teamName: { $arrayElemAt: ["$teamInfo.teamName", 0] },
                  image: { $arrayElemAt: ["$teamInfo.image", 0] },
                },
                else: null,
              },
            },
          },
        },
      },
      { $sort: { updatedAt: -1 } }, // Sort by most recently updated
    ]);

    res.status(200).json({
      success: true,
      message: "Comments retrieved successfully",
      data: {
        comments: playersWithMyComments,
      },
    });
  } catch (err) {
    console.error("Error getting user comments:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving comments",
      error: err.message,
    });
  }
};
