import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createMatch } from "../services/matchService";

export default function CreateMatchPage() {
  const navigate = useNavigate();

  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [totalOvers, setTotalOvers] = useState("");
  const [firstBattingTeam, setFirstBattingTeam] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamA || !teamB || !totalOvers || !firstBattingTeam) {
      return alert("Please fill all fields");
    }

    try {
      setLoading(true);

      const match = await createMatch({
        teamA,
        teamB,
        totalOvers,
        firstBattingTeam,
      });

      navigate(`/admin/match/${match._id}/score`);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>Create Match</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Team A"
          value={teamA}
          onChange={(e) => {
            setTeamA(e.target.value);

            if (firstBattingTeam === teamB) return;

            setFirstBattingTeam("");
          }}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
          }}
        />

        <input
          type="text"
          placeholder="Team B"
          value={teamB}
          onChange={(e) => {
            setTeamB(e.target.value);

            if (firstBattingTeam === teamA) return;

            setFirstBattingTeam("");
          }}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
          }}
        />

        <input
          type="number"
          placeholder="Overs"
          value={totalOvers}
          onChange={(e) => setTotalOvers(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
          }}
        />

        <select
          value={firstBattingTeam}
          onChange={(e) => setFirstBattingTeam(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
          }}
        >
          <option value="">Select First Batting Team</option>

          {teamA && <option value={teamA}>{teamA}</option>}

          {teamB && <option value={teamB}>{teamB}</option>}
        </select>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
          }}
        >
          {loading ? "Creating..." : "Create Match"}
        </button>
      </form>
    </div>
  );
}
