import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getPlayers } from "../services/playerService";
import { formatBall } from "../utils/formatBall";
import { socket } from "../socket/socket";
import {
  getMatch,
  startMatch,
  addRuns,
  undoBall,
  addExtra,
  addWicket,
  addRunOut,
  allOut,
  changeBowler,
  changeStrike,
} from "../services/matchService";

export default function ScorePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [outPlayer, setOutPlayer] = useState("striker");

  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");

  const [showWicketModal, setShowWicketModal] = useState(false);

  const [showRunOutModal, setShowRunOutModal] = useState(false);

  const [nextBatter, setNextBatter] = useState("");

  const [runOutRuns, setRunOutRuns] = useState(0);

  const isMatchCompleted = match?.status === "completed";

  const loadData = async () => {
    try {
      const [matchData, playersData] = await Promise.all([getMatch(id), getPlayers()]);

      setMatch(matchData);
      setPlayers(playersData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    socket.connect();

    socket.emit("join-match", id);

    socket.on("match-updated", (data) => {
      setMatch(data);
    });

    return () => {
      socket.off("match-updated");
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (match && !match.striker && !match.nonStriker && !match.currentBowler) {
      setStriker("");
      setNonStriker("");
      setBowler("");
    }
  }, [match]);

  const handleStart = async () => {
    if (!striker || !nonStriker || !bowler) {
      return alert("Select all players");
    }

    if (striker === nonStriker || striker === bowler || nonStriker === bowler) {
      return alert("Players must be different");
    }

    const updated = await startMatch(id, {
      striker,
      nonStriker,
      bowler,
    });

    setMatch(updated);

    setStriker("");
    setNonStriker("");
    setBowler("");

    navigate(0);
  };

  const handleBowlerChange = async (e) => {
    const updated = await changeBowler(id, e.target.value);

    setMatch(updated);
  };

  const refreshMatch = async () => {
    const data = await getMatch(id);

    setMatch(data);
  };

  const handleRun = async (runs) => {
    await addRuns(id, runs);

    refreshMatch();
  };

  const handleUndo = async () => {
    await undoBall(id);

    refreshMatch();
  };

  const handleExtra = async (type) => {
    const runs = prompt("Enter runs");

    if (!runs) return;

    await addExtra(id, type, Number(runs));

    refreshMatch();
  };

  const handleWicket = () => {
    setNextBatter("");
    setShowWicketModal(true);
  };

  const handleRunOut = () => {
    setRunOutRuns(0);
    setNextBatter("");
    setShowRunOutModal(true);
  };

  const submitWicket = async () => {
    if (!nextBatter) {
      return alert("Select next batter");
    }

    const updated = await addWicket(id, nextBatter);

    setMatch(updated);

    setShowWicketModal(false);
  };

  const handleChangeStrike = async () => {
    const updated = await changeStrike(id);

    setMatch(updated);
  };

  const submitRunOut = async () => {
    if (!nextBatter) {
      return alert("Select next batter");
    }

    const updated = await addRunOut(id, runOutRuns, outPlayer, nextBatter);

    setMatch(updated);

    setShowRunOutModal(false);
  };

  const handleAllOut = async () => {
    await allOut(id);

    refreshMatch();
  };

  if (!match) return <h2>Loading...</h2>;

  const started = Boolean(match.striker && match.nonStriker && match.currentBowler);

  const waitingForBowler = match.waitingForBowler;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "24px auto",
        padding: "16px",
        fontFamily: "Arial, sans-serif",
        color: "#222",
      }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              {match.teamA} vs {match.teamB}
            </h2>

            <p style={{ margin: "6px 0 0", color: "#666" }}>
              {match.totalOvers} Overs • {match.innings === 1 ? "1st Innings" : "2nd Innings"}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, fontSize: "32px" }}>
              {match.innings === 1
                ? `${match.team1Score}/${match.team1Wickets}`
                : `${match.team2Score}/${match.team2Wickets}`}
            </h1>

            <p style={{ margin: "6px 0 0", color: "#666" }}>
              Overs:{" "}
              {match.innings === 1
                ? `${Math.floor(match.team1Balls / 6)}.${match.team1Balls % 6}`
                : `${Math.floor(match.team2Balls / 6)}.${match.team2Balls % 6}`}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={{ border: "1px solid #eee", padding: "12px", borderRadius: "8px" }}>
            <strong>Batting</strong>
            <p style={{ margin: "6px 0 0" }}>
              {match.innings === 1 ? match.firstBattingTeam : match.secondBattingTeam}
            </p>
          </div>

          <div style={{ border: "1px solid #eee", padding: "12px", borderRadius: "8px" }}>
            <strong>Bowling</strong>
            <p style={{ margin: "6px 0 0" }}>
              {match.innings === 1 ? match.secondBattingTeam : match.firstBattingTeam}
            </p>
          </div>

          {match.innings === 2 && (
            <div style={{ border: "1px solid #eee", padding: "12px", borderRadius: "8px" }}>
              <strong>Target</strong>

              <p style={{ margin: "6px 0 0" }}>
                {match.target} ({match.target - match.team2Score} runs needed in{" "}
                {match.totalOvers * 6 - match.team2Balls} balls)
              </p>
            </div>
          )}
        </div>

        {!started ? (
          <>
            <h3 style={{ marginBottom: "16px" }}>{match.innings === 1 ? "Opening Setup" : "Second Innings Setup"}</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: "12px",
              }}
            >
              <select value={striker} onChange={(e) => setStriker(e.target.value)}>
                <option value="">Select Striker</option>

                {players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.name}
                  </option>
                ))}
              </select>

              <select value={nonStriker} onChange={(e) => setNonStriker(e.target.value)}>
                <option value="">Select Non-Striker</option>

                {players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.name}
                  </option>
                ))}
              </select>

              <select value={bowler} onChange={(e) => setBowler(e.target.value)}>
                <option value="">Select Bowler</option>

                {players.map((player) => (
                  <option key={player._id} value={player._id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStart}
              style={{
                marginTop: "16px",
                padding: "10px 18px",
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
                borderRadius: "6px",
              }}
            >
              {match.innings === 1 ? "Start Match" : "Start 2nd Innings"}
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={{ border: "1px solid #eee", padding: "12px", borderRadius: "8px" }}>
                <strong>Striker</strong>
                <p style={{ margin: "6px 0 0" }}>{match.striker?.name}</p>
              </div>

              <div style={{ border: "1px solid #eee", padding: "12px", borderRadius: "8px" }}>
                <strong>Non-Striker</strong>
                <p style={{ margin: "6px 0 0" }}>{match.nonStriker?.name}</p>
              </div>

              <div style={{ border: "1px solid #eee", padding: "12px", borderRadius: "8px" }}>
                <strong>Bowler</strong>
                <p style={{ margin: "6px 0 0" }}>{match.currentBowler?.name}</p>
              </div>
            </div>

            {waitingForBowler && (
              <div style={{ marginBottom: "20px" }}>
                <h3>Select Next Bowler</h3>

                <select defaultValue="" onChange={handleBowlerChange}>
                  <option value="">Select Bowler</option>

                  {players.map((player) => (
                    <option key={player._id} value={player._id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <h3>Recent Balls</h3>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {match.recentBalls?.length ? (
                  match.recentBalls.map((ball) => (
                    <div
                      key={ball._id}
                      style={{
                        width: "42px",
                        height: "42px",
                        border: "1px solid #ddd",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                      }}
                    >
                      {formatBall(ball)}
                    </div>
                  ))
                ) : (
                  <p>No balls yet</p>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                <button
                  key={run}
                  disabled={waitingForBowler || isMatchCompleted}
                  onClick={() => handleRun(run)}
                  style={{
                    width: "60px",
                    height: "60px",
                    fontSize: "20px",
                  }}
                >
                  {run}
                </button>
              ))}

              <button
                disabled={waitingForBowler || isMatchCompleted}
                onClick={() => handleExtra("wide")}
                style={{
                  width: "60px",
                  height: "60px",
                  fontSize: "20px",
                }}
              >
                Wide
              </button>

              <button
                disabled={waitingForBowler || isMatchCompleted}
                onClick={() => handleExtra("noball")}
                style={{
                  width: "60px",
                  height: "60px",
                  fontSize: "20px",
                }}
              >
                No Ball
              </button>

              <button
                disabled={waitingForBowler || isMatchCompleted}
                onClick={() => handleExtra("bye")}
                style={{
                  width: "60px",
                  height: "60px",
                  fontSize: "20px",
                }}
              >
                Bye
              </button>

              <button
                disabled={waitingForBowler || isMatchCompleted}
                onClick={handleWicket}
                style={{
                  width: "60px",
                  height: "60px",
                  fontSize: "16px",
                }}
              >
                Wicket
              </button>

              <button
                disabled={waitingForBowler || isMatchCompleted}
                onClick={handleRunOut}
                style={{
                  width: "60px",
                  height: "60px",
                  fontSize: "16px",
                }}
              >
                Run Out
              </button>

              <button
                disabled={waitingForBowler || isMatchCompleted}
                onClick={handleAllOut}
                style={{
                  width: "60px",
                  height: "60px",
                  fontSize: "16px",
                }}
              >
                All Out
              </button>

              <button
                disabled={waitingForBowler || isMatchCompleted}
                onClick={handleUndo}
                style={{
                  width: "60px",
                  height: "60px",
                  fontSize: "16px",
                }}
              >
                Undo
              </button>

              <button
                onClick={handleChangeStrike}
                style={{
                  width: "60px",
                  height: "60px",
                  fontSize: "14px",
                }}
              >
                Change Strike
              </button>
            </div>
          </>
        )}
      </div>

      {showWicketModal && (
        <div style={{ marginTop: "20px", border: "1px solid #eee", padding: "16px" }}>
          <h3>Select Next Batter</h3>

          <select value={nextBatter} onChange={(e) => setNextBatter(e.target.value)}>
            <option value="">Select Player</option>

            {players
              .filter((player) => player._id !== match.striker?._id && player._id !== match.nonStriker?._id)
              .map((player) => (
                <option key={player._id} value={player._id}>
                  {player.name}
                </option>
              ))}
          </select>

          <button onClick={submitWicket} style={{ marginLeft: "10px" }}>
            Submit
          </button>
        </div>
      )}

      {showRunOutModal && (
        <div style={{ marginTop: "20px", border: "1px solid #eee", padding: "16px" }}>
          <h3>Run Out</h3>

          <input
            type="number"
            min="0"
            max="6"
            value={runOutRuns}
            onChange={(e) => setRunOutRuns(Number(e.target.value))}
          />

          <br />
          <br />

          <select value={outPlayer} onChange={(e) => setOutPlayer(e.target.value)}>
            <option value="striker">Striker</option>
            <option value="nonStriker">Non-Striker</option>
          </select>

          <br />
          <br />

          <select value={nextBatter} onChange={(e) => setNextBatter(e.target.value)}>
            <option value="">Select Player</option>

            {players
              .filter((player) => player._id !== match.striker?._id && player._id !== match.nonStriker?._id)
              .map((player) => (
                <option key={player._id} value={player._id}>
                  {player.name}
                </option>
              ))}
          </select>

          <button onClick={submitRunOut} style={{ marginLeft: "10px" }}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
