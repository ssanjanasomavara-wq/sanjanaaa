// pages/api/session.js
// Use getIronSession (imported from "iron-session") to avoid subpath export issues.
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/sessionOptions";

export default async function handler(req, res) {
  try {
    const session = await getIronSession(req, res, sessionOptions);
    const user = session?.user || null;
    return res.status(200).json({ ok: !!user, user: user || null });
  } catch (err) {
    console.error("Error reading session:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
