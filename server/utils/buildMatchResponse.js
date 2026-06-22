const Match = require("../models/Match");
const Ball = require("../models/Ball");

const buildMatchResponse = async (matchId) => {
  const match = await Match.findById(matchId)
    .populate("striker", "name")
    .populate("nonStriker", "name")
    .populate("currentBowler", "name")
    .lean();

  if (!match) return null;

  const balls = await Ball.find({
    matchId: match._id,
    innings: match.innings,
  })
    .sort({ createdAt: 1 })
    .lean();

  match.recentBalls = balls.slice(-6);

  const getBatterStats = (playerId) => {
    let runs = 0;
    let ballsFaced = 0;

    balls.forEach((ball) => {
      if (ball.striker?.toString() !== playerId?.toString()) {
        return;
      }

      const legalBall = ball.eventType !== "wide" && ball.eventType !== "noball";

      if (legalBall) {
        ballsFaced++;
      }

      if (ball.eventType === "run" || ball.eventType === "runout") {
        runs += ball.runs || 0;
      }
    });

    return {
      runs,
      balls: ballsFaced,
    };
  };

  const getBowlerStats = (playerId) => {
    let runs = 0;
    let wickets = 0;
    let legalBalls = 0;

    balls.forEach((ball) => {
      if (ball.bowler?.toString() !== playerId?.toString()) {
        return;
      }

      runs += (ball.runs || 0) + (ball.extraRuns || 0);

      if (ball.legalBall) {
        legalBalls++;
      }

      if (ball.wicketType === "normal") {
        wickets++;
      }
    });

    return {
      overs: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      runs,
      wickets,
    };
  };

  match.strikerStats = match.striker ? getBatterStats(match.striker._id) : null;

  match.nonStrikerStats = match.nonStriker ? getBatterStats(match.nonStriker._id) : null;

  match.currentBowlerStats = match.currentBowler ? getBowlerStats(match.currentBowler._id) : null;

  return match;
};

module.exports = buildMatchResponse;
