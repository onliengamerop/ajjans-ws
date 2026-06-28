// /api/gag2data.js
export default async function handler(req, res) {
  try {
    const response = await fetch("https://luminon.top/gag2/");
    const html = await response.text();

    const dataMarker = "let DATA";
    const startIdx = html.indexOf(dataMarker);
    if (startIdx === -1) {
      return res.status(502).json({ error: "DATA marker not found" });
    }

    const eqIdx = html.indexOf("=", startIdx);
    let closeIdx = html.indexOf("};\r\nlet PERIOD", eqIdx);
    if (closeIdx === -1) closeIdx = html.indexOf("};\nlet PERIOD", eqIdx);
    if (closeIdx === -1) closeIdx = html.indexOf("};\r\n", eqIdx);
    if (closeIdx === -1) closeIdx = html.indexOf("};\n", eqIdx);

    if (closeIdx === -1) {
      return res.status(502).json({ error: "DATA close marker not found" });
    }

    const jsonStr = html.slice(eqIdx + 1, closeIdx + 1).trim();
    const parsed = JSON.parse(jsonStr);

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "fetch_failed", message: String(err) });
  }
                                   }
