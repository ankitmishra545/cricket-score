const Match = require("../models/Match");
const Ball = require("../models/Ball");
const Player = require("../models/Player");
const buildMatchResponse = require("../utils/buildMatchResponse");

const createMatch = async (req, res) => {
  try {
    const { teamA, teamB, totalOvers, firstBattingTeam } = req.body;

    if (!teamA || !teamB || !totalOvers || !firstBattingTeam) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (teamA.trim() === teamB.trim()) {
      return res.status(400).json({
        message: "Teams cannot be same",
      });
    }

    const secondBattingTeam = firstBattingTeam === teamA ? teamB : teamA;

    const match = await Match.create({
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      totalOvers: Number(totalOvers),
      firstBattingTeam,
      secondBattingTeam,
    });

    res.status(201).json(match);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create match",
    });
  }
};

const getMatch = async (req, res) => {
  try {
    const match = await buildMatchResponse(req.params.id);

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      });
    }

    res.json(match);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch match",
    });
  }
};

const startMatch = async (req, res) => {
  try {
    const { striker, nonStriker, bowler } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      });
    }

    match.striker = striker;
    match.nonStriker = nonStriker;
    match.currentBowler = bowler;
    match.waitingForBowler = false;

    await match.save();

    const updated = await buildMatchResponse(match._id);

    const io = req.app.get("io");

    if (io) {
      io.to(match._id.toString()).emit("match-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to start match",
    });
  }
};

const addRuns = async (req, res) => {
  try {
    const { runs } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      });
    }

    if (match.status === "completed") {
      return res.status(400).json({
        message: "Match already completed",
      });
    }

    if (!match.currentBowler) {
      return res.status(400).json({
        message: "Please select bowler",
      });
    }

    const inningsKey = match.innings === 1 ? "team1" : "team2";

    const scoreField = `${inningsKey}Score`;
    const ballsField = `${inningsKey}Balls`;

    const totalBalls = match[ballsField];

    const over = Math.floor(totalBalls / 6);
    const ball = (totalBalls % 6) + 1;

    // Save current players for this ball
    const strikerAtBall = match.striker;
    const nonStrikerAtBall = match.nonStriker;
    const bowlerAtBall = match.currentBowler;

    const previousState = {
      previousStriker: match.striker,
      previousNonStriker: match.nonStriker,
      previousBowler: match.currentBowler,

      previousWaitingForBowler: match.waitingForBowler,

      previousInnings: match.innings,
      previousTarget: match.target,
      previousStatus: match.status,

      previousTeam1Score: match.team1Score,
      previousTeam1Wickets: match.team1Wickets,
      previousTeam1Balls: match.team1Balls,

      previousTeam2Score: match.team2Score,
      previousTeam2Wickets: match.team2Wickets,
      previousTeam2Balls: match.team2Balls,
    };

    // Update score and balls
    match[scoreField] += Number(runs);
    match[ballsField] += 1;

    const inningsBalls = match[ballsField];

    // Odd runs => strike change
    if (runs % 2 === 1) {
      const temp = match.striker;
      match.striker = match.nonStriker;
      match.nonStriker = temp;
    }

    // Save ball event
    await Ball.create({
      ...previousState,

      matchId: match._id,

      innings: match.innings,

      over,
      ball,

      striker: strikerAtBall,
      nonStriker: nonStrikerAtBall,
      bowler: bowlerAtBall,

      runs: Number(runs),

      eventType: "run",

      legalBall: true,

      teamScore: match[scoreField],

      teamWickets: match.innings === 1 ? match.team1Wickets : match.team2Wickets,
    });

    const inningsOver = Math.floor(inningsBalls / 6);
    const inningsBall = inningsBalls % 6;

    const overCompleted = inningsBalls > 0 && inningsBall === 0;

    // Over completed
    if (overCompleted) {
      // Change strike at over end
      match.waitingForBowler = true;

      const temp = match.striker;

      match.striker = match.nonStriker;
      match.nonStriker = temp;
    }

    // Innings completed
    if (inningsOver >= match.totalOvers && inningsBall === 0) {
      if (match.innings === 1) {
        match.target = match.team1Score + 1;

        match.innings = 2;
        match.waitingForBowler = false;

        match.striker = null;
        match.nonStriker = null;
        match.currentBowler = null;
      } else {
        match.status = "completed";

        if (match.team2Score >= match.target) {
          match.result = `${match.secondBattingTeam} won`;
        } else {
          match.result = `${match.firstBattingTeam} won`;
        }
      }
    }

    // Chase completed
    if (match.innings === 2 && match.target && match.team2Score >= match.target) {
      match.status = "completed";
      match.result = `${match.secondBattingTeam} won`;
    }

    await match.save();

    const updated = await buildMatchResponse(match._id);

    const io = req.app.get("io");

    if (io) {
      io.to(match._id.toString()).emit("match-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add runs",
    });
  }
};

