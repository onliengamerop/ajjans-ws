const servers = [];

export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method === "POST") {
        const { jobId, brainrot, mps } = req.body;
        if (jobId && brainrot && mps) {
            // Remove old entry with same jobId if exists
            const index = servers.findIndex(s => s.jobId === jobId);
            if (index !== -1) servers.splice(index, 1);
            // Add new entry at top
            servers.unshift({ jobId, brainrot, mps, timestamp: Date.now() });
            // Keep only last 50 servers
            if (servers.length > 50) servers.pop();
        }
        return res.status(200).json({ ok: true });
    }

    if (req.method === "GET") {
        // Remove entries older than 10 minutes
        const now = Date.now();
        const fresh = servers.filter(s => now - s.timestamp < 10 * 60 * 1000);
        return res.status(200).json(fresh);
    }

    res.status(405).json({ error: "Method not allowed" });
}
