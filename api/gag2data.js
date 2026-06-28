// /api/gag2data.js
export default async function handler(req, res) {
  try {
    const response = await fetch("https://luminon.top/gag2/");
    
    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch source", status: response.status });
    }

    const html = await response.text();

    // Regex explanation:
    // let\s+DATA : Matches "let" followed by one or more spaces, then "DATA"
    // \s*=\s* : Matches the equals sign with optional surrounding whitespace
    // (\{[\s\S]*?\}) : Capture group 1: { ... } containing everything including newlines, non-greedily
    // ;          : Matches the closing semicolon
    const regex = /let\s+DATA\s*=\s*(\{[\s\S]*?\});/i;
    const match = html.match(regex);

    if (!match || !match[1]) {
      // If this fails, the structure on the target site has changed significantly
      return res.status(502).json({ 
        error: "DATA block not found", 
        debug_preview: html.substring(0, 200) // Helpful for debugging
      });
    }

    const jsonStr = match[1];
    const parsed = JSON.parse(jsonStr);

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ 
      error: "fetch_failed", 
      message: err.message 
    });
  }
}