const undoBall = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      });
    }

    if (match.status === "completed") {
      return res.status(400).json({
        message: "Match already completed",
      });
    }

    const lastBall = await Ball.findOne({
      matchId: match._id,
    }).sort({ createdAt: -1 });

    if (!lastBall) {
      return res.status(400).json({
        message: "No balls to undo",
      });
    }

    match.striker = lastBall.previousStriker;
    match.nonStriker = lastBall.previousNonStriker;
    match.currentBowler = lastBall.previousBowler;

    match.waitingForBowler = lastBall.previousWaitingForBowler;

    match.innings = lastBall.previousInnings;
    match.target = lastBall.previousTarget;
    match.status = lastBall.previousStatus;

    match.team1Score = lastBall.previousTeam1Score;

    match.team1Wickets = lastBall.previousTeam1Wickets;

    match.team1Balls = lastBall.previousTeam1Balls;

    match.team2Score = lastBall.previousTeam2Score;

    match.team2Wickets = lastBall.previousTeam2Wickets;

    match.team2Balls = lastBall.previousTeam2Balls;

    // Result reset
    if (match.status === "live") {
      match.result = "";
    }

    await lastBall.deleteOne();

    await match.save();

    const updated = await buildMatchResponse(match._id);

    const io = req.app.get("io");

    if (io) {
      io.to(match._id.toString()).emit("match-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to undo ball",
    });
  }
};

