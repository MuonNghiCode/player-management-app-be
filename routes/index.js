const express = require("express");
const router = express.Router();
const Player = require("../models/player");
const Team = require("../models/team");

/* GET home page. */
router.get("/", async function (req, res, next) {
  try {
    const { search, team } = req.query;
    let filter = {};

    if (search) {
      filter.playerName = { $regex: search, $options: "i" };
    }

    if (team) {
      filter.team = team;
    }

    const players = await Player.find(filter).populate("team", "teamName");
    const teams = await Team.find().sort({ teamName: 1 });

    res.render("index", {
      title: "Football Player Management",
      players,
      teams,
      search: search || "",
      selectedTeam: team || "",
      user: req.session.user || null, // Thêm user từ session
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
