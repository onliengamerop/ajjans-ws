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
      // Remove entry if it is the same pet in the same server
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
        rarity: rarity || "Unknown",
        trait: trait || "N/A",
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
    
    // Filter: Remove logs older than 20 seconds (20,000 milliseconds)
    servers = servers.filter((server) => now - server.timestamp < 20000);

    return res.status(200).json(servers);
  }

  // Fallback for unsupported methods
  return res.status(405).json({ error: "Method not allowed" });
}
