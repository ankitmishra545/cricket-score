import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getMatch, getScorecard } from "../services/matchService";
import { socket } from "../socket/socket";

import { formatBall } from "../utils/formatBall";

export default function MatchPage() {
  const { id } = useParams();

  const [match, setMatch] = useState(null);
  const [showScorecard, setShowScorecard] = useState(false);
  const [scorecard, setScorecard] = useState(null);

  useEffect(() => {
    loadMatch();
  }, [id]);

  useEffect(() => {
    socket.connect();

    socket.emit("join-match", id);

    const handleMatchUpdate = async (data) => {
      setMatch(data);
    };

    socket.on("match-updated", handleMatchUpdate);

    return () => {
      socket.off("match-updated", handleMatchUpdate);

      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!showScorecard || !match) return;

    loadScorecard();
  }, [match, showScorecard]);

  const loadMatch = async () => {
    const data = await getMatch(id);

    setMatch(data);
  };

  const loadScorecard = async () => {
    const data = await getScorecard(id);

    setScorecard(data);
  };

  if (!match) return <h2>Loading...</h2>;

  const score =
    match.innings === 1 ? `${match.team1Score}/${match.team1Wickets}` : `${match.team2Score}/${match.team2Wickets}`;

  const balls = match.innings === 1 ? match.team1Balls : match.team2Balls;

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
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>
              {match.teamA} vs {match.teamB}
            </h2>

            <p style={{ margin: "6px 0 0", color: "#666" }}>{match.innings === 1 ? "1st Innings" : "2nd Innings"}</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, fontSize: "32px" }}>{score}</h1>

            <p style={{ margin: "6px 0 0", color: "#666" }}>
              Overs: {Math.floor(balls / 6)}.{balls % 6}
            </p>
          </div>
        </div>

        {/* Current Players */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                marginBottom: "8px",
              }}
            >
              STRIKER
            </div>

            <div style={{ fontWeight: 600 }}>{match.striker?.name || "-"}</div>

            <div style={{ marginTop: "6px", color: "#555" }}>
              {match.strikerStats?.runs || 0} / {match.strikerStats?.balls || 0}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                marginBottom: "8px",
              }}
            >
              NON-STRIKER
            </div>

            <div style={{ fontWeight: 600 }}>{match.nonStriker?.name || "-"}</div>

            <div style={{ marginTop: "6px", color: "#555" }}>
              {match.nonStrikerStats?.runs || 0} / {match.nonStrikerStats?.balls || 0}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                marginBottom: "8px",
              }}
            >
              BOWLER
            </div>

            <div style={{ fontWeight: 600 }}>{match.currentBowler?.name || "-"}</div>

            <div style={{ marginTop: "6px", color: "#555" }}>
              {match.currentBowlerStats?.overs || "0.0"} - {match.currentBowlerStats?.runs || 0} -{" "}
              {match.currentBowlerStats?.wickets || 0}
            </div>
          </div>
        </div>

        {/* Recent Balls */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "12px" }}>Recent Balls</h3>

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
                    background: "#fafafa",
                  }}
                >
                  {formatBall(ball)}
                </div>
              ))
            ) : (
              <p style={{ color: "#666" }}>No balls yet</p>
            )}
          </div>
        </div>

        {/* Scorecard Button */}
        <button
          onClick={async () => {
            if (!showScorecard) {
              await loadScorecard();
            }

            setShowScorecard(!showScorecard);
          }}
          style={{
            padding: "10px 16px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            background: "#fff",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {showScorecard ? "Hide Scorecard" : "View Full Scorecard"}
        </button>

        {/* Scorecard */}
        {showScorecard && scorecard && (
          <div style={{ marginTop: "24px" }}>
            <h2 style={{ marginBottom: "16px" }}>Scorecard</h2>

            {/* Batting */}
            <div style={{ marginBottom: "24px" }}>
              <h3>Batting</h3>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Name", "R", "B", "4s", "6s", "SR"].map((head) => (
                        <th
                          key={head}
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {scorecard.batting.map((player) => (
                      <tr key={player.name}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>{player.name}</td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>{player.runs}</td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>{player.balls}</td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>{player.fours}</td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>{player.sixes}</td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>
                          {player.balls ? ((player.runs / player.balls) * 100).toFixed(1) : "0.0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bowling */}
            <div style={{ marginBottom: "24px" }}>
              <h3>Bowling</h3>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Name", "Overs", "Runs", "Wkts", "Eco"].map((head) => (
                        <th
                          key={head}
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {scorecard.bowling.map((player) => (
                      <tr key={player.name}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>{player.name}</td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>
                          {Math.floor(player.balls / 6)}.{player.balls % 6}
                        </td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>{player.runs}</td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>{player.wickets}</td>

                        <td style={{ padding: "12px", borderBottom: "1px solid #f1f1f1" }}>
                          {player.balls ? ((player.runs / player.balls) * 6).toFixed(1) : "0.0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Extras */}
            <div
              style={{
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "16px",
                background: "#fafafa",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Extras</h3>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  color: "#555",
                }}
              >
                <span>WD: {scorecard.extras.wide}</span>

                <span>NB: {scorecard.extras.noball}</span>

                <span>B: {scorecard.extras.bye}</span>

                <span>LB: {scorecard.extras.legbye}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
