const router = require("express").Router();

const {
  createMatch,
  getMatch,
  startMatch,
  addRuns,
  undoBall,
  addExtra,
  getMatches,
  addWicket,
  addRunOut,
  changeBowler,
  getScorecard,
  allOut,
} = require("../controllers/matchController");

router.post("/", createMatch);
router.patch("/:id/bowler", changeBowler);
router.get("/", getMatches);

router.get("/:id", getMatch);
router.patch("/:id/start", startMatch);
router.patch("/:id/runs", addRuns);
router.patch("/:id/undo", undoBall);
router.patch("/:id/extra", addExtra);

router.patch("/:id/wicket", addWicket);

router.patch("/:id/runout", addRunOut);

router.patch("/:id/allout", allOut);

router.get("/:id/scorecard", getScorecard);

module.exports = router;
