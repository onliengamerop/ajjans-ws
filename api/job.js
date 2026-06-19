// Note: This array resets when Vercel goes to sleep.
export let servers = [];

export default function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const { jobId, brainrot, mps, rarity, trait, mutation, players } = req.body;

    if (jobId && brainrot) {
      // FIX: Only remove the entry if it's the EXACT SAME PET in the SAME server.
      // This stops it from deleting other pets found in the same server.
      for (let i = servers.length - 1; i >= 0; i--) {
        if (servers[i].jobId === jobId && servers[i].brainrot === brainrot) {
          servers.splice(i, 1);
        }
      }

      // Add fresh entry
      servers.unshift({
        jobId,
        brainrot,                 
        mps: mps || "N/A",        
        trait: trait || "N/A",
        rarity: rarity || "Unknown",
        mutation: mutation || "Normal",
        players: players || 0,
        timestamp: Date.now(),
      });

      // Keep only last 100 logs
      if (servers.length > 100) servers.pop();
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    const now = Date.now();
    
    // Filter out servers that are older than 10 minutes (600,000 milliseconds)
    servers = servers.filter((server) => now - server.timestamp < 600000);

    return res.status(200).json(servers);
  }

  // Fallback for unsupported methods
  return res.status(405).json({ error: "Method not allowed" });
}
