const Player = require("../models/player");
const Team = require("../models/team");
const Comment = require("../models/comment");
const mongoose = require("mongoose");

// Helper function to check if request is AJAX
const isAjaxRequest = (req) => {
  return (
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.headers["x-requested-with"] === "XMLHttpRequest"
  );
};

exports.getAllPlayers = async (req, res) => {
  try {
    // Get search and filter parameters
    const {
      search,
      team,
      captain,
      sort = "name",
      page = 1,
      limit = 12,
    } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { playerName: { $regex: search, $options: "i" } },
        { information: { $regex: search, $options: "i" } },
      ];
    }

    if (team && team !== "all") {
      query.team = team;
    }

    if (captain) {
      if (captain === "true") {
        query.isCaptain = true;
      } else if (captain === "false") {
        query.isCaptain = false;
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "name":
        sortOptions = { playerName: 1 };
        break;
      case "cost_asc":
        sortOptions = { cost: 1 };
        break;
      case "cost_desc":
        sortOptions = { cost: -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      default:
        sortOptions = { playerName: 1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const players = await Player.find(query)
      .populate("team", "teamName")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Add comment count and average rating for each player
    const playersWithStats = players.map((player) => {
      let avgRating = 0;
      let commentCount = 0;

      if (player.comments && player.comments.length > 0) {
        commentCount = player.comments.length;
        const totalRating = player.comments.reduce((sum, comment) => {
          return sum + (comment.rating || 0);
        }, 0);
        avgRating = totalRating / commentCount;
      }

      return {
        ...player.toObject(),
        avgRating: Math.round(avgRating * 10) / 10,
        commentCount: commentCount,
      };
    });

    const totalPlayers = await Player.countDocuments(query);
    const totalPages = Math.ceil(totalPlayers / limit);

    // Get all teams for filter dropdown
    const teams = await Team.find().sort({ teamName: 1 });

    // Get summary statistics
    const stats = {
      totalPlayers: await Player.countDocuments(),
      totalCaptains: await Player.countDocuments({ isCaptain: true }),
      totalCost: await Player.aggregate([
        { $group: { _id: null, total: { $sum: "$cost" } } },
      ]).then((result) => (result.length > 0 ? result[0].total : 0)),
      avgCost: await Player.aggregate([
        { $group: { _id: null, avg: { $avg: "$cost" } } },
      ]).then((result) => (result.length > 0 ? Math.round(result[0].avg) : 0)),
    };

    if (isAjaxRequest(req)) {
      return res.status(200).json({
        success: true,
        message: "Players retrieved successfully",
        data: {
          players: playersWithStats,
          stats,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPlayers,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } else {
      res.render("players/index", {
        title: "Player Management",
        players: playersWithStats,
        teams,
        stats,
        search: search || "",
        selectedTeam: team || "",
        selectedCaptain: captain || "",
        selectedSort: sort,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPlayers,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        user: req.session.user || null,
      });
    }
  } catch (err) {
    console.error("Get players error:", err);
    const errorMsg = err.message || "An error occurred while fetching players";

    if (isAjaxRequest(req)) {
      return res.status(500).json({ error: errorMsg });
    } else {
      req.session.error = errorMsg;
      res.redirect("/");
    }
  }
};

exports.getPlayerById = async (req, res) => {
  try {
    const { playerId } = req.params;
    const player = await Player.findById(playerId)
      .populate("team", "teamName")
      .populate("comments.author", "name membername");

    if (!player) {
      const error = "Player not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/players");
    }

    // Calculate average rating - Safe calculation
    let avgRating = 0;
    let commentCount = 0;

    if (player.comments && player.comments.length > 0) {
      commentCount = player.comments.length;
      const totalRating = player.comments.reduce((sum, comment) => {
        return sum + (comment.rating || 0);
      }, 0);
      avgRating = totalRating / commentCount;
    }

    const playerWithStats = {
      ...player.toObject(),
      avgRating: Math.round(avgRating * 10) / 10,
      commentCount: commentCount,
    };

    if (isAjaxRequest(req)) {
      return res.status(200).json({
        success: true,
        message: "Player retrieved successfully",
        data: { player: playerWithStats },
      });
    } else {
      res.render("players/detail", {
        title: `${player.playerName} - Player Details`,
        player: playerWithStats,
        user: req.session.user || null,
      });
    }
  } catch (err) {
    console.error("Get player by ID error:", err);
    const errorMsg =
      err.message || "An error occurred while fetching player details";

    if (isAjaxRequest(req)) {
      return res.status(500).json({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    } else {
      req.session.error = errorMsg;
      res.redirect("/players");
    }
  }
};

exports.createPlayer = async (req, res) => {
  try {
    console.log("Create player request body:", req.body);

    const { playerName, image, cost, isCaptain, information, team } = req.body;

    // Validation
    if (!playerName || !image || !cost || !information || !team) {
      const error = "All fields are required";
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error });
      }
      req.session.error = error;
      return res.redirect("/players/new");
    }

    // Check if team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      const error = "Selected team does not exist";
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error });
      }
      req.session.error = error;
      return res.redirect("/players/new");
    }

    // Check if another player with same name exists in the same team
    const existingPlayer = await Player.findOne({
      playerName: { $regex: new RegExp(`^${playerName.trim()}$`, "i") },
      team: team,
    });

    if (existingPlayer) {
      const error = `Player "${playerName}" already exists in team "${teamExists.teamName}"`;
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error });
      }
      req.session.error = error;
      return res.redirect("/players/new");
    }

    const newPlayer = new Player({
      playerName: playerName.trim(),
      image: image.trim(),
      cost: parseFloat(cost),
      isCaptain: isCaptain === "true" || isCaptain === true,
      information: information.trim(),
      team: team,
    });

    const savedPlayer = await newPlayer.save();
    await savedPlayer.populate("team", "teamName");

    console.log("Player created successfully:", savedPlayer);

    const successMsg = `Player "${playerName}" created successfully in team "${teamExists.teamName}"`;

    if (isAjaxRequest(req)) {
      return res.status(201).json({
        status: true,
        message: successMsg,
        player: savedPlayer,
      });
    } else {
      req.session.success = successMsg;
      res.redirect("/players");
    }
  } catch (err) {
    console.error("Create player error:", err);
    const errorMsg =
      err.message || "An error occurred while creating the player";

    if (isAjaxRequest(req)) {
      return res.status(500).json({ error: errorMsg });
    } else {
      req.session.error = errorMsg;
      res.redirect("/players/new");
    }
  }
};