const addExtra = async (req, res) => {
  try {
    const { type, runs, completedRuns = 0 } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      });
    }

    if (match.status === "completed") {
      return res.status(400).json({
        message: "Match already completed",
      });
    }

    if (!match.currentBowler) {
      return res.status(400).json({
        message: "Please select bowler",
      });
    }

    const validTypes = ["wide", "noball", "bye", "legbye"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid extra type",
      });
    }

    const inningsKey = match.innings === 1 ? "team1" : "team2";

    const scoreField = `${inningsKey}Score`;
    const ballsField = `${inningsKey}Balls`;

    const legalBall = type === "bye" || type === "legbye";

    const totalBalls = match[ballsField];

    const over = Math.floor(totalBalls / 6);
    const ball = (totalBalls % 6) + 1;

    const strikerAtBall = match.striker;
    const nonStrikerAtBall = match.nonStriker;
    const bowlerAtBall = match.currentBowler;

    const previousState = {
      previousStriker: match.striker,
      previousNonStriker: match.nonStriker,
      previousBowler: match.currentBowler,

      previousWaitingForBowler: match.waitingForBowler,

      previousInnings: match.innings,
      previousTarget: match.target,
      previousStatus: match.status,

      previousTeam1Score: match.team1Score,
      previousTeam1Wickets: match.team1Wickets,
      previousTeam1Balls: match.team1Balls,

      previousTeam2Score: match.team2Score,
      previousTeam2Wickets: match.team2Wickets,
      previousTeam2Balls: match.team2Balls,
    };

    match[scoreField] += Number(runs);

    if (legalBall) {
      match[ballsField] += 1;
    }

    const inningsBalls = match[ballsField];

    // Save ball event
    await Ball.create({
      ...previousState,
      matchId: match._id,

      innings: match.innings,

      over,
      ball,

      striker: strikerAtBall,
      nonStriker: nonStrikerAtBall,
      bowler: bowlerAtBall,

      runs: 0,

      extraType: type,
      extraRuns: Number(runs),

      eventType: type,

      legalBall,

      completedRuns: Number(completedRuns),

      teamScore: match[scoreField],

      teamWickets: match.innings === 1 ? match.team1Wickets : match.team2Wickets,
    });

    const shouldSwapStrike =
      type === "wide" || type === "noball" ? Number(completedRuns) % 2 === 1 : Number(runs) % 2 === 1;

    if (shouldSwapStrike) {
      const temp = match.striker;

      match.striker = match.nonStriker;
      match.nonStriker = temp;
    }

    const inningsOver = Math.floor(inningsBalls / 6);

    const inningsBall = inningsBalls % 6;

    const overCompleted = legalBall && inningsBalls > 0 && inningsBall === 0;

    if (overCompleted) {
      match.waitingForBowler = true;

      const temp = match.striker;

      match.striker = match.nonStriker;
      match.nonStriker = temp;
    }

    if (match.innings === 2 && match.target && match.team2Score >= match.target) {
      match.status = "completed";
      match.result = `${match.secondBattingTeam} won`;
    }

    if (legalBall && inningsOver >= match.totalOvers && inningsBall === 0) {
      if (match.innings === 1) {
        match.target = match.team1Score + 1;

        match.innings = 2;
        match.waitingForBowler = false;

        match.striker = null;
        match.nonStriker = null;
        match.currentBowler = null;
      } else {
        match.status = "completed";

        match.result =
          match.team2Score >= match.target ? `${match.secondBattingTeam} won` : `${match.firstBattingTeam} won`;
      }
    }

    await match.save();

    const updated = await buildMatchResponse(match._id);

    const io = req.app.get("io");

    if (io) {
      io.to(match._id.toString()).emit("match-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add extra",
    });
  }
};

const addWicket = async (req, res) => {
  try {
    const { nextBatter } = req.body;

    const match = await Match.findById(req.params.id);

    const inningsKey = match.innings === 1 ? "team1" : "team2";

    const wicketsField = `${inningsKey}Wickets`;
    const ballsField = `${inningsKey}Balls`;
    const scoreField = `${inningsKey}Score`;

    const totalBalls = match[ballsField];

    const over = Math.floor(totalBalls / 6);
    const ball = (totalBalls % 6) + 1;

    const strikerAtBall = match.striker;
    const nonStrikerAtBall = match.nonStriker;
    const bowlerAtBall = match.currentBowler;

    const previousState = {
      previousStriker: match.striker,
      previousNonStriker: match.nonStriker,
      previousBowler: match.currentBowler,

      previousWaitingForBowler: match.waitingForBowler,

      previousInnings: match.innings,
      previousTarget: match.target,
      previousStatus: match.status,

      previousTeam1Score: match.team1Score,
      previousTeam1Wickets: match.team1Wickets,
      previousTeam1Balls: match.team1Balls,

      previousTeam2Score: match.team2Score,
      previousTeam2Wickets: match.team2Wickets,
      previousTeam2Balls: match.team2Balls,
    };

    match[wicketsField] += 1;
    match[ballsField] += 1;

    const overCompleted = match[ballsField] > 0 && match[ballsField] % 6 === 0;

    if (overCompleted) {
      match.waitingForBowler = true;

      // New batter non-striker end par rahega
      match.nonStriker = nextBatter;
    } else {
      // Wicket over ke beech mein gira
      match.striker = nextBatter;
    }

    // Save ball event
    await Ball.create({
      ...previousState,

      matchId: match._id,

      innings: match.innings,

      over,
      ball,

      striker: strikerAtBall,
      nonStriker: nonStrikerAtBall,
      bowler: bowlerAtBall,

      runs: 0,

      isWicket: true,
      wicketType: "normal",

      eventType: "wicket",

      legalBall: true,

      nextBatter,

      teamScore: match[scoreField],
      teamWickets: match[wicketsField],
    });

    await match.save();

    const updated = await buildMatchResponse(match._id);

    const io = req.app.get("io");

    if (io) {
      io.to(match._id.toString()).emit("match-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add wicket",
    });
  }
};

