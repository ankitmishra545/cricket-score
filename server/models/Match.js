const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    teamA: {
      type: String,
      required: true,
      trim: true,
    },

    teamB: {
      type: String,
      required: true,
      trim: true,
    },

    totalOvers: {
      type: Number,
      required: true,
    },

    firstBattingTeam: {
      type: String,
      required: true,
    },

    secondBattingTeam: {
      type: String,
      required: true,
    },

    innings: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["live", "completed"],
      default: "live",
    },

    striker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },

    nonStriker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },

    currentBowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },

    waitingForBowler: {
      type: Boolean,
      default: false,
    },

    team1Score: {
      type: Number,
      default: 0,
    },

    team1Wickets: {
      type: Number,
      default: 0,
    },

    team1Balls: {
      type: Number,
      default: 0,
    },

    team2Score: {
      type: Number,
      default: 0,
    },

    team2Wickets: {
      type: Number,
      default: 0,
    },

    team2Balls: {
      type: Number,
      default: 0,
    },

    target: {
      type: Number,
      default: null,
    },

    result: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Match", matchSchema);
