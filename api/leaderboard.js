// /api/leaderboard.js
const leaderboard = {}; // In-memory (use KV/DB for persistence)

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    const { username, name, rarity, mutation, traits, generation, mps } = req.body;
    if (!username) return res.status(400).json({ error: "Missing username" });

    if (!leaderboard[username]) {
      leaderboard[username] = { username, steals: 0, mps: 0, lastSteal: null };
    }

    leaderboard[username].steals += 1;
    leaderboard[username].mps = mps || leaderboard[username].mps;
    leaderboard[username].lastSteal = { name, rarity, mutation, traits, generation };
    leaderboard[username].lastUpdated = Date.now();

    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    const sorted = Object.values(leaderboard).sort((a, b) => b.mps - a.mps);
    return res.status(200).json(sorted);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