exports.updatePlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { playerName, image, cost, isCaptain, information, team } = req.body;

    console.log("=== DEBUG UPDATE PLAYER ===");
    console.log("Player ID:", playerId);
    console.log("Request body:", req.body);
    console.log("Cost value:", cost);
    console.log("Cost type:", typeof cost);
    console.log("===========================");

    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      const errorMsg = "Invalid player ID";
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error: errorMsg });
      } else {
        req.session.error = errorMsg;
        return res.redirect("/players");
      }
    }

    // Validation
    if (!playerName || !image || !information || !team) {
      const errorMsg = "All fields are required";
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error: errorMsg });
      } else {
        req.session.error = errorMsg;
        return res.redirect(`/players/${playerId}/edit`);
      }
    }

    // Validate cost
    if (cost === undefined || cost === null || cost.toString().trim() === "") {
      const errorMsg = "Cost is required";
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error: errorMsg });
      } else {
        req.session.error = errorMsg;
        return res.redirect(`/players/${playerId}/edit`);
      }
    }

    const parsedCost = parseFloat(cost.toString().trim());

    if (isNaN(parsedCost)) {
      const errorMsg = `Cost must be a valid number. Received: "${cost}"`;
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error: errorMsg });
      } else {
        req.session.error = errorMsg;
        return res.redirect(`/players/${playerId}/edit`);
      }
    }

    if (parsedCost < 0) {
      const errorMsg = "Cost must be a positive number";
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error: errorMsg });
      } else {
        req.session.error = errorMsg;
        return res.redirect(`/players/${playerId}/edit`);
      }
    }

    // Check if team exists
    const teamExists = await Team.findById(team);
    if (!teamExists) {
      const errorMsg = "Selected team does not exist";
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error: errorMsg });
      } else {
        req.session.error = errorMsg;
        return res.redirect(`/players/${playerId}/edit`);
      }
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      playerId,
      {
        playerName: playerName.trim(),
        image: image.trim(),
        cost: parsedCost,
        isCaptain:
          isCaptain === "true" || isCaptain === true || isCaptain === "on",
        information: information.trim(),
        team: team,
      },
      { new: true, runValidators: true }
    );

    if (!updatedPlayer) {
      const errorMsg = "Player not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({ error: errorMsg });
      } else {
        req.session.error = errorMsg;
        return res.redirect("/players");
      }
    }

    await updatedPlayer.populate("team", "teamName");

    const successMsg = `Player "${updatedPlayer.playerName}" updated successfully`;

    if (isAjaxRequest(req)) {
      res.json({
        status: true,
        message: successMsg,
        player: updatedPlayer,
      });
    } else {
      req.session.success = successMsg;
      res.redirect(`/players/${playerId}`);
    }
  } catch (err) {
    console.error("Update player error:", err);
    const errorMsg = err.message || "An error occurred while updating player";

    if (isAjaxRequest(req)) {
      res.status(500).json({ error: errorMsg });
    } else {
      req.session.error = errorMsg;
      res.redirect(`/players/${req.params.playerId}/edit`);
    }
  }
};

