const servers = [];

export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method === "POST") {
        const { jobId, brainrot, mps } = req.body;
        if (jobId && brainrot && mps) {
            // Always add every execution as new log
            servers.unshift({ 
                jobId, 
                brainrot, 
                mps, 
                timestamp: Date.now() 
            });
            // Keep only last 100 logs
            if (servers.length > 100) servers.pop();
        }
        return res.status(200).json({ ok: true });
    }

    if (req.method === "GET") {
        const now = Date.now();
        const fresh = servers.filter(s => now - s.timestamp < 60 * 60 * 1000);
        return res.status(200).json(fresh);
    }

    res.status(405).json({ error: "Method not allowed" });
}