const addRunOut = async (req, res) => {
  try {
    const { runs, outPlayer, nextBatter, completedRuns = runs } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      });
    }

    if (match.status === "completed") {
      return res.status(400).json({
        message: "Match already completed",
      });
    }

    if (!match.currentBowler) {
      return res.status(400).json({
        message: "Please select bowler",
      });
    }

    if (!["striker", "nonStriker"].includes(outPlayer)) {
      return res.status(400).json({
        message: "Invalid out player",
      });
    }

    const inningsKey = match.innings === 1 ? "team1" : "team2";

    const scoreField = `${inningsKey}Score`;
    const wicketsField = `${inningsKey}Wickets`;
    const ballsField = `${inningsKey}Balls`;

    const totalBalls = match[ballsField];

    const over = Math.floor(totalBalls / 6);
    const ball = (totalBalls % 6) + 1;

    const strikerAtBall = match.striker;
    const nonStrikerAtBall = match.nonStriker;
    const bowlerAtBall = match.currentBowler;

    const previousState = {
      previousStriker: match.striker,
      previousNonStriker: match.nonStriker,
      previousBowler: match.currentBowler,

      previousWaitingForBowler: match.waitingForBowler,

      previousInnings: match.innings,
      previousTarget: match.target,
      previousStatus: match.status,

      previousTeam1Score: match.team1Score,
      previousTeam1Wickets: match.team1Wickets,
      previousTeam1Balls: match.team1Balls,

      previousTeam2Score: match.team2Score,
      previousTeam2Wickets: match.team2Wickets,
      previousTeam2Balls: match.team2Balls,
    };

    match[scoreField] += Number(runs);
    match[wicketsField] += 1;
    match[ballsField] += 1;

    // Save ball event
    await Ball.create({
      ...previousState,
      matchId: match._id,

      innings: match.innings,

      completedRuns: Number(completedRuns),

      over,
      ball,

      striker: strikerAtBall,
      nonStriker: nonStrikerAtBall,
      bowler: bowlerAtBall,

      runs: Number(runs),

      isWicket: true,
      wicketType: "runout",

      eventType: "runout",

      legalBall: true,

      nextBatter,
      outPlayer,
      nextBatter,
      outPlayer,
      completedRuns: Number(completedRuns),

      teamScore: match[scoreField],

      teamWickets: match[wicketsField],
    });

    // Runs complete hone ke baad kaun strike par hoga?
    const strikerAfterRuns = runs % 2 === 1 ? nonStrikerAtBall : strikerAtBall;

    const nonStrikerAfterRuns = runs % 2 === 1 ? strikerAtBall : nonStrikerAtBall;

    // Pehle completed runs ke hisab se strike set karo
    match.striker = strikerAfterRuns;
    match.nonStriker = nonStrikerAfterRuns;

    // Phir jo player out hua use replace karo
    if (outPlayer === "striker") {
      match.striker = nextBatter;
    } else {
      match.nonStriker = nextBatter;
    }

    const overCompleted = match[ballsField] > 0 && match[ballsField] % 6 === 0;

    // Over complete hua to strike change hogi
    if (overCompleted) {
      match.waitingForBowler = true;

      if (outPlayer === "striker") {
        match.striker = match.nonStriker;
        match.nonStriker = nextBatter;
      } else {
        match.striker = match.striker;
        match.nonStriker = nextBatter;
      }
    }

    const inningsBalls = match[ballsField];

    const inningsOver = Math.floor(inningsBalls / 6);

    const inningsBall = inningsBalls % 6;

    if (inningsOver >= match.totalOvers && inningsBall === 0) {
      if (match.innings === 1) {
        match.target = match.team1Score + 1;

        match.innings = 2;
        match.waitingForBowler = false;

        match.striker = null;
        match.nonStriker = null;
        match.currentBowler = null;
      } else {
        match.status = "completed";

        match.result =
          match.team2Score >= match.target ? `${match.secondBattingTeam} won` : `${match.firstBattingTeam} won`;
      }
    }

    if (match.innings === 2 && match.target && match.team2Score >= match.target) {
      match.status = "completed";

      match.result = `${match.secondBattingTeam} won`;
    }

    await match.save();

    const updated = await buildMatchResponse(match._id);

    const io = req.app.get("io");

    if (io) {
      io.to(match._id.toString()).emit("match-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add run out",
    });
  }
};

