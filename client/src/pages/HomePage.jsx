import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getMatches } from "../services/matchService";

export default function HomePage() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await getMatches();
      setMatches(data);
    } catch (error) {
      console.error(error);
    }
  };

  const liveMatches = matches.filter((match) => match.status === "live");

  const completedMatches = matches.filter((match) => match.status === "completed");

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>Live Matches</h1>

      {liveMatches.length === 0 && <p>No live matches</p>}

      {liveMatches.map((match) => (
        <Link
          key={match._id}
          to={`/match/${match._id}`}
          style={{
            display: "block",
            border: "1px solid #ddd",
            padding: "16px",
            marginBottom: "12px",
            textDecoration: "none",
            color: "#000",
          }}
        >
          <h3>
            {match.teamA} vs {match.teamB}
          </h3>

          <p>
            {match.innings === 1
              ? `${match.team1Score}/${match.team1Wickets} (${Math.floor(
                  match.team1Balls / 6,
                )}.${match.team1Balls % 6})`
              : `${match.team2Score}/${match.team2Wickets} (${Math.floor(
                  match.team2Balls / 6,
                )}.${match.team2Balls % 6})`}
          </p>
        </Link>
      ))}

      <h1 style={{ marginTop: "40px" }}>Recent Matches</h1>

      {completedMatches.length === 0 && <p>No completed matches</p>}

      {completedMatches.map((match) => (
        <Link
          key={match._id}
          to={`/match/${match._id}`}
          style={{
            display: "block",
            border: "1px solid #ddd",
            padding: "16px",
            marginBottom: "12px",
            textDecoration: "none",
            color: "#000",
          }}
        >
          <h3>
            {match.teamA} vs {match.teamB}
          </h3>

          <p>{match.result}</p>
        </Link>
      ))}
    </div>
  );
}
