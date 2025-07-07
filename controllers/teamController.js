const Team = require("../models/team");
const Player = require("../models/player");
const mongoose = require("mongoose");

// Helper function to check if request is AJAX
const isAjaxRequest = (req) => {
  return (
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.headers["x-requested-with"] === "XMLHttpRequest"
  );
};

exports.getAllTeams = async (req, res) => {
  try {
    // Build search query
    let searchQuery = {};
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      searchQuery = {
        $or: [
          { teamName: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
        ],
      };
    }

    const teams = await Team.find(searchQuery).sort({ teamName: 1 });

    // Get player count for each team
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const playerCount = await Player.countDocuments({ team: team._id });
        const captainCount = await Player.countDocuments({
          team: team._id,
          isCaptain: true,
        });
        const totalCost = await Player.aggregate([
          { $match: { team: team._id } },
          { $group: { _id: null, total: { $sum: "$cost" } } },
        ]);
        return {
          ...team.toObject(),
          playerCount,
          captainCount,
          totalCost: totalCost.length > 0 ? totalCost[0].total : 0,
        };
      })
    );

    if (isAjaxRequest(req)) {
      return res.status(200).json({
        success: true,
        message: "Teams retrieved successfully",
        data: {
          teams: teamsWithStats,
        },
      });
    } else {
      res.render("teams/index", {
        title: "Team Management",
        teams: teamsWithStats,
        user: req.session.user || null,
      });
    }
  } catch (err) {
    console.error("Get teams error:", err);
    const errorMsg = err.message || "An error occurred while fetching teams";

    if (isAjaxRequest(req)) {
      return res.status(500).json({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    } else {
      req.session.error = errorMsg;
      res.redirect("/");
    }
  }
};

exports.createTeam = async (req, res) => {
  try {
    console.log("Create team request - AJAX:", isAjaxRequest(req));
    console.log("Create team request body:", req.body);

    const { teamName } = req.body;

    if (!teamName || !teamName.trim()) {
      const error = "Team name is required";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/teams");
    }

    const existingTeam = await Team.findOne({
      teamName: { $regex: new RegExp(`^${teamName.trim()}$`, "i") },
    });

    if (existingTeam) {
      const error = "Team with this name already exists";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/teams");
    }

    const newTeam = new Team({ teamName: teamName.trim() });
    const savedTeam = await newTeam.save();
    console.log("Team created successfully:", savedTeam);

    const successMsg = `Team "${teamName}" created successfully`;

    if (isAjaxRequest(req)) {
      return res.status(201).json({
        success: true,
        message: successMsg,
        data: savedTeam,
      });
    } else {
      req.session.success = successMsg;
      res.redirect("/teams");
    }
  } catch (err) {
    console.error("Create team error:", err);
    const errorMsg = err.message || "An error occurred while creating the team";

    if (isAjaxRequest(req)) {
      return res.status(500).json({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    } else {
      req.session.error = errorMsg;
      res.redirect("/teams");
    }
  }
};

exports.updateTeam = async (req, res) => {
  try {
    console.log("Update team request - AJAX:", isAjaxRequest(req));
    const { teamId } = req.params;
    const { teamName } = req.body;

    if (!teamName || !teamName.trim()) {
      const error = "Team name is required";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/teams");
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      const error = "Team not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/teams");
    }

    // Check if another team with same name exists
    const existingTeam = await Team.findOne({
      teamName: { $regex: new RegExp(`^${teamName.trim()}$`, "i") },
      _id: { $ne: teamId },
    });

    if (existingTeam) {
      const error = "Another team with this name already exists";
      if (isAjaxRequest(req)) {
        return res.status(400).json({
          success: false,
          message: error,
          error: error,
        });
      }
      req.session.error = error;
      return res.redirect("/teams");
    }

    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { teamName: teamName.trim() },
      { new: true }
    );

    const successMsg = `Team updated to "${teamName}" successfully`;

    if (isAjaxRequest(req)) {
      return res.status(200).json({
        success: true,
        message: successMsg,
        data: updatedTeam,
      });
    } else {
      req.session.success = successMsg;
      res.redirect("/teams");
    }
  } catch (err) {
    console.error("Update team error:", err);
    const errorMsg = err.message || "An error occurred while updating the team";

    if (isAjaxRequest(req)) {
      return res.status(500).json({ error: errorMsg });
    } else {
      req.session.error = errorMsg;
      res.redirect("/teams");
    }
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      const error = "Team not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({ error });
      }
      req.session.error = error;
      return res.redirect("/teams");
    }

    // Check if team has players
    const playerCount = await Player.countDocuments({ team: teamId });
    if (playerCount > 0) {
      const error = `Cannot delete team "${team.teamName}" because it has ${playerCount} player(s). Please reassign or delete the players first.`;
      if (isAjaxRequest(req)) {
        return res.status(400).json({ error });
      }
      req.session.error = error;
      return res.redirect("/teams");
    }

    await Team.findByIdAndDelete(teamId);

    const successMsg = `Team "${team.teamName}" deleted successfully`;

    if (isAjaxRequest(req)) {
      return res.status(200).json({
        success: true,
        message: successMsg,
        data: null,
      });
    } else {
      req.session.success = successMsg;
      res.redirect("/teams");
    }
  } catch (err) {
    console.error("Delete team error:", err);
    const errorMsg = err.message || "An error occurred while deleting the team";

    if (isAjaxRequest(req)) {
      return res.status(500).json({
        success: false,
        message: errorMsg,
        error: errorMsg,
      });
    } else {
      req.session.error = errorMsg;
      res.redirect("/teams");
    }
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
      const error = "Team not found";
      if (isAjaxRequest(req)) {
        return res.status(404).json({ error });
      }
      req.session.error = error;
      return res.redirect("/teams");
    }

    // Get players in this team
    const players = await Player.find({ team: teamId }).sort({ playerName: 1 });
    const playerCount = players.length;
    const captainCount = players.filter((player) => player.isCaptain).length;
    const totalCost = players.reduce((sum, player) => sum + player.cost, 0);

    const teamWithDetails = {
      ...team.toObject(),
      players,
      playerCount,
      captainCount,
      totalCost,
    };

    if (isAjaxRequest(req)) {
      return res.status(200).json({ status: true, team: teamWithDetails });
    } else {
      res.render("teams/detail", {
        title: `${team.teamName} - Team Details`,
        team: teamWithDetails,
        user: req.session.user || null,
      });
    }
  } catch (err) {
    console.error("Get team by ID error:", err);
    const errorMsg =
      err.message || "An error occurred while fetching team details";

    if (isAjaxRequest(req)) {
      return res.status(500).json({ error: errorMsg });
    } else {
      req.session.error = errorMsg;
      res.redirect("/teams");
    }
  }
};