const allOut = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (match.innings === 1) {
      match.target = match.team1Score + 1;

      match.innings = 2;
      match.waitingForBowler = false;

      match.striker = null;
      match.nonStriker = null;
      match.currentBowler = null;
    } else {
      match.status = "completed";

      if (match.team2Score >= match.target) {
        match.result = `${match.secondBattingTeam} won`;
      } else {
        match.result = `${match.firstBattingTeam} won`;
      }
    }

    await match.save();

    const updated = await buildMatchResponse(match._id);

    const io = req.app.get("io");

    if (io) {
      io.to(match._id.toString()).emit("match-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to end innings",
    });
  }
};

const changeBowler = async (req, res) => {
  try {
    const { bowlerId } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        message: "Match not found",
      });
    }

    if (match.status === "completed") {
      return res.status(400).json({
        message: "Match already completed",
      });
    }

    match.currentBowler = bowlerId;

    match.waitingForBowler = false;

    await match.save();

    const updated = await buildMatchResponse(match._id);

    const io = req.app.get("io");

    if (io) {
      io.to(match._id.toString()).emit("match-updated", updated);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to change bowler",
    });
  }
};

const getScorecard = async (req, res) => {
  try {
    const balls = await Ball.find({
      matchId: req.params.id,
    })
      .populate("striker", "name")
      .populate("bowler", "name")
      .lean();

    const batting = {};
    const bowling = {};

    const extras = {
      wide: 0,
      noball: 0,
      bye: 0,
      legbye: 0,
    };

    balls.forEach((ball) => {
      const batterId = ball.striker?._id?.toString();
      const batterName = ball.striker?.name;

      if (batterId) {
        if (!batting[batterId]) {
          batting[batterId] = {
            name: batterName,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
          };
        }

        if (!["wide", "noball"].includes(ball.eventType)) {
          batting[batterId].balls += 1;
        }

        if (!["wide", "noball", "bye", "legbye"].includes(ball.eventType)) {
          batting[batterId].runs += ball.runs;

          if (ball.runs === 4) {
            batting[batterId].fours += 1;
          }

          if (ball.runs === 6) {
            batting[batterId].sixes += 1;
          }
        }
      }

      const bowlerId = ball.bowler?._id?.toString();
      const bowlerName = ball.bowler?.name;

      if (bowlerId) {
        if (!bowling[bowlerId]) {
          bowling[bowlerId] = {
            name: bowlerName,
            balls: 0,
            runs: 0,
            wickets: 0,
          };
        }

        if (!["wide", "noball"].includes(ball.eventType)) {
          bowling[bowlerId].balls += 1;
        }

        bowling[bowlerId].runs += ball.runs + (ball.extraRuns || 0);

        if (ball.eventType === "wicket") {
          bowling[bowlerId].wickets += 1;
        }
      }

      if (ball.extraType) {
        extras[ball.extraType] += ball.extraRuns;
      }
    });

    res.json({
      batting: Object.values(batting),
      bowling: Object.values(bowling),
      extras,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch scorecard",
    });
  }
};

const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 }).lean();

    res.json(matches);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch matches",
    });
  }
};

module.exports = {
  createMatch,
  getMatch,
  startMatch,
  getMatches,
  getScorecard,
  changeBowler,
  addRuns,
  undoBall,
  addExtra,
  addWicket,
  addRunOut,
  allOut,
};
