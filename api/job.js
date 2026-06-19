// WARNING: This array will still reset randomly when Vercel spins down or scales.
// For a production app, replace this array with a Redis database (e.g., Upstash).
let servers = []; 

export default function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const now = Date.now();
  const EXPIRY_MS = 20000; // 20 seconds

  if (req.method === "POST") {
    const { jobId, brainrot, mps, rarity, trait, mutation, players } = req.body;

    if (jobId && brainrot) {
      // Remove the exact same pet in the same server if it already exists
      servers = servers.filter(
        (server) => !(server.jobId === jobId && server.brainrot === brainrot)
      );

      // Add fresh entry
      servers.unshift({
        jobId,
        brainrot,                 
        mps: mps || "N/A",        
        trait: trait || "N/A",
        rarity: rarity || "Unknown",
        mutation: mutation || "Normal",
        players: players || 0,
        timestamp: now,
      });

      // Proactively clear out any logs older than 20 seconds during POST to keep array light
      servers = servers.filter((server) => now - server.timestamp < EXPIRY_MS);

      // Keep max 100 logs safety net
      if (servers.length > 100) {
        servers = servers.slice(0, 100);
      }
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    // Filter out servers that are older than 20 seconds
    servers = servers.filter((server) => now - server.timestamp < EXPIRY_MS);

    return res.status(200).json(servers);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
