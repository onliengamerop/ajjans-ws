// api/grief.js
// Ajjans Anti-Grief + Presence API
// Uses Vercel KV (or falls back to in-memory for dev)

let kv;
try {
    const { kv: _kv } = await import("@vercel/kv");
    kv = _kv;
} catch {
    // Fallback in-memory store for local dev
    const store = {};
    kv = {
        get: async (k) => store[k] ?? null,
        set: async (k, v, opts) => { store[k] = v; },
        del: async (k) => { delete store[k]; },
        keys: async (pattern) => Object.keys(store).filter(k => k.startsWith(pattern.replace("*",""))),
        hset: async (k, obj) => { store[k] = { ...(store[k] || {}), ...obj }; },
        hgetall: async (k) => store[k] ?? null,
        zadd: async (k, opts, member) => { 
            store[k] = store[k] || [];
            store[k].push({ score: opts.score || 0, member });
        },
    };
}

const PRESENCE_TTL  = 30;   // seconds before a user is considered offline
const GRIEF_LOG_MAX = 200;  // max grief events to store

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    const { action } = req.query;

    // ── GET /api/grief?action=presence ──────────────────────────────────────
    // Returns list of all currently online Ajjans users
    if (req.method === "GET" && action === "presence") {
        try {
            const keys = await kv.keys("presence:*");
            const now  = Date.now();
            const users = [];

            for (const key of keys) {
                const data = await kv.get(key);
                if (!data) continue;
                const parsed = typeof data === "string" ? JSON.parse(data) : data;
                // Filter out stale entries (in case TTL didn't clean up)
                if (now - (parsed.lastSeen || 0) < PRESENCE_TTL * 1000) {
                    users.push(parsed);
                }
            }

            return res.status(200).json(users);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // ── POST /api/grief?action=heartbeat ────────────────────────────────────
    // Called every ~10s by each client to register/keep alive their presence
    // Body: { username, userId, jobId, placeId }
    if (req.method === "POST" && action === "heartbeat") {
        try {
            const { username, userId, jobId, placeId } = req.body;
            if (!username || !userId) {
                return res.status(400).json({ error: "username and userId required" });
            }

            const entry = {
                username,
                userId: String(userId),
                jobId:  String(jobId || ""),
                placeId: String(placeId || ""),
                lastSeen: Date.now(),
            };

            // Store with TTL so offline users auto-expire
            await kv.set(`presence:${userId}`, JSON.stringify(entry), { ex: PRESENCE_TTL * 2 });

            return res.status(200).json({ ok: true });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // ── POST /api/grief?action=report ────────────────────────────────────────
    // Called when a grief event is detected
    // Body: { griefer, victim, jobId, placeId, timestamp }
    if (req.method === "POST" && action === "report") {
        try {
            const { griefer, victim, jobId, placeId, timestamp } = req.body;
            if (!griefer || !victim) {
                return res.status(400).json({ error: "griefer and victim required" });
            }

            const event = {
                id:        `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
                griefer,
                victim,
                jobId:     String(jobId || ""),
                placeId:   String(placeId || ""),
                timestamp: timestamp || Date.now(),
                processed: false,
            };

            // Append to grief log list (capped)
            const logRaw = await kv.get("grief:log");
            const log    = logRaw ? (typeof logRaw === "string" ? JSON.parse(logRaw) : logRaw) : [];
            log.unshift(event);
            if (log.length > GRIEF_LOG_MAX) log.length = GRIEF_LOG_MAX;
            await kv.set("grief:log", JSON.stringify(log));

            // Track per-griefer count
            const countRaw = await kv.get(`grief:count:${griefer.userId || griefer}`);
            const count    = (countRaw ? Number(countRaw) : 0) + 1;
            await kv.set(`grief:count:${griefer.userId || griefer}`, count);

            return res.status(200).json({ ok: true, event });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // ── GET /api/grief?action=log ────────────────────────────────────────────
    // Returns recent grief events (admin view)
    if (req.method === "GET" && action === "log") {
        try {
            const logRaw = await kv.get("grief:log");
            const log    = logRaw ? (typeof logRaw === "string" ? JSON.parse(logRaw) : logRaw) : [];
            return res.status(200).json(log);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // ── DELETE /api/grief?action=clear ───────────────────────────────────────
    // Clears the grief log
    if (req.method === "DELETE" && action === "clear") {
        try {
            await kv.set("grief:log", JSON.stringify([]));
            return res.status(200).json({ ok: true });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    return res.status(404).json({ error: "Unknown action. Use ?action=presence|heartbeat|report|log|clear" });
}
