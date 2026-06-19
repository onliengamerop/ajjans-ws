// WARNING: This array will still reset randomly when Vercel spins down or scales.
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
  const EXPIRY_MS = 30000; // 30 seconds

  if (req.method === "POST") {
    // FIXED: Now actually extracting rarity, trait, and mutation from the payload
    const { jobId, brainrot, mps, players, rarity, trait, mutation } = req.body;

    if (jobId && brainrot) {
      // Add fresh entry with ALL data
      servers.unshift({
        jobId,
        brainrot,                 
        mps: mps || "N/A",        
        players: players || 0,
        rarity: rarity || "Unknown",
        trait: trait || "N/A",
        mutation: mutation || "Normal",
        timestamp: now,
      });

      // Proactively clear out any logs older than 30 seconds
      servers = servers.filter((server) => now - server.timestamp < EXPIRY_MS);

      // Keep max 100 logs safety net
      if (servers.length > 100) {
        servers = servers.slice(0, 100);
      }
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    // Filter out servers that are older than 30 seconds
    servers = servers.filter((server) => now - server.timestamp < EXPIRY_MS);

    return res.status(200).json(servers);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
