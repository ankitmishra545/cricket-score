import { useEffect, useState } from "react";
import { createPlayer, getPlayers } from "../services/playerService";

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPlayers = async () => {
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      setLoading(true);

      await createPlayer(name);

      setName("");

      fetchPlayers();
    } catch (error) {
      console.error(error);
      alert("Failed to add player");
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
      <h1>Players</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Player Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            cursor: "pointer",
          }}
        >
          {loading ? "Adding..." : "Add Player"}
        </button>
      </form>

      <div style={{ marginTop: "30px" }}>
        {players.map((player) => (
          <div
            key={player._id}
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          >
            {player.name}
          </div>
        ))}
      </div>
    </div>
  );
}
