// pages/api/logout.js
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/sessionOptions";

export default async function handler(req, res) {
  try {
    const session = await getIronSession(req, res, sessionOptions);
    session.user = undefined;
    await session.save();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
