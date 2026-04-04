const servers = [];

export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method === "POST") {
        const { jobId, brainrot, mps } = req.body;
        if (jobId && brainrot && mps) {
            // Only skip if exact same jobId already exists
            const exists = servers.some(s => s.jobId === jobId);
            if (!exists) {
                servers.unshift({ jobId, brainrot, mps, timestamp: Date.now() });
                // Keep only last 100 logs
                if (servers.length > 100) servers.pop();
            }
        }
        return res.status(200).json({ ok: true });
    }

    if (req.method === "GET") {
        // Keep logs for 1 hour not 10 minutes
        const now = Date.now();
        const fresh = servers.filter(s => now - s.timestamp < 60 * 60 * 1000);
        return res.status(200).json(fresh);
    }

    res.status(405).json({ error: "Method not allowed" });
}
