const Player = require("../models/Player");

const createPlayer = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Player name is required",
      });
    }

    const player = await Player.create({
      name: name.trim(),
    });

    res.status(201).json(player);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create player",
    });
  }
};

const getPlayers = async (req, res) => {
  try {
    const players = await Player.find().sort({ name: 1 });

    res.json(players);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch players",
    });
  }
};

module.exports = {
  createPlayer,
  getPlayers,
};
