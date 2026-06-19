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
    // Added 'trait' to match the Lua script payload
    const { jobId, brainrot, mps, rarity, trait, mutation, players } = req.body;

    if (jobId && brainrot) {
      // Remove ALL previous entries with same jobId
      for (let i = servers.length - 1; i >= 0; i--) {
        if (servers[i].jobId === jobId) {
          servers.splice(i, 1);
        }
      }

      // Add fresh entry
      servers.unshift({
        jobId,
        brainrot,                 // Contains the Pet Name
        mps: mps || "N/A",        // Contains the Pet Price
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
    // Adjust the 600000 number if you want them to stay on the list longer or shorter
    servers = servers.filter((server) => now - server.timestamp < 600000);

    return res.status(200).json(servers);
  }

  // Fallback for unsupported methods
  return res.status(405).json({ error: "Method not allowed" });
}
