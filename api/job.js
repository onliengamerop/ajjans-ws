const servers = [];

module.exports = (req, res) => {
res.setHeader("Access-Control-Allow-Origin", "*");

if (req.method === "POST") {

// SAFE BODY
const body = req.body || {};
const { jobId, brainrot, mps, rarity, mutation, players } = body;

if (jobId && brainrot && mps) {  
  for (let i = servers.length - 1; i >= 0; i--) {  
    if (servers[i].jobId === jobId) {  
      servers.splice(i, 1);  
    }  
  }  

  servers.unshift({  
    jobId,  
    brainrot,  
    mps,  
    rarity: rarity || "Unknown",  
    mutation: mutation || "Normal",  
    players: players || 0,
    timestamp: Date.now(),  
  });  

  if (servers.length > 100) servers.pop();  
}  

return res.status(200).json({ ok: true });

}

if (req.method === "GET") {
const now = Date.now();
const fresh = servers.filter((s) => now - s.timestamp < 30 * 1000);  
return res.status(200).json(fresh);
}

res.status(405).json({ error: "Method not allowed" });
};
