const mongoose = require("mongoose");

const ballSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },

    innings: {
      type: Number,
      required: true,
    },

    over: {
      type: Number,
      required: true,
    },

    ball: {
      type: Number,
      required: true,
    },

    striker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    nonStriker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    bowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },

    runs: {
      type: Number,
      default: 0,
    },

    extraType: {
      type: String,
      enum: ["wide", "noball", "bye", "legbye", null],
      default: null,
    },

    extraRuns: {
      type: Number,
      default: 0,
    },

    isWicket: {
      type: Boolean,
      default: false,
    },

    wicketType: {
      type: String,
      enum: ["normal", "runout", null],
      default: null,
    },

    teamScore: {
      type: Number,
      required: true,
    },

    teamWickets: {
      type: Number,
      required: true,
    },

    eventType: {
      type: String,
      enum: ["run", "wicket", "runout", "wide", "noball", "bye", "legbye"],
      required: true,
    },

    nextBatter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },

    legalBall: {
      type: Boolean,
      default: true,
    },

    outPlayer: {
      type: String,
      enum: ["striker", "nonStriker"],
    },

    completedRuns: {
      type: Number,
      default: 0,
    },

    previousStriker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },

    previousNonStriker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },

    previousBowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },

    previousWaitingForBowler: {
      type: Boolean,
      default: false,
    },

    previousInnings: {
      type: Number,
    },

    previousTarget: {
      type: Number,
      default: null,
    },

    previousStatus: {
      type: String,
    },

    previousTeam1Score: Number,
    previousTeam1Wickets: Number,
    previousTeam1Balls: Number,

    previousTeam2Score: Number,
    previousTeam2Wickets: Number,
    previousTeam2Balls: Number,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Ball", ballSchema);