exports.deletePlayer = async (req, res) => {
  try {
    const { playerId } = req.params;

    // Check if player exists
    const player = await Player.findById(playerId).populate("team", "teamName");
    if (!player) {
      const error = "Player not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({ error });
      }
      req.session.error = error;
      return res.redirect("/players");
    }

    await Player.findByIdAndDelete(playerId);

    console.log("Player deleted successfully:", player.playerName);

    const successMsg = `Player "${player.playerName}" from team "${player.team.teamName}" deleted successfully`;

    if (isAjaxRequest(req)) {
      return res.status(200).json({ status: true, message: successMsg });
    } else {
      req.session.success = successMsg;
      res.redirect("/players");
    }
  } catch (err) {
    console.error("Delete player error:", err);
    const errorMsg =
      err.message || "An error occurred while deleting the player";

    if (isAjaxRequest(req)) {
      return res.status(500).json({ error: errorMsg });
    } else {
      req.session.error = errorMsg;
      res.redirect("/players");
    }
  }
};

// Show create form
exports.showCreateForm = async (req, res) => {
  try {
    const teams = await Team.find().sort({ teamName: 1 });
    const selectedTeam = req.query.team || "";

    res.render("players/create", {
      title: "Add New Player",
      teams,
      selectedTeam,
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Show create form error:", err);
    req.session.error = "An error occurred while loading the form";
    res.redirect("/players");
  }
};

// Show edit form
exports.showEditForm = async (req, res) => {
  try {
    const { playerId } = req.params;
    const player = await Player.findById(playerId).populate("team");

    if (!player) {
      req.session.error = "Player not found";
      return res.redirect("/players");
    }

    const teams = await Team.find().sort({ teamName: 1 });

    res.render("players/edit", {
      title: `Edit ${player.playerName}`,
      player,
      teams,
      user: req.session.user || null,
    });
  } catch (err) {
    console.error("Show edit form error:", err);
    req.session.error = "An error occurred while loading the form";
    res.redirect("/players");
  }
};

// Comment functions
exports.addComment = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!rating || !content) {
      const error = "Rating and content are required";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    // Validate rating range (1-3)
    const ratingValue = parseInt(rating);
    if (ratingValue < 1 || ratingValue > 3) {
      const error = "Rating must be between 1 and 3";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    // Check if user is admin (admin cannot comment)
    if (req.user.isAdmin) {
      const error = "Admin cannot add comments";
      if (isAjaxRequest(req)) {
        return res.status(403).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    const player = await Player.findById(playerId);
    if (!player) {
      const error = "Player not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/players");
    }

    // Check if user already commented on this player
    const existingComment = player.comments.find(
      (comment) => comment.author.toString() === userId.toString()
    );

    if (existingComment) {
      const error = "You can only comment once per player";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    const newComment = {
      rating: ratingValue,
      content: content.trim(),
      author: userId,
    };

    player.comments.push(newComment);
    await player.save();

    // Populate the new comment for response
    await player.populate("comments.author", "name membername");
    const addedComment = player.comments[player.comments.length - 1];

    const successMsg = "Comment added successfully";

    if (isAjaxRequest(req)) {
      return res.status(201).json({
        success: true,
        message: successMsg,
        data: addedComment,
      });
    } else {
      req.session.success = successMsg;
      res.redirect(`/players/${playerId}`);
    }
  } catch (err) {
    console.error("Add comment error:", err);
    const errorMsg = err.message || "An error occurred while adding comment";

    if (isAjaxRequest(req)) {
      return res.status(500).json({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    } else {
      req.session.error = errorMsg;
      res.redirect(`/players/${req.params.playerId}`);
    }
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { playerId, commentId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!rating || !content) {
      const error = "Rating and content are required";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    // Validate rating range (1-3)
    const ratingValue = parseInt(rating);
    if (ratingValue < 1 || ratingValue > 3) {
      const error = "Rating must be between 1 and 3";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    const player = await Player.findById(playerId);
    if (!player) {
      const error = "Player not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/players");
    }

    const comment = player.comments.id(commentId);
    if (!comment) {
      const error = "Comment not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    // Check if user owns the comment (only comment owner can edit, not admin)
    if (comment.author.toString() !== userId.toString()) {
      const error = "You can only edit your own comments";
      if (isAjaxRequest(req)) {
        return res.status(403).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    comment.rating = ratingValue;
    comment.content = content.trim();

    await player.save();

    const successMsg = "Comment updated successfully";

    if (isAjaxRequest(req)) {
      return res.status(200).json({
        success: true,
        message: successMsg,
        data: comment,
      });
    } else {
      req.session.success = successMsg;
      res.redirect(`/players/${playerId}`);
    }
  } catch (err) {
    console.error("Update comment error:", err);
    const errorMsg = err.message || "An error occurred while updating comment";

    if (isAjaxRequest(req)) {
      return res.status(500).json({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    } else {
      req.session.error = errorMsg;
      res.redirect(`/players/${req.params.playerId}`);
    }
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { playerId, commentId } = req.params;
    const userId = req.user._id;

    const player = await Player.findById(playerId);
    if (!player) {
      const error = "Player not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/players");
    }

    const comment = player.comments.id(commentId);
    if (!comment) {
      const error = "Comment not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    // Check if user owns the comment (only comment owner can delete, not admin)
    if (comment.author.toString() !== userId.toString()) {
      const error = "You can only delete your own comments";
      if (isAjaxRequest(req)) {
        return res.status(403).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect(`/players/${playerId}`);
    }

    // Use pull() method to remove the comment
    player.comments.pull(commentId);
    await player.save();

    const successMsg = "Comment deleted successfully";

    if (isAjaxRequest(req)) {
      return res.status(200).json({
        success: true,
        message: successMsg,
      });
    } else {
      req.session.success = successMsg;
      res.redirect(`/players/${playerId}`);
    }
  } catch (err) {
    console.error("Delete comment error:", err);
    const errorMsg = err.message || "An error occurred while deleting comment";

    if (isAjaxRequest(req)) {
      return res.status(500).json({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    } else {
      req.session.error = errorMsg;
      res.redirect(`/players/${req.params.playerId}`);
    }
  }
};
